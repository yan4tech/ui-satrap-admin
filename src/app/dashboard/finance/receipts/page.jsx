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
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';

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

function buildSummaryItems(summary, rowCount) {
  const total = Number(summary?.total_count ?? rowCount ?? 0);
  const paidCount = Number(summary?.paid_count ?? 0);
  const refundedCount = Number(summary?.refunded_count ?? 0);
  const totalPaid = Number(summary?.total_paid_amount ?? 0);
  const totalRefunded = Number(summary?.total_refunded_amount ?? summary?.total_refunded ?? 0);
  const net = totalPaid - totalRefunded;
  const avgPaid = paidCount > 0 ? totalPaid / paidCount : 0;
  const paidRate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
  const refundRate = total > 0 ? Math.round((refundedCount / total) * 100) : 0;
  const refundAmountRate =
    totalPaid > 0 ? Math.round((totalRefunded / totalPaid) * 100) : 0;

  return [
    {
      id: 'total',
      title: 'تعداد کل',
      value: total,
      icon: 'solar:documents-minimalistic-linear',
      color: 'primary',
    },
    {
      id: 'paid_count',
      title: 'پرداخت موفق',
      value: paidCount,
      hint: total > 0 ? `${paidRate}٪ از کل` : null,
      icon: 'solar:check-circle-linear',
      color: 'success',
    },
    {
      id: 'paid_amount',
      title: 'جمع پرداخت‌ها',
      value: formatRial(totalPaid),
      icon: 'solar:wallet-linear',
      color: 'success',
    },
    {
      id: 'avg',
      title: 'میانگین هر پرداخت',
      value: formatRial(avgPaid),
      icon: 'solar:chart-linear',
      color: 'info',
    },
    {
      id: 'refunded_count',
      title: 'تعداد استرداد',
      value: refundedCount,
      icon: 'solar:undo-left-round-linear',
      color: 'warning',
    },
    {
      id: 'refunded_amount',
      title: 'جمع استرداد',
      value: formatRial(totalRefunded),
      icon: 'solar:card-recive-linear',
      color: 'warning',
    },
    {
      id: 'net',
      title: 'خالص دریافتی',
      value: formatRial(net),
      hint: 'پرداخت‌ها منهای استرداد',
      icon: 'solar:calculator-linear',
      color: 'primary',
    },
    {
      id: 'refund_rate',
      title: 'نرخ استرداد',
      value: `${refundRate}٪`,
      hint:
        totalPaid > 0
          ? `${refundAmountRate}٪ از مجموع مبالغ پرداختی`
          : refundedCount > 0
            ? `${refundedCount} مورد`
            : 'بدون استرداد',
      icon: 'solar:chart-2-linear',
      color: 'error',
    },
  ];
}

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
    refunded_at: item?.refunded_at ?? item?.RefundedAt,
    refunded_at_label: formatDateTime(item?.refunded_at ?? item?.RefundedAt),
    refunded_by: item?.refunded_by ?? item?.RefundedBy,
    refund_tracking_code: item?.refund_tracking_code ?? item?.RefundTrackingCode ?? '',
    refund_tracking_number: item?.refund_tracking_number ?? item?.RefundTrackingNumber ?? '',
    refund_response_code: item?.refund_response_code ?? item?.RefundResponseCode ?? '',
    refund_response_message: item?.refund_response_message ?? item?.RefundResponseMessage ?? '',
    refund_inquiry_status: item?.refund_inquiry_status ?? item?.RefundInquiryStatus,
    refund_inquiry_status_label:
      item?.refund_inquiry_status_label ?? item?.RefundInquiryStatusLabel ?? '',
    refund_inquiry_d_iban: item?.refund_inquiry_d_iban ?? item?.RefundInquiryDIban ?? '',
    refund_inquiry_date: item?.refund_inquiry_date ?? item?.RefundInquiryDate ?? '',
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

function refundBlockedReason(row) {
  const status = String(row?.status ?? '').toUpperCase();
  if (status === 'REFUNDED' || Number(row?.refunded_amount) > 0) {
    return 'این پرداخت قبلاً استرداد شده است';
  }
  if (status !== 'PAID') {
    return 'فقط پرداخت‌های موفق قابل استرداد هستند';
  }
  if (!String(row?.process_status ?? '').toUpperCase().includes('REJECT')) {
    return 'فرایند باید با وضعیت «رد شده» خاتمه یافته باشد';
  }
  if (!row?.refund_eligible) {
    return 'فرایند هنوز به‌طور کامل بسته نشده است';
  }
  return null;
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

function formatStatValue(value) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fa-IR').format(value);
  }
  return value;
}

function SummaryStatCard({ title, value, hint, icon, color = 'primary' }) {
  const paletteKey = color === 'grey' ? 'grey' : color;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRight: 3,
        borderRightColor: `${paletteKey}.main`,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 2 },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${paletteKey}.lighter`,
              color: `${paletteKey}.main`,
            }}
          >
            <Icon icon={icon} width={22} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {title}
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.25, fontWeight: 700, lineHeight: 1.3 }}>
              {formatStatValue(value)}
            </Typography>
            {hint ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                {hint}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SummaryStatsGrid({ summary, rowCount }) {
  const items = buildSummaryItems(summary, rowCount);

  return (
    <Grid container spacing={1.5}>
      {items.map((item) => (
        <Grid key={item.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <SummaryStatCard {...item} />
        </Grid>
      ))}
    </Grid>
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
  const [inquiryLoading, setInquiryLoading] = useState(false);

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
      setErrorMessage(extractMembershipErrorMessage(error, 'خطا در دریافت گزارش مالی'));
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
      setErrorMessage(extractMembershipErrorMessage(error, 'خطا در دریافت جزئیات پرداخت'));
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

  const handleInquiryRefund = async (paymentId) => {
    if (!paymentId) return;
    setInquiryLoading(true);
    setErrorMessage(null);
    try {
      const res = await axios.post(`/api/payment/financial/receipts/${paymentId}/refund/inquiry`);
      const mapped = mapReceiptRow(res?.data?.data ?? {});
      setDetail(mapped);
      await fetchData();
    } catch (error) {
      setErrorMessage(extractMembershipErrorMessage(error, 'خطا در استعلام ریفاند'));
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget?.payment_id) return;
    setRefundLoading(true);
    setErrorMessage(null);
    try {
      const res = await axios.post(
        `/api/payment/financial/receipts/${refundTarget.payment_id}/refund`,
        { amount: refundTarget.amount }
      );
      const refunded = mapReceiptRow(res?.data?.data ?? {});
      setRefundTarget(null);
      setDetail(refunded);
      await fetchData();
    } catch (error) {
      setErrorMessage(extractMembershipErrorMessage(error, 'خطا در استرداد وجه'));
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
      field: 'refunded_amount',
      headerName: 'مبلغ استرداد',
      width: 130,
      valueFormatter: (value) => (Number(value) > 0 ? formatRial(value) : '—'),
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
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const blocked = refundBlockedReason(params.row);
        const canRefund = params.row.refund_eligible;
        return (
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
            {canRefund ? (
              <Tooltip title="استرداد وجه">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => setRefundTarget(params.row)}
                  aria-label="استرداد"
                >
                  <Icon icon="solar:undo-left-round-linear" width={20} />
                </IconButton>
              </Tooltip>
            ) : String(params.row.status).toUpperCase() === 'REFUNDED' ? (
              <Tooltip title="استرداد انجام شده">
                <span>
                  <IconButton size="small" disabled aria-label="استرداد شده">
                    <Icon icon="solar:check-circle-linear" width={20} />
                  </IconButton>
                </span>
              </Tooltip>
            ) : blocked ? (
              <Tooltip title={blocked}>
                <span>
                  <IconButton size="small" disabled aria-label="غیرقابل استرداد">
                    <Icon icon="solar:undo-left-round-linear" width={20} />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Stack>
        );
      },
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
        <Box sx={{ mb: 2.5 }}>
          <SummaryStatsGrid summary={summary} rowCount={rowCount} />
        </Box>
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
            <Chip size="small" label="پیش‌فرض: هفت روز اخیر" variant="outlined" sx={{ mr: 'auto' }} />
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
                      <MenuItem
                        key={p.value || 'all'}
                        value={p.value}
                        sx={{ whiteSpace: 'normal', lineHeight: 1.5, py: 1 }}
                      >
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
                    {Number(detail.refunded_amount) > 0 ||
                    String(detail.status).toUpperCase() === 'REFUNDED' ? (
                      <Alert severity="warning" icon={<Icon icon="solar:undo-left-round-linear" width={22} />}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          اطلاعات ریفاند (به‌پرداخت ملت)
                        </Typography>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 1,
                          }}
                        >
                          <DetailField label="مبلغ استرداد">
                            {formatRial(detail.refunded_amount)}
                          </DetailField>
                          <DetailField label="تاریخ استرداد">
                            {detail.refunded_at_label || '—'}
                          </DetailField>
                          <DetailField label="کد پاسخ درگاه">
                            {detail.refund_response_code || '—'}
                          </DetailField>
                          <DetailField label="پیام درگاه">
                            {detail.refund_response_message || '—'}
                          </DetailField>
                          <DetailField label="کد رهگیری درخواست">
                            <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext' }}>
                              {detail.refund_tracking_code || '—'}
                            </Box>
                          </DetailField>
                          <DetailField label="شماره پیگیری">
                            <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext' }}>
                              {detail.refund_tracking_number || '—'}
                            </Box>
                          </DetailField>
                          <DetailField label="وضعیت پایا">
                            {detail.refund_inquiry_status_label ||
                              (detail.refund_inquiry_status != null
                                ? String(detail.refund_inquiry_status)
                                : '—')}
                          </DetailField>
                          <DetailField label="تاریخ استعلام پایا">
                            {detail.refund_inquiry_date || '—'}
                          </DetailField>
                          <DetailField label="شبای مقصد">
                            <Box component="span" dir="ltr" sx={{ unicodeBidi: 'plaintext' }}>
                              {detail.refund_inquiry_d_iban || '—'}
                            </Box>
                          </DetailField>
                          <DetailField label="انجام‌دهنده">
                            {detail.refunded_by || '—'}
                          </DetailField>
                        </Box>
                        {detail.refund_tracking_code || detail.refund_tracking_number ? (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1.5 }}
                            disabled={inquiryLoading}
                            onClick={() => handleInquiryRefund(detail.payment_id)}
                            startIcon={
                              inquiryLoading ? (
                                <Icon icon="svg-spinners:180-ring" width={18} />
                              ) : (
                                <Icon icon="solar:refresh-linear" width={18} />
                              )
                            }
                          >
                            استعلام وضعیت ریفاند
                          </Button>
                        ) : null}
                      </Alert>
                    ) : null}
                    {!detail.refund_eligible &&
                    String(detail.status).toUpperCase() === 'PAID' &&
                    refundBlockedReason(detail) ? (
                      <Alert severity="info">{refundBlockedReason(detail)}</Alert>
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
                    استرداد وجه
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
            ابتدا درخواست به سرویس ریفاند به‌پرداخت ملت ارسال می‌شود و پس از تأیید (کد ۰۰۰)،
            وضعیت مالی به‌روزرسانی می‌گردد.
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
