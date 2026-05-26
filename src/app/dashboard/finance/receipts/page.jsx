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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  NoSsr,
  Stack,
  Tooltip,
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
  PAYMENT_STATUS_OPTIONS,
  PROCESS_DEFINITION_OPTIONS,
  financeFilterToISO,
  formatDateTime,
  formatRial,
  getDefaultFinanceFilters,
  paymentStatusLabel,
  processDefinitionLabel,
} from '../_lib/finance-labels';

const SearchSchema = zod.object({
  branch_id: zod.string().optional(),
  user_id: zod.string().optional(),
  applicant_user_id: zod.string().optional(),
  service_id: zod.string().optional(),
  process_definition_key: zod.string().optional(),
  process_instance_id: zod.string().optional(),
  status: zod.string().optional(),
  from: zod.any().optional(),
  to: zod.any().optional(),
});

const SUMMARY_ACCENTS = {
  total: 'primary.main',
  paid: 'success.main',
  refunded: 'warning.main',
  pending: 'text.disabled',
};

function mapReceiptRow(item) {
  const paymentId = item?.payment_id ?? item?.PaymentID ?? item?.id;
  return {
    id: paymentId,
    payment_id: paymentId,
    invoice_id: item?.invoice_id ?? item?.InvoiceID,
    order_id: item?.order_id ?? item?.OrderID ?? '',
    branch_id: item?.branch_id ?? item?.BranchID,
    service_id: item?.service_id ?? item?.ServiceID,
    process_instance_id: item?.process_instance_id ?? item?.ProcessInstanceID,
    process_definition_key: item?.process_definition_key ?? item?.ProcessDefinitionKey ?? '',
    applicant_user_id: item?.applicant_user_id ?? item?.ApplicantUserID,
    process_step_id: item?.process_step_id ?? item?.ProcessStepID ?? '',
    user_id: item?.user_id ?? item?.UserID,
    amount: item?.amount ?? item?.Amount ?? 0,
    refunded_amount: item?.refunded_amount ?? item?.RefundedAmount ?? 0,
    status: item?.status ?? item?.Status ?? '',
    payment_gateway: item?.payment_gateway ?? item?.PaymentGateway ?? '',
    transaction_id: item?.transaction_id ?? item?.TransactionID ?? '',
    reference_id: item?.reference_id ?? item?.ReferenceID ?? '',
    paid_at: item?.paid_at ?? item?.PaidAt,
    paid_at_label: formatDateTime(item?.paid_at ?? item?.PaidAt ?? item?.created_at ?? item?.CreatedAt),
    process_status: item?.process_status ?? item?.ProcessStatus ?? '',
    refund_eligible: Boolean(item?.refund_eligible ?? item?.RefundEligible),
    description: item?.description ?? item?.Description ?? '',
    invoice_amount: item?.invoice_amount ?? item?.InvoiceAmount,
    invoice_status: item?.invoice_status ?? item?.InvoiceStatus,
    card_number: item?.card_number ?? item?.CardNumber ?? '',
  };
}

function DetailField({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {children}
      </Typography>
    </Box>
  );
}

function SummaryCard({ title, value, subtitle, accentKey = 'total' }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRight: 3, borderRightColor: SUMMARY_ACCENTS[accentKey] }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function FinanceReceiptsPage() {
  const { can } = usePermissions();
  const allowed = can(PERM.ui.financeList);

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);

  const methods = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: getDefaultFinanceFilters(),
  });

  const { handleSubmit, reset, getValues } = methods;

  const buildParams = useCallback(() => {
    const filters = getValues();
    const params = {};
    if (filters.branch_id) params.branch_id = filters.branch_id;
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.applicant_user_id) params.applicant_user_id = filters.applicant_user_id;
    if (filters.service_id) params.service_id = filters.service_id;
    if (filters.process_definition_key) params.process_definition_key = filters.process_definition_key;
    if (filters.process_instance_id) params.process_instance_id = filters.process_instance_id;
    if (filters.status) params.status = filters.status;
    const fromIso = financeFilterToISO(filters.from, 'start');
    const toIso = financeFilterToISO(filters.to, 'end');
    if (fromIso) params.from = fromIso;
    if (toIso) params.to = toIso;
    params.limit = String(paginationModel.pageSize);
    params.offset = String(paginationModel.page * paginationModel.pageSize);
    return params;
  }, [getValues, paginationModel]);

  const fetchData = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await axios.get('/api/payment/financial/receipts', { params: buildParams() });
      const payload = res?.data ?? {};
      const rawRows = Array.isArray(payload?.data) ? payload.data : [];
      const mapped = rawRows.map(mapReceiptRow).filter((r) => r.id != null);
      setRows(mapped);
      const total = Number(payload?.total ?? 0);
      setRowCount(total > 0 ? total : mapped.length);
      setSummary(payload?.summary ?? null);
    } catch (error) {
      console.error('Failed to fetch financial receipts:', error);
      setErrorMessage(
        error?.response?.data?.error || error?.response?.data?.message || 'خطا در دریافت گزارش مالی'
      );
      setRows([]);
      setRowCount(0);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [allowed, buildParams]);

  const loadDetail = useCallback(async (paymentId) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/payment/financial/receipts/${paymentId}`);
      const mapped = mapReceiptRow(res?.data?.data ?? {});
      setDetail(mapped);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.error || error?.response?.data?.message || 'خطا در دریافت جزئیات پرداخت'
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = handleSubmit(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchData();
  });

  const handleRefund = async () => {
    if (!refundTarget?.payment_id) return;
    setRefundLoading(true);
    setErrorMessage(null);
    try {
      await axios.post(`/api/payment/financial/receipts/${refundTarget.payment_id}/refund`, {
        amount: refundTarget.amount,
      });
      setRefundTarget(null);
      setDetail(null);
      await fetchData();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.error || error?.response?.data?.message || 'خطا در استرداد وجه'
      );
    } finally {
      setRefundLoading(false);
    }
  };

  const statusChipColor = (status) => {
    const s = String(status).toUpperCase();
    if (s === 'PAID') return 'success';
    if (s === 'REFUNDED') return 'warning';
    if (s === 'PENDING') return 'default';
    return 'default';
  };

  const columns = [
    { field: 'paid_at_label', headerName: 'تاریخ پرداخت', width: 170 },
    {
      field: 'status',
      headerName: 'وضعیت',
      width: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          label={paymentStatusLabel(params.value)}
          color={statusChipColor(params.value)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'amount',
      headerName: 'مبلغ',
      width: 140,
      valueFormatter: (value) => formatRial(value),
    },
    {
      field: 'process_definition_key',
      headerName: 'فرایند',
      width: 130,
      valueFormatter: (value) => processDefinitionLabel(value),
    },
    { field: 'process_instance_id', headerName: 'شناسه فرایند', width: 110 },
    { field: 'branch_id', headerName: 'شعبه', width: 80 },
    { field: 'applicant_user_id', headerName: 'متقاضی', width: 80 },
    { field: 'user_id', headerName: 'کاربر', width: 80 },
    { field: 'transaction_id', headerName: 'تراکنش', flex: 1, minWidth: 100 },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="جزئیات">
            <IconButton
              size="small"
              onClick={() => {
                setDetail(params.row);
                loadDetail(params.row.payment_id);
              }}
              aria-label="جزئیات"
            >
              <Icon icon="solar:eye-linear" width={20} />
            </IconButton>
          </Tooltip>
          {params.row.refund_eligible ? (
            <Tooltip title="برگرداندن هزینه">
              <IconButton
                size="small"
                color="warning"
                onClick={() => setRefundTarget(params.row)}
                aria-label="استرداد"
              >
                <Icon icon="solar:undo-left-round-linear" width={20} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
    },
  ];

  if (!allowed) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">شما دسترسی مشاهده گزارش مالی را ندارید.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        گزارش دریافتی‌ها
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {summary ? (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="تعداد کل" value={summary.total_count ?? rowCount} accentKey="total" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
              title="پرداخت شده"
              value={summary.paid_count ?? 0}
              subtitle={formatRial(summary.total_paid_amount)}
              accentKey="paid"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="استرداد شده" value={summary.refunded_count ?? 0} accentKey="refunded" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="در انتظار" value={summary.pending_count ?? 0} accentKey="pending" />
          </Grid>
        </Grid>
      ) : null}

      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => setIsSearchOpen((p) => !p)}
          >
            <Icon
              icon={isSearchOpen ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-left-linear'}
              width={18}
            />
            <Icon icon="solar:filter-linear" width={20} />
            <Typography variant="h6">فیلتر دریافتی‌ها</Typography>
            <Chip size="small" label="پیش‌فرض: امروز" variant="outlined" sx={{ mr: 'auto' }} />
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
                  <Field.Select name="process_definition_key" label="فرایند / خدمت">
                    {PROCESS_DEFINITION_OPTIONS.map((p) => (
                      <MenuItem key={p.value || 'all'} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Select name="status" label="وضعیت پرداخت">
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s.value || 'all'} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                  <Field.Text name="branch_id" label="شناسه شعبه" />
                  <Field.Text name="user_id" label="شناسه کاربر (ثبت‌کننده)" />
                  <Field.Text name="applicant_user_id" label="شناسه متقاضی" />
                  <Field.Text name="service_id" label="شناسه خدمت" />
                  <Field.Text name="process_instance_id" label="شناسه فرایند" />
                  <NoSsr>
                    <Field.DatePicker
                      name="from"
                      label="از تاریخ (شمسی)"
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </NoSsr>
                  <NoSsr>
                    <Field.DatePicker
                      name="to"
                      label="تا تاریخ (شمسی)"
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </NoSsr>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      reset(getDefaultFinanceFilters());
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
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6">جزئیات پرداخت</Typography>
                <Chip
                  size="small"
                  label={paymentStatusLabel(detail.status)}
                  color={statusChipColor(detail.status)}
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
                    در حال بارگذاری…
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      شناسه پرداخت: {detail.payment_id}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 1.5,
                      }}
                    >
                      <DetailField label="مبلغ">{formatRial(detail.amount)}</DetailField>
                      <DetailField label="تاریخ پرداخت">{detail.paid_at_label}</DetailField>
                      <DetailField label="فرایند">
                        {processDefinitionLabel(detail.process_definition_key)}
                      </DetailField>
                      <DetailField label="وضعیت فرایند">{detail.process_status || '—'}</DetailField>
                      <DetailField label="شناسه فرایند">{detail.process_instance_id || '—'}</DetailField>
                      <DetailField label="مرحله پرداخت">{detail.process_step_id || '—'}</DetailField>
                      <DetailField label="شعبه">{detail.branch_id || '—'}</DetailField>
                      <DetailField label="متقاضی">{detail.applicant_user_id || '—'}</DetailField>
                      <DetailField label="کاربر">{detail.user_id || '—'}</DetailField>
                      <DetailField label="درگاه">{detail.payment_gateway || '—'}</DetailField>
                      <DetailField label="شناسه تراکنش">
                        <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext' }}>
                          {detail.transaction_id || '—'}
                        </Box>
                      </DetailField>
                      <DetailField label="شناسه ارجاع">
                        <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext' }}>
                          {detail.reference_id || '—'}
                        </Box>
                      </DetailField>
                      <DetailField label="شماره کارت">{detail.card_number || '—'}</DetailField>
                      <DetailField label="شماره سفارش">{detail.order_id || '—'}</DetailField>
                    </Box>
                    {detail.description ? (
                      <DetailField label="توضیحات">{detail.description}</DetailField>
                    ) : null}
                    {detail.refunded_amount > 0 ? (
                      <Alert severity="info">
                        مبلغ استرداد شده: {formatRial(detail.refunded_amount)}
                      </Alert>
                    ) : null}
                  </>
                )}
              </Stack>
            </Scrollbar>

            {detail.refund_eligible && !detailLoading ? (
              <>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    color="warning"
                    variant="contained"
                    startIcon={<Icon icon="solar:undo-left-round-linear" width={20} />}
                    onClick={() => setRefundTarget(detail)}
                  >
                    برگرداندن هزینه
                  </Button>
                </Box>
              </>
            ) : null}
          </>
        )}
      </Drawer>

      <Dialog open={Boolean(refundTarget)} onClose={() => !refundLoading && setRefundTarget(null)}>
        <DialogTitle>تأیید استرداد وجه</DialogTitle>
        <DialogContent>
          <DialogContentText>
            آیا از برگرداندن مبلغ{' '}
            <strong>{formatRial(refundTarget?.amount)}</strong> برای پرداخت شماره{' '}
            <strong>{refundTarget?.payment_id}</strong> اطمینان دارید؟
            <br />
            این عمل فقط برای فرایندهایی که با رد خاتمه یافته‌اند مجاز است.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundTarget(null)} disabled={refundLoading}>
            انصراف
          </Button>
          <Button color="warning" variant="contained" onClick={handleRefund} disabled={refundLoading}>
            {refundLoading ? 'در حال استرداد…' : 'تأیید استرداد'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
