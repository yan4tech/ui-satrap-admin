'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';

import { ServiceLabel } from 'src/components/service-label';

import { fetchProcessInstance } from 'src/app/dashboard/services/one/engine-api';
import {
  buildEnginePayloadFromPos,
  buildPosRequestId,
  extractPaymentDueAmount,
  fetchPosAgentStatus,
  getPosAgentBaseUrl,
  posDebitPurchase,
} from 'src/lib/pos-agent-api';

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return new Intl.NumberFormat('fa-IR').format(n);
}

export default function PosPaymentStep({
  processInstanceId,
  task,
  stepId = 'payment',
  serviceLabel = 'خدمت',
  onEngineSubmit,
  engineSubmitting = false,
  engineSubmitError = null,
  finalSubmitDisabled = false,
}) {
  const [amount, setAmount] = useState(0);
  const [amountLoading, setAmountLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [agentStatus, setAgentStatus] = useState({ online: null });
  const [paying, setPaying] = useState(false);
  const [localError, setLocalError] = useState('');
  const [lastSuccess, setLastSuccess] = useState(null);

  const taskId = task?.ID ?? task?.id;
  const elKey = task?.element_id ? String(task.element_id).trim().toLowerCase() : stepId;
  const busy = paying || engineSubmitting;
  const locked = finalSubmitDisabled || busy;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAmountLoading(true);
      setAmountError('');
      try {
        if (processInstanceId == null) {
          setAmount(0);
          return;
        }
        const instance = await fetchProcessInstance(processInstanceId);
        if (cancelled) return;
        const due = extractPaymentDueAmount(instance);
        if (due <= 0) {
          setAmount(0);
          setAmountError('مبلغ قابل پرداخت از موتور دریافت نشد. ابتدا مراحل قبلی را تکمیل کنید.');
        } else {
          setAmount(due);
        }
      } catch {
        if (!cancelled) {
          setAmountError('خطا در دریافت مبلغ از موتور فرایند.');
        }
      } finally {
        if (!cancelled) setAmountLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [processInstanceId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await fetchPosAgentStatus();
      if (!cancelled) setAgentStatus(status);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePay = useCallback(async () => {
    if (locked || amount <= 0 || !onEngineSubmit) return;
    setLocalError('');
    setPaying(true);
    try {
      const requestId = buildPosRequestId(processInstanceId, taskId, elKey);
      const { data: posData, transport } = await posDebitPurchase({
        requestId,
        amount: String(amount),
        merchantMsg: `process ${processInstanceId ?? ''}`.trim(),
      });
      if (transport === 'inline') {
        throw new Error(
          'پرداخت فقط در حالت mock داخلی انجام شد. pos-agent را با POS_AGENT_MODE=both اجرا کنید و پورت TCP را 1025 بگذارید.',
        );
      }
      if (transport !== 'tcp') {
        throw new Error(`مسیر پرداخت نامعتبر است (${transport}). اتصال TCP به PC2POS برقرار نشد.`);
      }
      const enginePayload = buildEnginePayloadFromPos(posData, elKey);
      const ok = await onEngineSubmit(enginePayload);
      if (ok === false) {
        return;
      }
      setLastSuccess({
        trace: enginePayload.pos_trace_number,
        pan: enginePayload.pos_pan,
        transport,
      });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'خطا در پرداخت.');
    } finally {
      setPaying(false);
    }
  }, [amount, elKey, locked, onEngineSubmit, processInstanceId, taskId]);

  const displayError = localError || engineSubmitError;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        پرداخت با کارت (POS)
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <ServiceLabel label={serviceLabel} variant="default" sx={{ color: 'text.secondary' }} />
        <Typography variant="h6" fontWeight={700}>
          مبلغ قابل پرداخت:{' '}
          {amountLoading ? <CircularProgress size={18} sx={{ ml: 1, verticalAlign: 'middle' }} /> : `${formatPrice(amount)} ریال`}
        </Typography>
      </Stack>

      {amountError ? <Alert severity="warning" sx={{ mb: 2 }}>{amountError}</Alert> : null}
      {agentStatus.online === false ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          سرویس POS روی این رایانه در دسترس نیست ({getPosAgentBaseUrl()}). ابتدا pos-agent را اجرا کنید.
        </Alert>
      ) : null}
      {agentStatus.online === true ? (
        <Alert severity="success" sx={{ mb: 2 }} variant="outlined">
          اتصال به POS Agent برقرار است
          {agentStatus.tcpPort ? ` — TCP پورت ${agentStatus.tcpPort}` : ''}
          {agentStatus.mode ? ` — mode: ${agentStatus.mode}` : ''}
          {agentStatus.inlineMockOnly ? ' (فقط mock — برای پرداخت واقعی mode=both)' : ''}
        </Alert>
      ) : null}

      {lastSuccess ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          پرداخت موفق (TCP) — پیگیری: {lastSuccess.trace}
          {lastSuccess.pan ? ` — کارت: ${lastSuccess.pan}` : ''}
        </Alert>
      ) : null}

      {displayError ? <Alert severity="error" sx={{ mb: 2 }}>{displayError}</Alert> : null}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        پس از زدن «پرداخت»، درخواست از طریق pos-agent روی TCP (پورت{' '}
        {agentStatus.tcpPort ?? 1025}) ارسال می‌شود. پنجرهٔ POS_PC Simulator برای تست دستی است و با
        پرداخت وب به‌صورت خودکار پر نمی‌شود.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        disabled={locked || amount <= 0 || amountLoading || agentStatus.online === false}
        onClick={() => void handlePay()}
        startIcon={paying ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {paying ? 'در انتظار کارت روی POS…' : 'پرداخت'}
      </Button>
    </Box>
  );
}
