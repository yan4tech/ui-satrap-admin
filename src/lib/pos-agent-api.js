export function getPosAgentBaseUrl() {
  const fromEnv = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_POS_AGENT_URL : '';
  const trimmed = (fromEnv || '').trim().replace(/\/$/, '');
  // Dev/default: same-origin proxy via Next (see next.config rewrites).
  return trimmed || '/api/pos-agent';
}

async function parsePosResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `POS agent error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/**
 * @param {{ requestId: string, amount: string|number, payerId?: string, merchantMsg?: string }} input
 */
export async function posDebitPurchase(input) {
  const res = await fetch(`${getPosAgentBaseUrl()}/v1/pos/debit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: input.requestId,
      amount: String(input.amount),
      payer_id: input.payerId || undefined,
      merchant_msg: input.merchantMsg || undefined,
    }),
  });
  const envelope = await parsePosResponse(res);
  const data = envelope?.data && typeof envelope.data === 'object' ? envelope.data : {};
  const transport = String(envelope?.transport ?? '').trim() || 'unknown';
  if (String(data.ReturnCode) !== '100') {
    throw new Error(posErrorMessage(data, envelope?.error));
  }
  return { data, transport };
}

export async function posVerify(traceNumber, requestId) {
  const res = await fetch(`${getPosAgentBaseUrl()}/v1/pos/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trace_number: traceNumber,
      request_id: requestId || undefined,
    }),
  });
  const envelope = await parsePosResponse(res);
  return envelope?.data || {};
}

export async function posReverse(traceNumber, requestId) {
  const res = await fetch(`${getPosAgentBaseUrl()}/v1/pos/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trace_number: traceNumber,
      request_id: requestId || undefined,
    }),
  });
  const envelope = await parsePosResponse(res);
  return envelope?.data || {};
}

/** @returns {Promise<{ online: boolean, mode?: string, tcpPort?: number, inlineMockOnly?: boolean }>} */
export async function fetchPosAgentStatus() {
  try {
    const res = await fetch(`${getPosAgentBaseUrl()}/health`, { method: 'GET' });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return {
      online: data?.status === 'ok',
      mode: data?.mode ? String(data.mode) : undefined,
      tcpPort: data?.tcp_listen_port != null ? Number(data.tcp_listen_port) : undefined,
      inlineMockOnly: data?.inline_mock_only === true,
    };
  } catch {
    return { online: false };
  }
}

export async function checkPosAgentHealth() {
  const status = await fetchPosAgentStatus();
  return status.online;
}

function posErrorMessage(data, fallback) {
  const fromAgent = String(fallback ?? '').trim();
  if (fromAgent) return fromAgent;
  const code = String(data?.ReturnCode ?? '').trim();
  if (code === '101') return 'پوز در دسترس نیست یا پورت اشتباه است.';
  if (code === '109') return 'درخواست نامعتبر برای پوز.';
  if (code === '110') return 'عملیات پوز پشتیبانی نمی‌شود.';
  if (code) return `پرداخت ناموفق (کد ${code}).`;
  return 'پرداخت ناموفق بود.';
}

export function buildPosRequestId(processInstanceId, taskId, stepId) {
  const pid = processInstanceId != null ? String(processInstanceId) : '0';
  const tid = taskId != null ? String(taskId) : '0';
  const sid = stepId ? String(stepId) : 'payment';
  const suffix = Math.random().toString(36).slice(2, 10);
  return `proc-${pid}-${sid}-${tid}-${suffix}`;
}

export function extractPaymentDueAmount(instance) {
  if (!instance || typeof instance !== 'object') return 0;
  const vars = instance.variables && typeof instance.variables === 'object' ? instance.variables : {};
  const due = vars.payment_due && typeof vars.payment_due === 'object' ? vars.payment_due : null;
  const fromDue = due?.amount;
  if (fromDue != null && Number(fromDue) > 0) return Number(fromDue);
  const fee = vars.fee_amount;
  if (fee != null && Number(fee) > 0) return Number(fee);
  return 0;
}

export function maskPan(pan) {
  const raw = String(pan || '').replace(/\s/g, '');
  if (raw.length < 10) return raw;
  return `${raw.slice(0, 6)}******${raw.slice(-4)}`;
}

export function buildEnginePayloadFromPos(data, stepId) {
  const trace = String(data?.TraceNumber ?? '').trim();
  const requestId = String(data?.RequestID ?? '').trim();
  const pan = maskPan(data?.PAN);
  return {
    payment_gateway: 'pc2pos',
    transaction_id: trace,
    reference_id: requestId,
    card_number: pan,
    pos_return_code: String(data?.ReturnCode ?? ''),
    pos_trace_number: trace,
    pos_pan: pan,
    pos_terminal_no: String(data?.TerminalNo ?? ''),
    pos_request_id: requestId,
    pos_serial_transaction: String(data?.SerialTransaction ?? ''),
    pos_transaction_date: String(data?.TransactionDate ?? ''),
    pos_transaction_time: String(data?.TransactionTime ?? ''),
    pos_payment_gateway: 'pc2pos',
    process_step_id: stepId || 'payment',
  };
}
