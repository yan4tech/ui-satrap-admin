'use client';

import { z as zod } from 'zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { useAuthContext } from 'src/auth/hooks';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  createInboundWebhook,
  listAllIntegrationActions,
  listInboundWebhooks,
  testInboundWebhook,
  updateInboundWebhook,
} from 'src/lib/integration-api';

import { InboundMappingEditor } from '../_components/InboundMappingEditor';
import {
  WEBHOOK_AUTH_TYPES,
  buildInboundWebhookDirectPath,
  buildInboundWebhookUrl,
  formatWebhookTestPayload,
  getWebhookApiKey,
  getWebhookHeaderName,
  getWebhookHmacSecret,
  webhookAuthTypeLabel,
} from '../_lib/webhook-labels';

const CreateSchema = zod.object({
  action_id: zod.string().min(1, 'اکشن الزامی است'),
  auth_type: zod.string().min(1, 'نوع احراز هویت الزامی است'),
  header_name: zod.string().optional(),
  api_key: zod.string().optional(),
  secret: zod.string().optional(),
});

const defaultCreateValues = {
  action_id: '',
  auth_type: 'api_key',
  header_name: '',
  api_key: '',
  secret: '',
};

async function copyText(text) {
  const value = String(text ?? '');
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function mapWebhookRow(item) {
  const url = buildInboundWebhookUrl(item.token);
  return {
    id: item.id,
    token: item.token,
    url,
    direct_path: buildInboundWebhookDirectPath(item.token),
    action_id: item.action_id,
    action_name: item.action_name,
    action_key: item.action_key,
    connector_name: item.connector_name,
    auth_type: item.auth_type,
    auth_type_label: webhookAuthTypeLabel(item.auth_type),
    auth_config_json: item.auth_config_json,
    api_key: getWebhookApiKey(item.auth_config_json),
    secret: getWebhookHmacSecret(item.auth_config_json),
    header_name: getWebhookHeaderName(item.auth_config_json, item.auth_type),
    inbound_mapping_json: item.inbound_mapping_json ?? null,
    is_active: item.is_active,
    raw: item,
    created_at: item.created_at
      ? new Date(item.created_at).toLocaleString('fa-IR')
      : '—',
  };
}

function buildAuthConfigFromForm(values) {
  const authType = values.auth_type;
  if (authType === 'none') return {};

  const cfg = {};
  if (values.header_name?.trim()) cfg.header_name = values.header_name.trim();
  if (authType === 'api_key' && values.api_key?.trim()) {
    cfg.api_key = values.api_key.trim();
  }
  if (authType === 'hmac') {
    if (values.secret?.trim()) cfg.secret = values.secret.trim();
    if (!cfg.algorithm) cfg.algorithm = 'sha256';
  }
  return cfg;
}

export default function IntegrationWebhooksPage() {
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [actions, setActions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState(null);
  const [testDialog, setTestDialog] = useState({ open: false, row: null });
  const [testPayload, setTestPayload] = useState(formatWebhookTestPayload());
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [mappingDialog, setMappingDialog] = useState({ open: false, row: null });
  const [inboundMappingJson, setInboundMappingJson] = useState(null);
  const [mappingSaving, setMappingSaving] = useState(false);
  const [copyHint, setCopyHint] = useState('');

  const methods = useForm({
    resolver: zodResolver(CreateSchema),
    defaultValues: defaultCreateValues,
  });

  const { handleSubmit, reset, watch } = methods;
  const authType = watch('auth_type');

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const { items, total } = await listInboundWebhooks({
        offset: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      });
      setRows(items.map(mapWebhookRow));
      setRowCount(total > 0 ? total : items.length);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      setErrorMessage(error?.message || 'خطا در دریافت webhookها');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [allowed, paginationModel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!allowed) return;
    listAllIntegrationActions()
      .then(setActions)
      .catch(() => setActions([]));
  }, [allowed]);

  const handleCopy = useCallback(async (text, label) => {
    const ok = await copyText(text);
    setCopyHint(ok ? `${label} کپی شد` : `کپی ${label} ناموفق بود`);
    setTimeout(() => setCopyHint(''), 2500);
  }, []);

  const handleCreate = handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      const authConfig = buildAuthConfigFromForm(values);
      const body = {
        action_id: Number(values.action_id),
        auth_type: values.auth_type,
        is_active: true,
      };
      if (Object.keys(authConfig).length > 0) {
        body.auth_config_json = authConfig;
      }

      const created = await createInboundWebhook(body);
      const mapped = mapWebhookRow(created);
      setCreatedWebhook(mapped);
      setCreateOpen(false);
      reset(defaultCreateValues);
      setSuccessMessage('Webhook با موفقیت ایجاد شد. توکن و کلیدها را کپی کنید.');
      await fetchData();
    } catch (error) {
      setErrorMessage(error?.message || 'خطا در ایجاد webhook');
    }
  });

  const toggleActive = useCallback(
    async (row) => {
      setErrorMessage(null);
      try {
        await updateInboundWebhook(row.id, { is_active: !row.is_active });
        setSuccessMessage(row.is_active ? 'Webhook غیرفعال شد.' : 'Webhook فعال شد.');
        await fetchData();
      } catch (error) {
        setErrorMessage(error?.message || 'خطا در به‌روزرسانی webhook');
      }
    },
    [fetchData]
  );

  const openTest = useCallback((row) => {
    setTestPayload(formatWebhookTestPayload());
    setTestResult(null);
    setTestDialog({ open: true, row });
  }, []);

  const openMappingEditor = useCallback((row) => {
    setInboundMappingJson(row.inbound_mapping_json ?? null);
    setMappingDialog({ open: true, row });
  }, []);

  const saveInboundMapping = useCallback(async () => {
    if (!mappingDialog.row) return;
    setMappingSaving(true);
    setErrorMessage(null);
    try {
      await updateInboundWebhook(mappingDialog.row.id, {
        inbound_mapping_json: inboundMappingJson,
      });
      setSuccessMessage('Inbound mapping ذخیره شد.');
      setMappingDialog({ open: false, row: null });
      setInboundMappingJson(null);
      await fetchData();
    } catch (error) {
      setErrorMessage(error?.message || 'خطا در ذخیره inbound mapping');
    } finally {
      setMappingSaving(false);
    }
  }, [fetchData, inboundMappingJson, mappingDialog.row]);

  const runTest = useCallback(async () => {
    if (!testDialog.row) return;
    setTestLoading(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      let payload;
      try {
        payload = JSON.parse(testPayload);
      } catch {
        throw new Error('payload نمونه باید JSON معتبر باشد');
      }
      const result = await testInboundWebhook(testDialog.row.id, payload);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        status: 'fail',
        message: error?.message || 'تست ناموفق بود',
      });
    } finally {
      setTestLoading(false);
    }
  }, [testDialog.row, testPayload]);

  const columns = useMemo(
    () => [
      {
        field: 'url',
        headerName: 'URL ورودی',
        flex: 1,
        minWidth: 260,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: '100%' }}>
            <Typography
              variant="caption"
              dir="ltr"
              sx={{
                flex: 1,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                unicodeBidi: 'plaintext',
              }}
            >
              {params.value}
            </Typography>
            <Tooltip title="کپی URL">
              <IconButton
                size="small"
                onClick={() => handleCopy(params.value, 'URL')}
                aria-label="کپی URL"
              >
                <Icon icon="solar:copy-linear" width={16} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
      {
        field: 'action_name',
        headerName: 'اکشن',
        width: 150,
        valueGetter: (_value, row) => row.action_name || row.action_key || '—',
      },
      {
        field: 'auth_type_label',
        headerName: 'احراز هویت',
        width: 110,
      },
      {
        field: 'is_active',
        headerName: 'وضعیت',
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? 'فعال' : 'غیرفعال'}
            color={params.value ? 'success' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'created_at',
        headerName: 'ایجاد',
        width: 150,
      },
      {
        field: 'operations',
        headerName: 'عملیات',
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Inbound mapping">
              <IconButton
                size="small"
                onClick={() => openMappingEditor(params.row)}
                aria-label="inbound mapping"
              >
                <Icon icon="solar:inbox-in-linear" width={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="تست با payload نمونه">
              <IconButton size="small" color="primary" onClick={() => openTest(params.row)} aria-label="تست">
                <Icon icon="solar:play-linear" width={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title={params.row.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}>
              <IconButton size="small" onClick={() => toggleActive(params.row)} aria-label="تغییر وضعیت">
                <Icon
                  icon={params.row.is_active ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                  width={18}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [handleCopy, openMappingEditor, openTest, toggleActive]
  );

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">شما دسترسی مدیریت Webhook را ندارید.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          مدیریت Webhook ورودی
        </Typography>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-linear" width={20} />}
          onClick={() => {
            reset(defaultCreateValues);
            setCreateOpen(true);
          }}
        >
          Webhook جدید
        </Button>
      </Stack>

      {copyHint ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {copyHint}
        </Alert>
      ) : null}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            URL کامل از طریق Traefik:{' '}
            <Box component="span" dir="ltr" sx={{ fontFamily: 'monospace' }}>
              {'{GATEWAY_URL}/api/gateway/api/integration/inbound/{token}'}
            </Box>
            <br />
            مسیر مستقیم gateway:{' '}
            <Box component="span" dir="ltr" sx={{ fontFamily: 'monospace' }}>
              {'{GATEWAY_URL}/api/integration/inbound/{token}'}
            </Box>
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ minHeight: 400 }}
        />
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ایجاد Webhook ورودی</DialogTitle>
        <Form methods={methods} onSubmit={handleCreate}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                توکن URL به‌صورت خودکار تولید می‌شود. در صورت خالی گذاشتن کلیدها، API key یا HMAC secret
                تصادفی ساخته می‌شود.
              </Typography>
              <Field.Select name="action_id" label="اکشن">
                {actions.map((action) => (
                  <MenuItem key={action.id} value={String(action.id)}>
                    {action.name} ({action.action_key})
                    {action.connector_name ? ` — ${action.connector_name}` : ''}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Select name="auth_type" label="نوع احراز هویت">
                {WEBHOOK_AUTH_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Field.Select>
              {authType !== 'none' ? (
                <Field.Text
                  name="header_name"
                  label="نام هدر"
                  placeholder={authType === 'hmac' ? 'X-Signature' : 'X-API-Key'}
                />
              ) : null}
              {authType === 'api_key' ? (
                <Field.Text
                  name="api_key"
                  label="API Key (اختیاری — خودکار تولید می‌شود)"
                />
              ) : null}
              {authType === 'hmac' ? (
                <Field.Text
                  name="secret"
                  label="HMAC Secret (اختیاری — خودکار تولید می‌شود)"
                />
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>انصراف</Button>
            <LoadingButton type="submit" variant="contained">
              ایجاد
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>

      <Dialog
        open={Boolean(createdWebhook)}
        onClose={() => setCreatedWebhook(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Webhook ایجاد شد</DialogTitle>
        <DialogContent>
          {createdWebhook ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  URL کامل (Traefik)
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    value={createdWebhook.url}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                  />
                  <Button variant="outlined" onClick={() => handleCopy(createdWebhook.url, 'URL')}>
                    کپی
                  </Button>
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Token
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    value={createdWebhook.token}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                  />
                  <Button variant="outlined" onClick={() => handleCopy(createdWebhook.token, 'Token')}>
                    کپی
                  </Button>
                </Stack>
              </Box>
              {createdWebhook.auth_type === 'api_key' && createdWebhook.api_key ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    API Key — هدر: {createdWebhook.header_name || 'X-API-Key'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      fullWidth
                      size="small"
                      value={createdWebhook.api_key}
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => handleCopy(createdWebhook.api_key, 'API Key')}
                    >
                      کپی
                    </Button>
                  </Stack>
                </Box>
              ) : null}
              {createdWebhook.auth_type === 'hmac' && createdWebhook.secret ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    HMAC Secret — هدر: {createdWebhook.header_name || 'X-Signature'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      fullWidth
                      size="small"
                      value={createdWebhook.secret}
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => handleCopy(createdWebhook.secret, 'Secret')}
                    >
                      کپی
                    </Button>
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCreatedWebhook(null)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={mappingDialog.open}
        onClose={() => setMappingDialog({ open: false, row: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Inbound Mapping</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {mappingDialog.row ? (
              <Typography variant="body2" color="text.secondary">
                Webhook #{mappingDialog.row.id} — {mappingDialog.row.action_key || mappingDialog.row.action_name}
              </Typography>
            ) : null}
            <InboundMappingEditor
              value={inboundMappingJson}
              onChange={setInboundMappingJson}
              disabled={mappingSaving}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMappingDialog({ open: false, row: null })}>بستن</Button>
          <LoadingButton variant="contained" loading={mappingSaving} onClick={saveInboundMapping}>
            ذخیره mapping
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={testDialog.open}
        onClose={() => setTestDialog({ open: false, row: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>تست Webhook</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {testDialog.row ? (
              <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {testDialog.row.url}
              </Typography>
            ) : null}
            <TextField
              label="Payload نمونه (JSON)"
              multiline
              minRows={8}
              fullWidth
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12, direction: 'ltr' } }}
            />
            {testResult ? (
              <Alert severity={testResult.status === 'success' ? 'success' : 'warning'}>
                {testResult.message || (testResult.status === 'success' ? 'موفق' : 'ناموفق')}
                {testResult.data ? (
                  <Box
                    component="pre"
                    sx={{ mt: 1, mb: 0, fontSize: 11, overflow: 'auto', direction: 'ltr' }}
                  >
                    {JSON.stringify(testResult.data, null, 2)}
                  </Box>
                ) : null}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog({ open: false, row: null })}>بستن</Button>
          <LoadingButton variant="contained" loading={testLoading} onClick={runTest}>
            ارسال تست
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
