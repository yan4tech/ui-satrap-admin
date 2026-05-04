'use client';

import React from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Alert,
  Paper,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
} from '@mui/material';

function statusChipColor(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'CREATED' || s === 'READY') return 'warning';
  if (s === 'COMPLETED' || s === 'DONE') return 'success';
  if (s === 'CANCELLED') return 'error';
  return 'default';
}

function FieldRow({ label, value, showDash = false }) {
  const empty = value === undefined || value === null || value === '';
  if (empty && !showDash) return null;
  const display =
    empty && showDash
      ? '—'
      : typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value ?? '');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, 200px) 1fr' },
        gap: { xs: 0.5, sm: 2 },
        py: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          wordBreak: 'break-word',
          color: empty && showDash ? 'text.disabled' : 'text.primary',
          fontFamily: display.length > 80 || display.startsWith('{') ? 'monospace' : 'inherit',
          fontSize: display.length > 80 ? 12 : undefined,
        }}
      >
        {display}
      </Typography>
    </Box>
  );
}

function SectionCard({ title, subtitle, children }) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        mb: 2,
        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.06)}`,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>{children}</Box>
    </Paper>
  );
}

function TaskVersionsTable({ versions, selectedTaskId }) {
  const theme = useTheme();
  if (!versions?.length) return null;
  return (
    <SectionCard title="تسک‌های این مرحله" subtitle="مطابق element_id در map «tasks»">
      <TableContainer
        sx={{
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 240,
          overflow: 'auto',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.12) }}>
                شناسه تسک
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.12) }}>
                وضعیت
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.12) }}>
                ایجاد
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.12) }}>
                بروزرسانی
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {versions.map((row) => (
              <TableRow
                key={row.ID}
                hover
                selected={selectedTaskId != null && row.ID === selectedTaskId}
                sx={{
                  '&:nth-of-type(even)': { bgcolor: alpha(theme.palette.action.hover, 0.35) },
                }}
              >
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.ID}</TableCell>
                <TableCell>
                  <Chip
                    label={row.status ?? '—'}
                    size="small"
                    color={statusChipColor(row.status)}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell dir="ltr" sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {row.CreatedAt ?? '—'}
                </TableCell>
                <TableCell dir="ltr" sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {row.UpdatedAt ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  );
}

function TaskDetailFields({ task, showSourceCaption, showDash }) {
  const theme = useTheme();
  return (
    <Stack spacing={0}>
      {showSourceCaption ? (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: '1px solid',
            borderColor: alpha(theme.palette.info.main, 0.22),
          }}
        >
          <Typography variant="caption" color="text.secondary" dir="ltr" sx={{ lineHeight: 1.6 }}>
            GET /api/engine/service/tasks/&lt;process_instance_id&gt; — فیلدها از آبجکت تسک در map «tasks»
          </Typography>
        </Box>
      ) : null}

      <SectionCard title="اطلاعات اصلی تسک">
        <Stack spacing={0}>
          <FieldRow label="process_instance_id" value={task.process_instance_id} showDash={showDash} />
          <FieldRow label="ID" value={task.ID} showDash={showDash} />
          <FieldRow label="CreatedAt" value={task.CreatedAt} showDash={showDash} />
          <FieldRow label="UpdatedAt" value={task.UpdatedAt} showDash={showDash} />
          <FieldRow label="name" value={task.name} showDash={showDash} />
          <FieldRow label="element_id" value={task.element_id} showDash={showDash} />
          <FieldRow label="type" value={task.type} showDash={showDash} />
          <FieldRow label="status" value={task.status} showDash={showDash} />
          <FieldRow label="execution_id" value={task.execution_id} showDash={showDash} />
        </Stack>
      </SectionCard>

      <SectionCard title="attached_data">
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            borderRadius: 1.5,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
            maxHeight: 340,
            fontSize: 11,
            lineHeight: 1.55,
            direction: 'ltr',
            textAlign: 'left',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          {JSON.stringify(task.attached_data ?? {}, null, 2)}
        </Box>
      </SectionCard>
    </Stack>
  );
}

export default function ServiceOneStepTaskDetailDialog({
  open,
  onClose,
  task,
  stepLabel,
  loading = false,
  error = null,
  taskVersionsForElement = null,
  /** اگر فرایند در موتور reject شده باشد، متن دلیل (مثلاً central_reject_payload.comment) */
  rejectBannerComment = '',
}) {
  const theme = useTheme();
  const isSyntheticStart = Boolean(task && task.__syntheticStart);
  const isInferredStart = Boolean(task && task.__inferredForStartStep);
  const isRealTask = Boolean(task && !task.__syntheticStart);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: 'hidden',
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.14)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          py: 2.5,
          px: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 100%)`,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" useFlexGap>
          <Typography component="span" variant="h6" fontWeight={800}>
            جزییات مرحله
          </Typography>
          <Chip label={stepLabel} color="primary" size="medium" sx={{ fontWeight: 700 }} />
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {!loading && rejectBannerComment ? (
          <Paper
            elevation={0}
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'error.main',
              bgcolor: alpha(theme.palette.error.main, 0.06),
              backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.12)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
            }}
          >
            <Stack direction="row" alignItems="flex-start" gap={1.25}>
              <Chip label="رد فرایند" color="error" size="small" sx={{ fontWeight: 800, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="error.dark" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                  متن دلیل رد ثبت‌شده در موتور
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.7,
                    fontWeight: 500,
                  }}
                >
                  {rejectBannerComment}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : null}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
            <CircularProgress size={36} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              در حال دریافت از API…
            </Typography>
          </Box>
        ) : null}
        {!loading && error ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : null}
        {!loading && !task && !error ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            داده‌ای برای نمایش نیست.
          </Typography>
        ) : null}
        {!loading && task && isSyntheticStart ? (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              در پاسخ API تسکی با <strong>element_id = start</strong> نیست؛ فیلدها در صورت نبود مقدار با «—» نمایش
              داده می‌شود.
            </Alert>
            <TaskDetailFields task={task} showSourceCaption showDash />
          </Stack>
        ) : null}
        {!loading && task && isInferredStart ? (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              تسک جدا با <strong>start</strong> نیست؛ فیلدها از قدیمی‌ترین تسک در map «tasks» است.
            </Alert>
            <TaskVersionsTable versions={taskVersionsForElement} selectedTaskId={task?.ID} />
            <TaskDetailFields task={task} showSourceCaption showDash={false} />
          </Stack>
        ) : null}
        {!loading && task && isRealTask && !isInferredStart ? (
          <Stack spacing={0}>
            <TaskVersionsTable versions={taskVersionsForElement} selectedTaskId={task?.ID} />
            <TaskDetailFields task={task} showSourceCaption showDash={false} />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.action.hover, 0.35),
        }}
      >
        <Button variant="contained" onClick={onClose} disabled={loading} size="large" sx={{ minWidth: 120, borderRadius: 2 }}>
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
