'use client';

import { z as zod } from 'zod';
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
  Divider,
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
import { usePermissions } from 'src/hooks/use-permissions';
import { PERM } from 'src/lib/permissions';
import axios from 'src/lib/axios';

import {
  AUDIT_ACTIONS,
  AUDIT_SERVICES,
  auditActionLabel,
  auditActionChipColor,
  auditServiceLabel,
  auditFilterToISO,
  getDefaultAuditFilters,
  formatAuditJson,
  hasAuditJson,
} from '../_lib/audit-labels';

const SearchSchema = zod.object({
  service: zod.string().optional(),
  action: zod.string().optional(),
  entity_type: zod.string().optional(),
  entity_id: zod.string().optional(),
  actor_id: zod.string().optional(),
  actor_branch_id: zod.string().optional(),
  success: zod.string().optional(),
  from: zod.any().optional(),
  to: zod.any().optional(),
});

function pickRowId(item) {
  return item?.ID ?? item?.id ?? item?.Id;
}

function AuditDetailField({ label, children }) {
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

function AuditJsonBlock({ title, value }) {
  if (!hasAuditJson(value)) return null;
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
        {formatAuditJson(value)}
      </Box>
    </Box>
  );
}

function mapAuditRow(item) {
  const id = pickRowId(item);
  const occurred = item?.OccurredAt ?? item?.occurred_at ?? item?.occurredAt;
  return {
    id,
    occurred_at: occurred ? new Date(occurred).toLocaleString('fa-IR') : '—',
    occurred_at_raw: occurred,
    actor_id: item?.ActorID ?? item?.actor_id ?? null,
    actor_branch_id: item?.ActorBranchID ?? item?.actor_branch_id ?? null,
    service: item?.Service ?? item?.service ?? '',
    action: item?.Action ?? item?.action ?? '',
    entity_type: item?.EntityType ?? item?.entity_type ?? '',
    entity_id: item?.EntityID ?? item?.entity_id ?? '',
    request_id: item?.RequestID ?? item?.request_id ?? '',
    ip: item?.IP ?? item?.ip ?? '',
    success: Boolean(item?.Success ?? item?.success),
    error: item?.Error ?? item?.error ?? '',
    before_json: item?.BeforeJSON ?? item?.before_json,
    after_json: item?.AfterJSON ?? item?.after_json,
    user_agent: item?.UserAgent ?? item?.user_agent ?? '',
  };
}

export default function AuditEventsPage() {
  const { can } = usePermissions();
  const allowed = can(PERM.ui.auditList);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [detail, setDetail] = useState(null);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: getDefaultAuditFilters(),
  });

  const { handleSubmit, watch, setValue, getValues, reset } = methods;
  const successFilter = watch('success');

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters = getValues();
      const params = {};
      if (filters.service) params.service = filters.service;
      if (filters.action) params.action = filters.action;
      if (filters.entity_type) params.entity_type = filters.entity_type;
      if (filters.entity_id) params.entity_id = filters.entity_id;
      if (filters.actor_id) params.actor_id = filters.actor_id;
      if (filters.actor_branch_id) params.actor_branch_id = filters.actor_branch_id;
      if (filters.success !== '') params.success = filters.success;
      const fromIso = auditFilterToISO(filters.from, 'start');
      const toIso = auditFilterToISO(filters.to, 'end');
      if (fromIso) params.from = fromIso;
      if (toIso) params.to = toIso;

      const res = await axios.get('/api/membership/audit/events', {
        params,
        headers: {
          mode: 'company',
          limit: String(paginationModel.pageSize),
          offset: String(paginationModel.page * paginationModel.pageSize),
        },
      });

      const payload = res?.data ?? {};
      const rawRows = Array.isArray(payload?.data) ? payload.data : [];
      const mapped = rawRows.map(mapAuditRow).filter((r) => r.id != null);
      setRows(mapped);
      const total = Number(payload?.total ?? 0);
      setRowCount(total > 0 ? total : mapped.length);
    } catch (error) {
      console.error('Failed to fetch audit events:', error);
      setErrorMessage(
        error?.response?.data?.message || error?.response?.data?.error || 'خطا در دریافت لاگ ممیزی'
      );
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

  const columns = [
    { field: 'occurred_at', headerName: 'زمان', width: 170 },
    {
      field: 'service',
      headerName: 'سرویس',
      width: 110,
      valueFormatter: (value) => auditServiceLabel(value),
    },
    {
      field: 'action',
      headerName: 'عملیات',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const label = auditActionLabel(params.value);
        const chipColor = auditActionChipColor(params.value);
        return (
          <Chip
            size="small"
            label={label}
            color={chipColor === 'default' ? undefined : chipColor}
            variant="outlined"
          />
        );
      },
    },
    { field: 'entity_type', headerName: 'موجودیت', width: 120 },
    { field: 'entity_id', headerName: 'شناسه', width: 100 },
    { field: 'actor_id', headerName: 'کاربر', width: 80 },
    { field: 'actor_branch_id', headerName: 'شعبه', width: 80 },
    {
      field: 'actions',
      headerName: 'جزئیات',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => setDetail(params.row)} aria-label="جزئیات">
          <Icon icon="solar:eye-linear" width={20} />
        </IconButton>
      ),
    },
  ];

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">شما دسترسی مشاهده لاگ ممیزی را ندارید.</Alert>
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
            <Typography variant="h6">فیلتر رویدادها</Typography>
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
                  <Field.Select name="service" label="سرویس">
                    {AUDIT_SERVICES.map((s) => (
                      <MenuItem key={s.value || 'all'} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Select name="action" label="عملیات">
                    {AUDIT_ACTIONS.map((a) => (
                      <MenuItem key={a.value || 'all'} value={a.value}>
                        {a.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Text name="entity_type" label="نوع موجودیت" />
                  <Field.Text name="entity_id" label="شناسه موجودیت" />
                  <Field.Text name="actor_id" label="شناسه کاربر" />
                  <Field.Text name="actor_branch_id" label="شناسه شعبه" />
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
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 3' } }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      نتیجه
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={successFilter === '' ? 'contained' : 'outlined'}
                        onClick={() => setValue('success', '')}
                      >
                        همه
                      </Button>
                      <Button
                        size="small"
                        color="success"
                        variant={successFilter === 'true' ? 'contained' : 'outlined'}
                        onClick={() => setValue('success', 'true')}
                      >
                        موفق
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant={successFilter === 'false' ? 'contained' : 'outlined'}
                        onClick={() => setValue('success', 'false')}
                      >
                        ناموفق
                      </Button>
                    </Stack>
                  </Box>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      reset(getDefaultAuditFilters());
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
            width: { xs: '100%', sm: 440, md: 520 },
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
                <Typography variant="h6">جزئیات رویداد</Typography>
                <Chip
                  size="small"
                  label={detail.success ? 'موفق' : 'ناموفق'}
                  color={detail.success ? 'success' : 'error'}
                  variant="outlined"
                />
              </Stack>
              <IconButton onClick={() => setDetail(null)} aria-label="بستن">
                <Icon icon="solar:close-circle-linear" width={22} />
              </IconButton>
            </Stack>

            <Scrollbar sx={{ flex: 1 }}>
              <Stack spacing={2} sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  شناسه رویداد: {detail.id}
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1.5,
                  }}
                >
                  <AuditDetailField label="زمان">{detail.occurred_at}</AuditDetailField>
                  <AuditDetailField label="سرویس">
                    {auditServiceLabel(detail.service)}
                  </AuditDetailField>
                  <AuditDetailField label="عملیات">
                    {auditActionLabel(detail.action)}
                  </AuditDetailField>
                  <AuditDetailField label="نوع موجودیت">{detail.entity_type || '—'}</AuditDetailField>
                  <AuditDetailField label="شناسه موجودیت">{detail.entity_id || '—'}</AuditDetailField>
                  <AuditDetailField label="کاربر">{detail.actor_id ?? '—'}</AuditDetailField>
                  <AuditDetailField label="شعبه">{detail.actor_branch_id ?? '—'}</AuditDetailField>
                  <AuditDetailField label="آدرس IP">{detail.ip || '—'}</AuditDetailField>
                  <AuditDetailField label="شناسه درخواست">
                    <Box component="span" dir="ltr" sx={{ display: 'inline-block', unicodeBidi: 'plaintext' }}>
                      {detail.request_id || '—'}
                    </Box>
                  </AuditDetailField>
                </Box>

                {detail.error ? (
                  <Alert severity="error">{detail.error}</Alert>
                ) : null}

                <AuditJsonBlock title="وضعیت قبل" value={detail.before_json} />
                <AuditJsonBlock title="وضعیت بعد" value={detail.after_json} />

                {!hasAuditJson(detail.before_json) && !hasAuditJson(detail.after_json) ? (
                  <Typography variant="body2" color="text.secondary">
                    برای این رویداد دادهٔ قبل/بعد ثبت نشده است.
                  </Typography>
                ) : null}

                {detail.user_agent ? (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      مرورگر / User-Agent
                    </Typography>
                    <Typography
                      variant="caption"
                      dir="ltr"
                      sx={{
                        display: 'block',
                        wordBreak: 'break-all',
                        color: 'text.secondary',
                        unicodeBidi: 'plaintext',
                      }}
                    >
                      {detail.user_agent}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            </Scrollbar>
          </>
        )}
      </Drawer>
    </Box>
  );
}
