import { getProcessDefinition } from 'src/lib/integration-api';

/** @typedef {{ id: string, name: string, type: string }} BpmnStep */

/** @type {Record<string, { name: string, startId: string, elements: Record<string, { id: string, name: string, type: string }>, flows: { from: string, to: string }[] }>} */
export const PROCESS_BPMN_MODELS = {
  service1: {
    name: 'خدمت شماره یک (khedmat1)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      generate: { id: 'generate', name: 'Generate ID & Calculate Fee', type: 'SERVICE_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      form1: { id: 'form1', name: 'Fill Form 1', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      sendAgency1: { id: 'sendAgency1', name: 'Send To Agency', type: 'SERVICE_TASK' },
      enterCode: { id: 'enterCode', name: 'Enter SMS Code', type: 'USER_TASK' },
      payment1: { id: 'payment1', name: 'Receive Payment1', type: 'USER_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      sendAgency2: { id: 'sendAgency2', name: 'Final Send To Agency', type: 'SERVICE_TASK' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'generate' },
      { from: 'generate', to: 'payment' },
      { from: 'payment', to: 'form1' },
      { from: 'form1', to: 'review1' },
      { from: 'review1', to: 'sendAgency1' },
      { from: 'sendAgency1', to: 'enterCode' },
      { from: 'enterCode', to: 'payment1' },
      { from: 'payment1', to: 'form2' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'sendAgency2' },
      { from: 'sendAgency2', to: 'end' },
    ],
  },
  service2: {
    name: 'خدمت شماره دو (khedmat2)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      generate: { id: 'generate', name: 'Generate ID & Calculate Fee', type: 'SERVICE_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      form1: { id: 'form1', name: 'Fill Form 1', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      sendAgency: { id: 'sendAgency', name: 'Send To Agency', type: 'SERVICE_TASK' },
      tracking: { id: 'tracking', name: 'Show Registry Response', type: 'USER_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'generate' },
      { from: 'generate', to: 'payment' },
      { from: 'payment', to: 'form1' },
      { from: 'form1', to: 'review1' },
      { from: 'review1', to: 'sendAgency' },
      { from: 'sendAgency', to: 'tracking' },
      { from: 'tracking', to: 'form2' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'end' },
    ],
  },
  service3: {
    name: 'خدمت شماره سه (khedmat3)',
    startId: 'start',
    elements: {
      start: { id: 'start', name: 'Start', type: 'USER_TASK' },
      payment: { id: 'payment', name: 'Receive Payment', type: 'USER_TASK' },
      form1: { id: 'form1', name: 'Fill Form 1', type: 'USER_TASK' },
      review1: { id: 'review1', name: 'Central Review Form 1', type: 'SERVICE_REVIEW' },
      sendAgency: { id: 'sendAgency', name: 'Send To Agency', type: 'SERVICE_TASK' },
      tracking: { id: 'tracking', name: 'Show Registry Response', type: 'USER_TASK' },
      form2: { id: 'form2', name: 'Fill Form 2', type: 'USER_TASK' },
      review2: { id: 'review2', name: 'Central Review Form 2', type: 'SERVICE_REVIEW' },
      end: { id: 'end', name: 'End', type: 'END_EVENT' },
    },
    flows: [
      { from: 'start', to: 'payment' },
      { from: 'payment', to: 'form1' },
      { from: 'form1', to: 'review1' },
      { from: 'review1', to: 'sendAgency' },
      { from: 'sendAgency', to: 'tracking' },
      { from: 'tracking', to: 'form2' },
      { from: 'form2', to: 'review2' },
      { from: 'review2', to: 'end' },
    ],
  },
};

const TYPE_LABELS = {
  USER_TASK: 'User Task',
  SERVICE_TASK: 'Service Task',
  SERVICE_REVIEW: 'Service Review',
  START_EVENT: 'Start',
  END_EVENT: 'End',
  EXCLUSIVE_GATEWAY: 'Gateway',
};

export function processBpmnTypeLabel(type) {
  return TYPE_LABELS[type] ?? type ?? '—';
}

/** @type {Record<string, ReturnType<typeof normalizeApiBpmnModel>>} */
const apiBpmnModelCache = {};

/** @param {Record<string, unknown>|null|undefined} bpmn */
export function normalizeApiBpmnModel(bpmn) {
  if (!bpmn || typeof bpmn !== 'object') return null;

  const rawElements = bpmn.elements ?? bpmn.Elements ?? {};
  const elements = {};
  Object.entries(rawElements).forEach(([id, el]) => {
    if (!el || typeof el !== 'object') return;
    const elementId = String(el.id ?? el.ID ?? id);
    elements[elementId] = {
      id: elementId,
      name: String(el.name ?? el.Name ?? elementId),
      type: String(el.type ?? el.Type ?? ''),
    };
  });

  const rawFlows = bpmn.flows ?? bpmn.Flows ?? [];
  const flows = (Array.isArray(rawFlows) ? rawFlows : [])
    .map((flow) => {
      if (!flow || typeof flow !== 'object') return null;
      const from = String(flow.from ?? flow.From ?? '').trim();
      const to = String(flow.to ?? flow.To ?? '').trim();
      if (!from || !to) return null;
      return { from, to };
    })
    .filter(Boolean);

  const startId = String(bpmn.start_id ?? bpmn.startId ?? bpmn.StartID ?? bpmn.StartId ?? '').trim();
  if (!startId || Object.keys(elements).length === 0) return null;

  return {
    name: String(bpmn.name ?? bpmn.Name ?? ''),
    startId,
    elements,
    flows,
  };
}

function stepsFromModel(model) {
  if (!model) return [];

  const order = [];
  const seen = new Set();
  const adjacency = new Map();

  model.flows.forEach(({ from, to }) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  });

  const walk = (nodeId) => {
    if (seen.has(nodeId)) return;
    seen.add(nodeId);
    order.push(nodeId);
    (adjacency.get(nodeId) ?? []).forEach(walk);
  };

  walk(model.startId);

  Object.keys(model.elements).forEach((id) => {
    if (!seen.has(id)) order.push(id);
  });

  return order
    .map((id) => model.elements[id])
    .filter(Boolean)
    .map((el) => ({ id: el.id, name: el.name, type: el.type }));
}

/** @param {string} processKey */
export function getProcessBpmnModel(processKey) {
  const key = String(processKey ?? '').trim();
  if (!key) return null;
  return PROCESS_BPMN_MODELS[key] ?? apiBpmnModelCache[key] ?? null;
}

/** @param {string} processKey @returns {BpmnStep[]} */
export function getProcessBpmnSteps(processKey) {
  return stepsFromModel(getProcessBpmnModel(processKey));
}

/** بارگذاری مدل BPMN — ابتدا cache محلی، سپس API موتور */
export async function loadProcessBpmnModel(processKey) {
  const key = String(processKey ?? '').trim();
  if (!key) return null;

  const cached = getProcessBpmnModel(key);
  if (cached) return cached;

  try {
    const detail = await getProcessDefinition(key);
    const model = normalizeApiBpmnModel(detail?.bpmn_json);
    if (model) {
      if (!model.name && detail?.name) {
        model.name = detail.name;
      }
      apiBpmnModelCache[key] = model;
      return model;
    }
  } catch {
    /* fallback: no model */
  }
  return null;
}

/** مراحل BPMN — با fallback به API اگر در cache UI نباشد */
export async function loadProcessBpmnSteps(processKey) {
  const model = await loadProcessBpmnModel(processKey);
  return stepsFromModel(model);
}

/** پیشنهاد hook_type بر اساس نوع مرحله */
export function suggestHookType(step) {
  if (!step) return 'service_task';
  if (step.type === 'EXCLUSIVE_GATEWAY') return 'gateway_condition';
  if (step.type === 'SERVICE_TASK') return 'service_task';
  if (step.type === 'USER_TASK' && /^payment/i.test(step.id)) return 'step_complete';
  if (step.type === 'SERVICE_REVIEW') return 'step_complete';
  return 'step_enter';
}

/** @deprecated از listProcessDefinitions() استفاده کنید */
export const PROCESS_KEY_OPTIONS = [
  { value: 'service1', label: 'خدمت شماره یک' },
  { value: 'service2', label: 'خدمت شماره دو' },
  { value: 'service3', label: 'خدمت شماره سه' },
];

/** تبدیل تعاریف API به گزینه‌های selector */
export function processDefinitionsToOptions(definitions) {
  return (definitions ?? []).map((def) => ({
    value: def.key,
    label: def.name || def.key,
  }));
}
