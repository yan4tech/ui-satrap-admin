'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { useIntegrationToast } from 'src/components/integration-toast/integration-toast-provider';
import { useAuthContext } from 'src/auth/hooks';
import { paths } from 'src/routes/paths';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  connectorTypeLabel,
  createIntegrationAction,
  deleteIntegrationAction,
  formatConfigJson,
  getConnector,
  listIntegrationActions,
  testConnector,
  updateIntegrationAction,
} from 'src/lib/integration-api';

import { ErrorMappingEditor } from '../../../_components/ErrorMappingEditor';
import { InboundMappingEditor } from '../../../_components/InboundMappingEditor';
import { guessPresetForConnector } from '../../../_lib/connector-presets';
import {
  buildErrorMappingJson,
  parseErrorMappingRules,
} from '../../../_lib/error-mapping-labels';

import {
  NOTIFICATION_SUBTYPES,
  REST_HTTP_METHODS,
  SQL_OPERATIONS,
  actionConfigToFormValues,
  buildActionConfigJson,
  defaultActionFormValues,
  jsonEditorSlotProps,
  parseJsonSchemaInput,
  resolveActionFormKind,
} from '../../../_lib/action-config';

const ActionSchema = zod.object({
  name: zod.string().min(1, 'نام الزامی است'),
  action_key: zod.string().min(1, 'action_key الزامی است'),
  input_schema_json: zod.string().optional(),
  output_schema_json: zod.string().optional(),
  rest_method: zod.string().optional(),
  rest_path: zod.string().optional(),
  rest_headers: zod.string().optional(),
  rest_timeout: zod.string().optional(),
  sql_operation: zod.string().optional(),
  sql_template: zod.string().optional(),
  sql_params: zod.string().optional(),
  notif_subtype: zod.string().optional(),
  notif_template: zod.string().optional(),
  script_entry: zod.string().optional(),
  script_wasm_base64: zod.string().optional(),
  script_wasm_ref: zod.string().optional(),
  generic_config_json: zod.string().optional(),
});

function TypeSpecificFields({ kind }) {
  if (kind === 'rest') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2">پیکربندی REST</Typography>
        <Field.Select name="rest_method" label="Method">
          {REST_HTTP_METHODS.map((method) => (
            <MenuItem key={method} value={method}>
              {method}
            </MenuItem>
          ))}
        </Field.Select>
        <Field.Text name="rest_path" label="Path" placeholder="/verify" />
        <Field.Text
          name="rest_headers"
          label="Headers (JSON)"
          multiline
          minRows={4}
          slotProps={jsonEditorSlotProps}
        />
        <Field.Text name="rest_timeout" label="Timeout (ms)" type="number" placeholder="15000" />
      </Stack>
    );
  }

  if (kind === 'sql') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2">پیکربندی SQL</Typography>
        <Field.Select name="sql_operation" label="Operation">
          {SQL_OPERATIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Field.Select>
        <Field.Text
          name="sql_template"
          label="SQL template"
          multiline
          minRows={5}
          slotProps={jsonEditorSlotProps}
        />
        <Field.Text
          name="sql_params"
          label="Params (JSON)"
          multiline
          minRows={4}
          slotProps={jsonEditorSlotProps}
        />
      </Stack>
    );
  }

  if (kind === 'notification') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2">پیکربندی Notification</Typography>
        <Field.Select name="notif_subtype" label="Subtype">
          {NOTIFICATION_SUBTYPES.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Field.Select>
        <Field.Text
          name="notif_template"
          label="Template"
          placeholder="templateId یا الگوی پیام"
        />
      </Stack>
    );
  }

  if (kind === 'script') {
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle2">پیکربندی Script (WASM)</Typography>
        <Field.Text name="script_entry" label="Entry function" placeholder="transform" />
        <Field.Text
          name="script_wasm_base64"
          label="WASM module (base64)"
          multiline
          minRows={6}
          slotProps={jsonEditorSlotProps}
          helperText="ماژول WASM با export memory و transform(input_ptr, input_len, output_ptr, output_max) → bytes_written"
        />
        <Field.Text
          name="script_wasm_ref"
          label="WASM ref (cred://...)"
          placeholder="cred://prod/my-script"
          helperText="جایگزین wasm_base64 — مقدار wasm_module در credential ref"
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">پیکربندی JSON</Typography>
      <Field.Text
        name="generic_config_json"
        label="config_json"
        multiline
        minRows={8}
        slotProps={jsonEditorSlotProps}
      />
    </Stack>
  );
}

function mapActionRow(item) {
  return {
    id: item.id,
    name: item.name,
    action_key: item.action_key,
    created_at: item.created_at
      ? new Date(item.created_at).toLocaleString('fa-IR')
      : '—',
    raw: item,
  };
}

export default function ConnectorActionsPage() {
  const router = useRouter();
  const params = useParams();
  const connectorId = Number(params?.id);
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);
  const toast = useIntegrationToast();

  const [connector, setConnector] = useState(null);
  const [connectorLoading, setConnectorLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editor, setEditor] = useState({ open: false, mode: 'create', row: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [errorMappingRules, setErrorMappingRules] = useState([]);
  const [inboundMappingJson, setInboundMappingJson] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const connectorPreset = useMemo(
    () => guessPresetForConnector(connector?.name),
    [connector?.name]
  );

  const formKind = useMemo(
    () => resolveActionFormKind(connector?.type),
    [connector?.type]
  );

  const methods = useForm({
    resolver: zodResolver(ActionSchema),
    defaultValues: defaultActionFormValues('rest'),
  });

  const { handleSubmit, reset, formState } = methods;

  const loadConnector = useCallback(async () => {
    if (!allowed || !Number.isFinite(connectorId) || connectorId < 1) {
      setConnector(null);
      setConnectorLoading(false);
      return;
    }
    setConnectorLoading(true);
    try {
      const data = await getConnector(connectorId);
      setConnector(data);
    } catch (error) {
      setConnector(null);
      setErrorMessage(error?.message || 'کانکتور یافت نشد');
    } finally {
      setConnectorLoading(false);
    }
  }, [allowed, connectorId]);

  const fetchActions = useCallback(async () => {
    if (!allowed || !Number.isFinite(connectorId) || connectorId < 1) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const actions = await listIntegrationActions(connectorId);
      setRows(actions.map(mapActionRow));
    } catch (error) {
      setErrorMessage(error?.message || 'خطا در دریافت اکشن‌ها');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [allowed, connectorId]);

  useEffect(() => {
    loadConnector();
  }, [loadConnector]);

  useEffect(() => {
    if (connector) {
      fetchActions();
    }
  }, [connector, fetchActions]);

  useEffect(() => {
    if (connector?.type) {
      reset(defaultActionFormValues(resolveActionFormKind(connector.type)));
    }
  }, [connector?.type, reset]);

  const openCreate = () => {
    reset(defaultActionFormValues(formKind));
    setErrorMappingRules([]);
    setInboundMappingJson(null);
    setEditor({ open: true, mode: 'create', row: null });
  };

  const applyActionPreset = () => {
    const preset = connectorPreset?.actionPreset;
    if (!preset) return;
    reset({
      ...defaultActionFormValues(formKind),
      ...preset,
    });
    toast.showInfo('الگوی اکشن اعمال شد.');
  };

  const runConnectorTest = async () => {
    if (!connector?.id) return;
    setTestLoading(true);
    try {
      const result = await testConnector(connector.id);
      if (result.status === 'ok') {
        toast.showSuccess(`تست اتصال موفق — ${result.latency_ms} ms`);
      } else {
        toast.showError(result.message || 'تست اتصال ناموفق بود');
      }
    } catch (error) {
      toast.showError(error?.message || 'خطا در تست اتصال');
    } finally {
      setTestLoading(false);
    }
  };

  const openEdit = (row) => {
    const action = row.raw;
    reset({
      name: action.name,
      action_key: action.action_key,
      input_schema_json: formatConfigJson(action.input_schema_json ?? { type: 'object', properties: {} }),
      output_schema_json: formatConfigJson(action.output_schema_json ?? { type: 'object', properties: {} }),
      ...actionConfigToFormValues(formKind, action.config_json),
    });
    setErrorMappingRules(parseErrorMappingRules(action.error_mapping_json));
    setInboundMappingJson(action.inbound_mapping_json ?? null);
    setEditor({ open: true, mode: 'edit', row: action });
  };

  const closeEditor = () => {
    setEditor({ open: false, mode: 'create', row: null });
    setErrorMappingRules([]);
    setInboundMappingJson(null);
    reset(defaultActionFormValues(formKind));
  };

  const confirmDelete = async () => {
    if (!deleteDialog.row) return;
    try {
      await deleteIntegrationAction(deleteDialog.row.id);
      toast.showSuccess('اکشن با موفقیت حذف شد.');
      setDeleteDialog({ open: false, row: null });
      fetchActions();
    } catch (error) {
      setDeleteDialog({ open: false, row: null });
      const msg = error?.message || 'خطا در حذف اکشن';
      setErrorMessage(msg);
      toast.showError(msg);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      if (formKind === 'rest' && !String(values.rest_path ?? '').trim()) {
        throw new Error('Path برای REST الزامی است');
      }
      if (formKind === 'sql' && !String(values.sql_template ?? '').trim()) {
        throw new Error('SQL template الزامی است');
      }

      const configJson = buildActionConfigJson(formKind, values);
      const inputSchema = parseJsonSchemaInput(values.input_schema_json, 'input_schema');
      const outputSchema = parseJsonSchemaInput(values.output_schema_json, 'output_schema');
      const errorMappingJson = buildErrorMappingJson(errorMappingRules);

      if (editor.mode === 'create') {
        await createIntegrationAction({
          connector_id: connectorId,
          name: values.name.trim(),
          action_key: values.action_key.trim(),
          config_json: configJson,
          input_schema_json: inputSchema,
          output_schema_json: outputSchema,
          error_mapping_json: errorMappingJson,
          inbound_mapping_json: inboundMappingJson,
        });
        toast.showSuccess('اکشن با موفقیت ایجاد شد.');
        if (connectorPreset?.bindHint) {
          toast.showInfo('اکشن بعدی: Process Binding روی sendAgency1');
        }
      } else if (editor.row) {
        await updateIntegrationAction(editor.row.id, {
          name: values.name.trim(),
          action_key: values.action_key.trim(),
          config_json: configJson,
          input_schema_json: inputSchema,
          output_schema_json: outputSchema,
          error_mapping_json: errorMappingJson,
          inbound_mapping_json: inboundMappingJson,
        });
        toast.showSuccess('اکشن با موفقیت به‌روزرسانی شد.');
      }
      closeEditor();
      fetchActions();
    } catch (error) {
      const msg = error?.message || 'خطا در ذخیره اکشن';
      setErrorMessage(msg);
      toast.showError(msg);
    }
  });

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'نام', flex: 1, minWidth: 160 },
      { field: 'action_key', headerName: 'Action key', flex: 1.2, minWidth: 180 },
      { field: 'created_at', headerName: 'تاریخ ایجاد', width: 170 },
      {
        field: 'operations',
        headerName: 'عملیات',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="ویرایش">
              <IconButton size="small" onClick={() => openEdit(params.row)} aria-label="ویرایش">
                <Icon icon="solar:pen-linear" width={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="حذف">
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeleteDialog({ open: true, row: params.row })}
                aria-label="حذف"
              >
                <Icon icon="solar:trash-bin-trash-linear" width={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [formKind]
  );

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">فقط مدیر مرکزی (central-admin) به Action Builder دسترسی دارد.</Alert>
      </Box>
    );
  }

  if (connectorLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography color="text.secondary">در حال بارگذاری…</Typography>
      </Box>
    );
  }

  if (!connector) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">کانکتور یافت نشد.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(paths.dashboard.admin.integration.connectors)}>
          بازگشت به کاتالوگ
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => router.push(paths.dashboard.admin.integration.connectors)}
              aria-label="بازگشت"
            >
              <Icon icon="solar:arrow-right-linear" width={22} />
            </IconButton>
            <Typography variant="h5">Action Builder</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={connector.name} />
            <Chip size="small" variant="outlined" color="info" label={connectorTypeLabel(connector.type)} />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <LoadingButton
            variant="outlined"
            loading={testLoading}
            startIcon={<Icon icon="solar:plug-circle-linear" width={18} />}
            onClick={runConnectorTest}
          >
            تست اتصال کانکتور
          </LoadingButton>
          {connectorPreset?.bindHint ? (
            <Button
              variant="outlined"
              onClick={() =>
                router.push(
                  `${paths.dashboard.admin.integration.processIntegrations(connectorPreset.bindHint.processKey)}?step=${connectorPreset.bindHint.stepId}`
                )
              }
            >
              {connectorPreset.bindHint.label}
            </Button>
          ) : null}
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:add-circle-linear" width={20} />}
            onClick={openCreate}
          >
            اکشن جدید
          </Button>
        </Stack>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            sx={{ border: 0 }}
          />
        </CardContent>
      </Card>

      <Dialog open={editor.open} onClose={closeEditor} fullWidth maxWidth="md">
        <DialogTitle>{editor.mode === 'create' ? 'اکشن جدید' : 'ویرایش اکشن'}</DialogTitle>
        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              {editor.mode === 'create' && connectorPreset?.actionPreset ? (
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    label={`الگو: ${connectorPreset.label}`}
                    clickable
                    color="primary"
                    variant="outlined"
                    onClick={applyActionPreset}
                  />
                </Stack>
              ) : null}
              <Stack spacing={2}>
                <Typography variant="subtitle2">اطلاعات پایه</Typography>
                <Field.Text name="name" label="نام" />
                <Field.Text
                  name="action_key"
                  label="Action key"
                  placeholder="service.action_name"
                  slotProps={{ input: { sx: { direction: 'ltr', textAlign: 'left' } } }}
                />
              </Stack>

              <Divider />

              <TypeSpecificFields kind={formKind} />

              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle2">JSON Schema</Typography>
                <Field.Text
                  name="input_schema_json"
                  label="Input schema"
                  multiline
                  minRows={8}
                  slotProps={jsonEditorSlotProps}
                />
                <Field.Text
                  name="output_schema_json"
                  label="Output schema"
                  multiline
                  minRows={8}
                  slotProps={jsonEditorSlotProps}
                />
              </Stack>

              <ErrorMappingEditor
                value={errorMappingRules}
                onChange={setErrorMappingRules}
                disabled={formState.isSubmitting}
              />

              <InboundMappingEditor
                value={inboundMappingJson}
                onChange={setInboundMappingJson}
                disabled={formState.isSubmitting}
                title="Inbound Mapping (پیش‌فرض action)"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditor}>انصراف</Button>
            <LoadingButton type="submit" variant="contained" loading={formState.isSubmitting}>
              ذخیره
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>حذف اکشن</DialogTitle>
        <DialogContent>
          <DialogContentText>
            اکشن «{deleteDialog.row?.name}» ({deleteDialog.row?.action_key}) حذف می‌شود. اگر در binding فرایند
            استفاده شده باشد، حذف امکان‌پذیر نیست.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>انصراف</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
