'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { Icon } from '@iconify/react';

import { useIntegrationToast } from 'src/components/integration-toast/integration-toast-provider';
import { useAuthContext } from 'src/auth/hooks';
import { paths } from 'src/routes/paths';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  createProcessBinding,
  deleteProcessBinding,
  getIntegrationAction,
  listAllIntegrationActions,
  listProcessBindings,
  listProcessDefinitions,
  updateProcessBinding,
} from 'src/lib/integration-api';

import { CompensationEditor } from '../../../_components/CompensationEditor';
import { MappingEditor } from '../../../_components/MappingEditor';
import { PollConfigForm } from '../../../_components/PollConfigForm';
import {
  buildCompensationJson,
  compensationConfigIsEmpty,
  parseCompensationConfig,
} from '../../../_lib/compensation-labels';
import {
  loadProcessBpmnModel,
  loadProcessBpmnSteps,
  processBpmnTypeLabel,
  processDefinitionsToOptions,
  suggestHookType,
} from '../../../_lib/process-bpmn-steps';
import {
  buildBindingMappingJson,
  formatOutputMappingJson,
  HOOK_TYPES,
  hookTypeDescription,
  hookTypeLabel,
  INTEGRATION_MODES,
  integrationModeLabel,
  parseBindingMapping,
  parseOutputMappingJson,
  validatePollConfig,
} from '../../../_lib/process-binding-labels';

const monoFieldSx = {
  '& textarea, & input': {
    fontFamily: 'monospace',
    direction: 'ltr',
    textAlign: 'left',
  },
};

/**
 * @param {{
 *   step: { id: string, name: string, type: string },
 *   processKey: string,
 *   actions: Array<{ id: number, name: string, action_key: string, connector_name?: string }>,
 *   bindings: Array<ReturnType<typeof import('src/lib/integration-api').normalizeProcessBinding>>,
 *   onSaved: () => void,
 * }} props
 */
function StepBindingPanel({ step, processKey, actions, bindings, onSaved, toast }) {
  const [hookType, setHookType] = useState(() => bindings[0]?.hook_type || suggestHookType(step));
  const binding = useMemo(
    () => bindings.find((b) => b.hook_type === hookType) ?? null,
    [bindings, hookType]
  );
  const [actionId, setActionId] = useState(binding?.action_id || '');
  const [mode, setMode] = useState(binding?.mode || 'sync');
  const [inputMapping, setInputMapping] = useState(() => parseBindingMapping(binding?.mapping_json).input);
  const [outputMappingText, setOutputMappingText] = useState(() =>
    formatOutputMappingJson(parseBindingMapping(binding?.mapping_json).output)
  );
  const [inputSchema, setInputSchema] = useState(null);
  const [pollConfig, setPollConfig] = useState(() => parseBindingMapping(binding?.mapping_json).poll);
  const [compensation, setCompensation] = useState(() => parseCompensationConfig(binding?.compensation_json));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (bindings.length && !bindings.some((b) => b.hook_type === hookType)) {
      setHookType(bindings[0].hook_type);
    }
  }, [bindings, hookType]);

  useEffect(() => {
    setActionId(binding?.action_id || '');
    setMode(binding?.mode || 'sync');
    const parsed = parseBindingMapping(binding?.mapping_json);
    setInputMapping(parsed.input);
    setOutputMappingText(formatOutputMappingJson(parsed.output));
    setPollConfig(parsed.poll);
    setCompensation(parseCompensationConfig(binding?.compensation_json));
  }, [binding]);

  useEffect(() => {
    let cancelled = false;
    async function loadSchema() {
      if (!actionId) {
        setInputSchema(null);
        return;
      }
      try {
        const action = await getIntegrationAction(actionId);
        if (!cancelled) setInputSchema(action?.input_schema_json ?? null);
      } catch {
        if (!cancelled) setInputSchema(null);
      }
    }
    loadSchema();
    return () => {
      cancelled = true;
    };
  }, [actionId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (!actionId) throw new Error('انتخاب action الزامی است');
      if (mode === 'poll') validatePollConfig(pollConfig);
      const outputMapping = parseOutputMappingJson(outputMappingText);
      const parsedMapping = parseBindingMapping(binding?.mapping_json);
      const mappingJson =
        mode === 'poll'
          ? buildBindingMappingJson(inputMapping, outputMapping, pollConfig, parsedMapping.meta)
          : buildBindingMappingJson(inputMapping, outputMapping);
      const payload = {
        action_id: Number(actionId),
        mode,
        hook_type: hookType,
        mapping_json: mappingJson,
        compensation_json: buildCompensationJson(compensation),
        is_active: true,
      };

      if (binding?.id) {
        await updateProcessBinding(binding.id, payload);
        setSuccess('اتصال به‌روزرسانی شد.');
        toast?.showSuccess?.('اتصال به‌روزرسانی شد.');
      } else {
        await createProcessBinding({
          process_key: processKey,
          step_id: step.id,
          ...payload,
        });
        setSuccess('اتصال ایجاد شد.');
        toast?.showSuccess?.('اتصال ایجاد شد.');
      }
      onSaved();
    } catch (err) {
      const msg = err?.message || 'خطا در ذخیره';
      setError(msg);
      toast?.showError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!binding?.id) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteProcessBinding(binding.id);
      setDeleteOpen(false);
      setActionId('');
      setMode('sync');
      setInputMapping({});
      setOutputMappingText('{}');
      setPollConfig({});
      setCompensation({ actions: [] });
      setSuccess('binding حذف شد.');
      toast?.showSuccess?.('binding با موفقیت حذف شد.');
      onSaved();
    } catch (err) {
      const msg = err?.message || 'خطا در حذف binding';
      setError(msg);
      toast?.showError?.(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack spacing={2}>
      {binding?.id ? (
        <Chip size="small" color="success" label={`Binding #${binding.id} · v${binding.version}`} />
      ) : (
        <Chip size="small" variant="outlined" label="بدون binding" />
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel>Hook type</InputLabel>
          <Select value={hookType} label="Hook type" onChange={(e) => setHookType(e.target.value)}>
            {HOOK_TYPES.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
          {hookTypeDescription(hookType) ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {hookTypeDescription(hookType)}
            </Typography>
          ) : null}
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Action</InputLabel>
          <Select value={actionId} label="Action" onChange={(e) => setActionId(e.target.value)}>
            <MenuItem value="">
              <em>— انتخاب —</em>
            </MenuItem>
            {actions.map((action) => (
              <MenuItem key={action.id} value={action.id}>
                {action.action_key} — {action.name}
                {action.connector_name ? ` (${action.connector_name})` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Mode</InputLabel>
          <Select value={mode} label="Mode" onChange={(e) => setMode(e.target.value)}>
            {INTEGRATION_MODES.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <MappingEditor
        value={inputMapping}
        onChange={setInputMapping}
        inputSchema={inputSchema}
        processKey={processKey}
        stepId={step.id}
      />

      {mode === 'poll' ? (
        <PollConfigForm value={pollConfig} onChange={setPollConfig} actions={actions} disabled={saving} />
      ) : null}

      <TextField
        fullWidth
        multiline
        minRows={5}
        label="Output mapping (JSON)"
        value={outputMappingText}
        onChange={(e) => setOutputMappingText(e.target.value)}
        helperText='کلید = عبارت JSONata روی response، مقدار = نام متغیر هدف (مثال: "body.status": "registry_status")'
        sx={monoFieldSx}
      />

      <CompensationEditor value={compensation} onChange={setCompensation} actions={actions} disabled={saving} />

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Stack direction="row" spacing={1}>
        <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
          ذخیره binding
        </LoadingButton>
        {binding?.id ? (
          <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)}>
            حذف binding
          </Button>
        ) : null}
      </Stack>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>حذف binding</DialogTitle>
        <DialogContent>
          <DialogContentText>
            binding مرحله «{step.id}» با hook «{hookTypeLabel(hookType)}» حذف می‌شود. این عمل قابل بازگشت
            نیست.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setDeleteOpen(false)}>
            انصراف
          </Button>
          <LoadingButton color="error" variant="contained" loading={deleting} onClick={handleDelete}>
            حذف
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default function ProcessIntegrationsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const processKey = String(params?.processKey ?? '').trim();
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);
  const toast = useIntegrationToast();

  const [bindings, setBindings] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [steps, setSteps] = useState([]);
  const [processOptions, setProcessOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedStep, setExpandedStep] = useState(() => searchParams.get('step') || false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!processKey) {
        setModel(null);
        setSteps([]);
        setModelLoading(false);
        return;
      }
      setModelLoading(true);
      try {
        const [loadedModel, loadedSteps, definitions] = await Promise.all([
          loadProcessBpmnModel(processKey),
          loadProcessBpmnSteps(processKey),
          listProcessDefinitions(),
        ]);
        if (!cancelled) {
          setModel(loadedModel);
          setSteps(loadedSteps);
          setProcessOptions(processDefinitionsToOptions(definitions));
        }
      } catch {
        if (!cancelled) {
          setModel(null);
          setSteps([]);
        }
      } finally {
        if (!cancelled) setModelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [processKey]);

  const bindingsByStep = useMemo(() => {
    const map = new Map();
    bindings.forEach((b) => {
      const list = map.get(b.step_id) ?? [];
      list.push(b);
      map.set(b.step_id, list);
    });
    return map;
  }, [bindings]);

  const loadData = useCallback(async () => {
    if (!allowed || !processKey) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const [bindingRes, actionList] = await Promise.all([
        listProcessBindings(processKey),
        listAllIntegrationActions(),
      ]);
      setBindings(bindingRes.items);
      setActions(actionList);
    } catch (error) {
      setErrorMessage(error?.message || 'خطا در بارگذاری bindings');
      setBindings([]);
    } finally {
      setLoading(false);
    }
  }, [allowed, processKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const step = searchParams.get('step');
    if (step) {
      setExpandedStep(step);
    }
  }, [searchParams]);

  const resolvePrimaryBinding = useCallback(
    (step) => {
      const list = bindingsByStep.get(step.id) ?? [];
      const preferredHook = suggestHookType(step);
      return list.find((b) => b.hook_type === preferredHook) ?? list[0] ?? null;
    },
    [bindingsByStep]
  );

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">فقط مدیر مرکزی (central-admin) به Process Binding دسترسی دارد.</Alert>
      </Box>
    );
  }

  if (modelLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">در حال بارگذاری تعریف فرایند…</Typography>
      </Box>
    );
  }

  if (!model) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">فرایند «{processKey || '—'}» پشتیبانی نمی‌شود یا در موتور تعریف نشده است.</Alert>
        {processOptions.length > 0 ? (
          <FormControl size="small" sx={{ mt: 2, minWidth: 240 }}>
            <InputLabel id="process-fallback-select">فرایند دیگر</InputLabel>
            <Select
              labelId="process-fallback-select"
              label="فرایند دیگر"
              value=""
              onChange={(e) =>
                router.push(paths.dashboard.admin.integration.processIntegrations(e.target.value))
              }
            >
              {processOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <IconButtonBack router={router} />
            <Typography variant="h5">Process Binding</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={model.name} size="small" />
            <Chip label={processKey} size="small" variant="outlined" color="info" sx={{ fontFamily: 'monospace' }} />
            <Chip label={`${bindings.length} binding`} size="small" variant="outlined" />
          </Stack>
        </Box>
        {processOptions.length > 0 ? (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="process-select-label">فرایند</InputLabel>
            <Select
              labelId="process-select-label"
              label="فرایند"
              value={processKey}
              onChange={(e) =>
                router.push(paths.dashboard.admin.integration.processIntegrations(e.target.value))
              }
            >
              {processOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Stack>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      ) : null}

      {loading ? (
        <Typography color="text.secondary">در حال بارگذاری…</Typography>
      ) : (
        <Stack spacing={1.5}>
          {steps.map((step) => {
            const binding = resolvePrimaryBinding(step);
            const stepBindings = bindingsByStep.get(step.id) ?? [];
            const hasBinding = stepBindings.length > 0;
            return (
              <Accordion
                key={step.id}
                expanded={expandedStep === step.id}
                onChange={(_, isExpanded) => setExpandedStep(isExpanded ? step.id : false)}
                disableGutters
                sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<Icon icon="solar:alt-arrow-down-linear" width={18} />}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', direction: 'ltr' }}>
                      {step.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.name}
                    </Typography>
                    <Chip size="small" label={processBpmnTypeLabel(step.type)} variant="outlined" />
                    {hasBinding ? (
                      <>
                        <Chip size="small" color="success" label="bound" />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={hookTypeLabel(binding.hook_type)}
                          sx={{ fontFamily: 'monospace', direction: 'ltr' }}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={integrationModeLabel(binding.mode)}
                          sx={{ fontFamily: 'monospace', direction: 'ltr' }}
                        />
                        {!compensationConfigIsEmpty(binding.compensation_json) ? (
                          <Chip size="small" color="warning" variant="outlined" label="compensation" />
                        ) : null}
                      </>
                    ) : null}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <StepBindingPanel
                    step={step}
                    processKey={processKey}
                    actions={actions}
                    bindings={stepBindings}
                    onSaved={loadData}
                    toast={toast}
                  />
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function IconButtonBack({ router }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => router.push(paths.dashboard.admin.integration.connectors)}
      aria-label="بازگشت"
      sx={{
        border: 0,
        bgcolor: 'transparent',
        cursor: 'pointer',
        p: 0.5,
        display: 'inline-flex',
        color: 'text.primary',
      }}
    >
      <Icon icon="solar:arrow-right-linear" width={22} />
    </Box>
  );
}
