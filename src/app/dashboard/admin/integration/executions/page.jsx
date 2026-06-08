'use client';

import { z as zod } from 'zod';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
  Drawer,
  IconButton,
  MenuItem,
  NoSsr,
  Stack,
  Typography,
} from '@mui/material';

import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

import { Form, Field } from 'src/components/hook-form';
import { Scrollbar } from 'src/components/scrollbar';
import { useAuthContext } from 'src/auth/hooks';
import { isCentralAdmin } from 'src/lib/admin-access';
import {
  getIntegrationExecution,
  listIntegrationExecutions,
} from 'src/lib/integration-api';

import {
  EXECUTION_STATUSES,
  buildEngineProcessHref,
  executionFilterToISO,
  executionStatusChipColor,
  executionStatusLabel,
  formatExecutionDateTime,
  formatExecutionDuration,
  formatExecutionMeta,
  getDefaultExecutionFilters,
  hasExecutionMeta,
} from '../_lib/execution-labels';

const SearchSchema = zod.object({
  process_id: zod.string().optional(),
  status: zod.string().optional(),
  action_id: zod.string().optional(),
  from: zod.any().optional(),
  to: zod.any().optional(),
});

function DetailField({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ wordBreak: 'break-word' }}>
        {children}
      </Typography>
    </Box>
  );
}

function MetaBlock({ title, value }) {
  if (!hasExecutionMeta(value)) return null;
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'grey.100',
          color: 'text.primary',
          overflow: 'auto',
          maxHeight: 280,
          fontSize: 12,
          fontFamily: 'monospace',
          direction: 'ltr',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {formatExecutionMeta(value)}
      </Box>
    </Box>
  );
}

function mapExecutionRow(item) {
  return {
    id: item.id,
    correlation_id: item.correlation_id,
    status: item.status,
    duration_ms: item.duration_ms,
    duration_label: formatExecutionDuration(item.duration_ms),
    retry_count: item.retry_count,
    created_at: formatExecutionDateTime(item.created_at),
    created_at_raw: item.created_at,
    process_instance_id: item.process_instance_id,
    process_key: item.process_key,
    step_id: item.step_id,
    action_id: item.action_id,
    mode: item.mode,
    error_code: item.error_code,
    trace_id: item.trace_id,
    request_hash: item.request_hash,
    request_meta_json: item.request_meta_json,
    response_meta_json: item.response_meta_json,
  };
}

export default function IntegrationExecutionsPage() {
  const { user } = useAuthContext();
  const allowed = isCentralAdmin(user);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: getDefaultExecutionFilters(),
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
      if (filters.process_id) params.process_id = filters.process_id;
      if (filters.status) params.status = filters.status;
      if (filters.action_id) params.action_id = filters.action_id;
      const fromIso = executionFilterToISO(filters.from, 'start');
      const toIso = executionFilterToISO(filters.to, 'end');
      if (fromIso) params.from = fromIso;
      if (toIso) params.to = toIso;

      const { items, total } = await listIntegrationExecutions(params);
      setRows(items.map(mapExecutionRow));
      setRowCount(total > 0 ? total : items.length);
    } catch (error) {
      console.error('Failed to fetch integration executions:', error);
      setErrorMessage(error?.message || 'خطا در دریافت اجراهای یکپارچه‌سازی');
      setRows([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [allowed, paginationModel, getValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = useCallback(async (row) => {
    setDetail(row);
    setDetailLoading(true);
    try {
      const fresh = await getIntegrationExecution(row.id);
      setDetail(mapExecutionRow(fresh));
    } catch (error) {
      console.error('Failed to load execution detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const columns = [
    {
      field: 'correlation_id',
      headerName: 'شناسه همبستگی',
      flex: 1,
      minWidth: 200,
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
      field: 'status',
      headerName: 'وضعیت',
      width: 110,
      renderCell: (params) => {
        const chipColor = executionStatusChipColor(params.value);
        return (
          <Chip
            size="small"
            label={executionStatusLabel(params.value)}
            color={chipColor === 'default' ? undefined : chipColor}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'duration_label',
      headerName: 'مدت',
      width: 100,
    },
    {
      field: 'retry_count',
      headerName: 'تلاش مجدد',
      width: 90,
      type: 'number',
    },
    {
      field: 'created_at',
      headerName: 'زمان ایجاد',
      width: 170,
    },
    {
      field: 'actions',
      headerName: 'جزئیات',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => openDetail(params.row)} aria-label="جزئیات">
          <Icon icon="solar:eye-linear" width={20} />
        </IconButton>
      ),
    },
  ];

  const engineHref =
    detail != null
      ? buildEngineProcessHref(detail.process_instance_id, detail.process_key)
      : null;

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">شما دسترسی مشاهده مانیتور اجرا را ندارید.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
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
            <Typography variant="h6">فیلتر اجراها</Typography>
            <Chip size="small" label="پیش‌فرض: ۷ روز اخیر" variant="outlined" sx={{ mr: 'auto' }} />
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
                  <Field.Text name="process_id" label="شناسه نمونه فرایند (process_id)" />
                  <Field.Select name="status" label="وضعیت">
                    {EXECUTION_STATUSES.map((s) => (
                      <MenuItem key={s.value || 'all'} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Text name="action_id" label="شناسه اکشن (action_id)" />
                  <NoSsr>
                    <Field.DatePicker
                      name="from"
                      label="از تاریخ"
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </NoSsr>
                  <NoSsr>
                    <Field.DatePicker
                      name="to"
                      label="تا تاریخ"
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </NoSsr>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      reset(getDefaultExecutionFilters());
                      setPaginationModel({ page: 0, pageSize: 25 });
                      queueMicrotask(() => fetchData());
                    }}
                  >
                    بازنشانی (۷ روز اخیر)
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
          disableRowSelectionOnClick
          autoHeight
          sx={{ minHeight: 400 }}
        />
      </Card>

      <Drawer
        anchor="right"
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440, md: 560 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {detail && (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2, py: 1.5, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
            >
              <Stack direction="row" alignItems="center" spacing={1} useFlexGap>
                <Typography variant="h6">جزئیات اجرا</Typography>
                <Chip
                  size="small"
                  label={executionStatusLabel(detail.status)}
                  color={
                    executionStatusChipColor(detail.status) === 'default'
                      ? undefined
                      : executionStatusChipColor(detail.status)
                  }
                  variant="outlined"
                />
              </Stack>
              <IconButton onClick={() => setDetail(null)} aria-label="بستن">
                <Icon icon="solar:close-circle-linear" width={22} />
              </IconButton>
            </Stack>

            <Scrollbar sx={{ flex: 1 }}>
              <Stack spacing={2} sx={{ p: 2 }}>
                {detailLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    در حال بارگذاری جزئیات…
                  </Typography>
                ) : null}

                <Typography variant="body2" color="text.secondary">
                  شناسه اجرا: {detail.id}
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1.5,
                  }}
                >
                  <DetailField label="شناسه همبستگی">
                    <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext', fontFamily: 'monospace', fontSize: 12 }}>
                      {detail.correlation_id || '—'}
                    </Box>
                  </DetailField>
                  <DetailField label="وضعیت">{executionStatusLabel(detail.status)}</DetailField>
                  <DetailField label="مدت">{formatExecutionDuration(detail.duration_ms)}</DetailField>
                  <DetailField label="تلاش مجدد">{detail.retry_count ?? 0}</DetailField>
                  <DetailField label="زمان ایجاد">{detail.created_at}</DetailField>
                  <DetailField label="اکشن">{detail.action_id || '—'}</DetailField>
                  <DetailField label="مرحله">{detail.step_id || '—'}</DetailField>
                  <DetailField label="کلید فرایند">{detail.process_key || '—'}</DetailField>
                  <DetailField label="نمونه فرایند">{detail.process_instance_id || '—'}</DetailField>
                  <DetailField label="حالت">{detail.mode || '—'}</DetailField>
                  {detail.error_code ? (
                    <DetailField label="کد خطا">
                      <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext' }}>
                        {detail.error_code}
                      </Box>
                    </DetailField>
                  ) : null}
                  {detail.trace_id ? (
                    <DetailField label="Trace ID">
                      <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext', fontFamily: 'monospace', fontSize: 12 }}>
                        {detail.trace_id}
                      </Box>
                    </DetailField>
                  ) : null}
                  {detail.request_hash ? (
                    <DetailField label="Request hash">
                      <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext', fontFamily: 'monospace', fontSize: 11 }}>
                        {detail.request_hash}
                      </Box>
                    </DetailField>
                  ) : null}
                </Box>

                {engineHref ? (
                  <Button
                    component={Link}
                    href={engineHref}
                    variant="outlined"
                    size="small"
                    startIcon={<Icon icon="solar:arrow-left-linear" width={18} />}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    مشاهده نمونه فرایند در UI موتور
                  </Button>
                ) : null}

                <MetaBlock title="متای درخواست (ماسک‌شده)" value={detail.request_meta_json} />
                <MetaBlock title="متای پاسخ (ماسک‌شده)" value={detail.response_meta_json} />

                {!hasExecutionMeta(detail.request_meta_json) &&
                !hasExecutionMeta(detail.response_meta_json) ? (
                  <Typography variant="body2" color="text.secondary">
                    متای درخواست/پاسخ برای این اجرا ثبت نشده است.
                  </Typography>
                ) : null}
              </Stack>
            </Scrollbar>
          </>
        )}
      </Drawer>
    </Box>
  );
}
