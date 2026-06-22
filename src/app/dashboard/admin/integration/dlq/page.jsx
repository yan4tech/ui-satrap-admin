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
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
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
import { Scrollbar } from 'src/components/scrollbar';
import { useAuthContext } from 'src/auth/hooks';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  listIntegrationDlq,
  retryIntegrationDlq,
  skipIntegrationDlq,
} from 'src/lib/integration-api';

import {
  extractDlqRequestFields,
  formatDlqDateTime,
  formatDlqPayload,
  getDefaultDlqFilters,
  truncateDlqError,
} from '../_lib/dlq-labels';

const SearchSchema = zod.object({
  process_key: zod.string().optional(),
  correlation_id: zod.string().optional(),
  resolved: zod.string().optional(),
});

const RESOLVED_OPTIONS = [
  { value: 'false', label: 'باز (ناموفق)' },
  { value: 'true', label: 'حل‌شده' },
  { value: '', label: 'همه' },
];

function selectedRowIds(selectionModel) {
  if (!selectionModel || selectionModel.type !== 'include') return [];
  return Array.from(selectionModel.ids ?? []).map((id) => Number(id));
}

function mapDlqRow(item) {
  const fields = extractDlqRequestFields(item.payload_json);
  return {
    id: item.id,
    correlation_id: item.correlation_id,
    error: item.error,
    error_short: truncateDlqError(item.error),
    retryable: item.retryable,
    execution_id: item.execution_id,
    process_key: fields.process_key,
    process_instance_id: fields.process_instance_id,
    action_id: fields.action_id,
    step_id: fields.step_id,
    payload_json: item.payload_json,
    resolved_at: item.resolved_at,
    is_open: !item.resolved_at,
    created_at: formatDlqDateTime(item.created_at),
    created_at_raw: item.created_at,
  };
}

export default function IntegrationDlqPage() {
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [rowSelectionModel, setRowSelectionModel] = useState(() => ({
    type: 'include',
    ids: new Set(),
  }));
  const [bulkRetryLoading, setBulkRetryLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [skipDialog, setSkipDialog] = useState({ open: false, row: null });

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: getDefaultDlqFilters(),
  });

  const { handleSubmit, getValues, reset } = methods;

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters = getValues();
      const params = {
        offset: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      };
      if (filters.process_key) params.process_key = filters.process_key;
      if (filters.correlation_id) params.correlation_id = filters.correlation_id;
      if (filters.resolved === 'true') params.resolved = true;
      else if (filters.resolved === 'false') params.resolved = false;
      else params.resolved = '';

      const { items, total } = await listIntegrationDlq(params);
      setRows(items.map(mapDlqRow));
      setRowCount(total > 0 ? total : items.length);
      setRowSelectionModel({ type: 'include', ids: new Set() });
    } catch (error) {
      console.error('Failed to fetch DLQ entries:', error);
      setErrorMessage(error?.message || 'خطا در دریافت صف DLQ');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [allowed, paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const handleRetry = useCallback(
    async (row) => {
      if (!row?.id || !row.retryable || !row.is_open) return;
      setActionLoadingId(row.id);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        await retryIntegrationDlq(row.id);
        setSuccessMessage(`اجرای ${row.correlation_id} دوباره در صف قرار گرفت.`);
        await fetchData();
      } catch (error) {
        setErrorMessage(error?.message || 'خطا در تلاش مجدد');
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchData]
  );

  const handleSkip = useCallback(
    async (row) => {
      if (!row?.id || !row.is_open) return;
      setActionLoadingId(row.id);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        await skipIntegrationDlq(row.id);
        setSuccessMessage(`اجرای ${row.correlation_id} رد شد و موتور مطلع شد.`);
        setSkipDialog({ open: false, row: null });
        await fetchData();
      } catch (error) {
        setErrorMessage(error?.message || 'خطا در رد اجرا');
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchData]
  );

  const handleBulkRetry = useCallback(async () => {
    const selectedIds = selectedRowIds(rowSelectionModel);
    const selectedRows = rows.filter((r) => selectedIds.includes(r.id) && r.is_open && r.retryable);
    if (!selectedRows.length) {
      setErrorMessage('حداقل یک ردیف باز و قابل تلاش مجدد انتخاب کنید.');
      return;
    }

    setBulkRetryLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const results = await Promise.allSettled(selectedRows.map((row) => retryIntegrationDlq(row.id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;

    if (failed === 0) {
      setSuccessMessage(`${ok} اجرا دوباره در صف قرار گرفت.`);
    } else {
      setErrorMessage(`${ok} موفق، ${failed} ناموفق در تلاش مجدد گروهی.`);
    }

    setBulkRetryLoading(false);
    await fetchData();
  }, [rowSelectionModel, rows, fetchData]);

  const selectedRetryableCount = useMemo(() => {
    const selectedIds = new Set(selectedRowIds(rowSelectionModel));
    return rows.filter((r) => selectedIds.has(r.id) && r.is_open && r.retryable).length;
  }, [rowSelectionModel, rows]);

  const columns = useMemo(
    () => [
      {
        field: 'correlation_id',
        headerName: 'شناسه همبستگی',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Box
            component="span"
            dir="ltr"
            sx={{ unicodeBidi: 'plaintext', fontFamily: 'monospace', fontSize: 12 }}
          >
            {params.value || '—'}
          </Box>
        ),
      },
      {
        field: 'process_key',
        headerName: 'کلید فرایند',
        width: 130,
      },
      {
        field: 'error_short',
        headerName: 'خطا',
        flex: 1,
        minWidth: 160,
      },
      {
        field: 'retryable',
        headerName: 'قابل تلاش',
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? 'بله' : 'خیر'}
            color={params.value ? 'warning' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'is_open',
        headerName: 'وضعیت',
        width: 100,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? 'باز' : 'حل‌شده'}
            color={params.value ? 'error' : 'success'}
            variant="outlined"
          />
        ),
      },
      {
        field: 'created_at',
        headerName: 'زمان',
        width: 160,
      },
      {
        field: 'actions',
        headerName: 'عملیات',
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const row = params.row;
          const busy = actionLoadingId === row.id;
          return (
            <Stack direction="row" spacing={0.25}>
              <Tooltip title="مشاهده خطا">
                <IconButton size="small" onClick={() => setErrorDetail(row)} aria-label="مشاهده خطا">
                  <Icon icon="solar:document-text-linear" width={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.retryable ? 'تلاش مجدد' : 'غیرقابل تلاش مجدد'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={!row.is_open || !row.retryable || busy}
                    onClick={() => handleRetry(row)}
                    aria-label="تلاش مجدد"
                  >
                    <Icon icon="solar:restart-linear" width={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="رد (Skip)">
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    disabled={!row.is_open || busy}
                    onClick={() => setSkipDialog({ open: true, row })}
                    aria-label="رد"
                  >
                    <Icon icon="solar:skip-next-linear" width={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [actionLoadingId, handleRetry]
  );

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">شما دسترسی مدیریت DLQ را ندارید.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          مدیریت DLQ
        </Typography>
        <LoadingButton
          variant="contained"
          color="primary"
          loading={bulkRetryLoading}
          disabled={selectedRetryableCount === 0}
          startIcon={<Icon icon="solar:restart-linear" width={20} />}
          onClick={handleBulkRetry}
        >
          تلاش مجدد گروهی ({selectedRetryableCount})
        </LoadingButton>
      </Stack>

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

      <Card
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => theme.shadows[2],
        }}
      >
        <CardContent>
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
            }}
            onClick={() => setIsSearchOpen((p) => !p)}
          >
            <Icon
              icon={isSearchOpen ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-left-linear'}
              width={18}
            />
            <Icon icon="solar:filter-linear" width={20} />
            <Typography variant="h6">فیلتر</Typography>
            <Chip
              size="small"
              label="پیش‌فرض: فقط باز"
              variant="outlined"
              sx={{ mr: 'auto' }}
            />
          </Box>

          <Collapse in={isSearchOpen}>
            <Form methods={methods} onSubmit={onSubmit}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  <Field.Text name="process_key" label="کلید فرایند (process_key)" />
                  <Field.Text name="correlation_id" label="شناسه همبستگی" />
                  <Field.Select name="resolved" label="وضعیت حل">
                    {RESOLVED_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      reset(getDefaultDlqFilters());
                      setPaginationModel({ page: 0, pageSize: 25 });
                      queueMicrotask(() => fetchData());
                    }}
                  >
                    بازنشانی
                  </Button>
                  <Button type="submit" variant="contained">
                    جستجو
                  </Button>
                </Stack>
              </Stack>
            </Form>
          </Collapse>
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
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          isRowSelectable={(params) => Boolean(params.row.is_open && params.row.retryable)}
          autoHeight
          sx={{ minHeight: 400 }}
        />
      </Card>

      <Drawer
        anchor="right"
        open={Boolean(errorDetail)}
        onClose={() => setErrorDetail(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440, md: 560 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {errorDetail && (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2, py: 1.5, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
            >
              <Typography variant="h6">جزئیات خطا</Typography>
              <IconButton onClick={() => setErrorDetail(null)} aria-label="بستن">
                <Icon icon="solar:close-circle-linear" width={22} />
              </IconButton>
            </Stack>

            <Scrollbar sx={{ flex: 1 }}>
              <Stack spacing={2} sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  شناسه DLQ: {errorDetail.id}
                </Typography>

                <Alert severity="error">{errorDetail.error || 'خطایی ثبت نشده است.'}</Alert>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      شناسه همبستگی
                    </Typography>
                    <Typography variant="body2" dir="ltr" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {errorDetail.correlation_id || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      کلید فرایند
                    </Typography>
                    <Typography variant="body2">{errorDetail.process_key || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      نمونه فرایند
                    </Typography>
                    <Typography variant="body2">{errorDetail.process_instance_id || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      اکشن
                    </Typography>
                    <Typography variant="body2">{errorDetail.action_id || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      شناسه اجرا
                    </Typography>
                    <Typography variant="body2">{errorDetail.execution_id ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      زمان ایجاد
                    </Typography>
                    <Typography variant="body2">{errorDetail.created_at}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Payload (ماسک‌شده)
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'grey.100',
                      overflow: 'auto',
                      maxHeight: 320,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      direction: 'ltr',
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {formatDlqPayload(errorDetail.payload_json) || '{}'}
                  </Box>
                </Box>
              </Stack>
            </Scrollbar>
          </>
        )}
      </Drawer>

      <Dialog
        open={skipDialog.open}
        onClose={() => setSkipDialog({ open: false, row: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>رد اجرا (Skip)</DialogTitle>
        <DialogContent>
          <DialogContentText>
            با رد این اجرا، موتور فرایند با وضعیت ناموفق مطلع می‌شود و ردیف DLQ بسته می‌شود.
            آیا مطمئن هستید؟
          </DialogContentText>
          {skipDialog.row?.correlation_id ? (
            <Typography
              variant="body2"
              dir="ltr"
              sx={{ mt: 2, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}
            >
              {skipDialog.row.correlation_id}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkipDialog({ open: false, row: null })}>انصراف</Button>
          <LoadingButton
            color="warning"
            variant="contained"
            loading={actionLoadingId === skipDialog.row?.id}
            onClick={() => handleSkip(skipDialog.row)}
          >
            رد اجرا
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
