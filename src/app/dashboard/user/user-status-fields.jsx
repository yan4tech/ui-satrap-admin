'use client';

import { Icon } from '@iconify/react';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';

import { StatusToggleCard } from 'src/components/status/active-status-field';

const USER_ACTIVE_CARD = {
  title: 'وضعیت کاربر',
  hint: 'کاربر غیرفعال نمی‌تواند وارد سامانه شود.',
  icon: 'solar:user-check-rounded-bold',
  positive: {
    value: true,
    label: 'فعال',
    color: 'success',
    icon: 'solar:check-circle-bold',
  },
  negative: {
    value: false,
    label: 'غیرفعال',
    color: 'error',
    icon: 'solar:close-circle-bold',
  },
};

/**
 * @param {{
 *   readOnly?: boolean,
 *   showVerified?: boolean,
 *   activeValue: boolean,
 *   verifiedValue?: boolean,
 *   isVerifiableNow?: boolean,
 *   onActiveChange: (value: boolean) => void,
 *   onVerifiedChange?: (value: boolean) => void,
 * }} props
 */
export function UserStatusFields({
  readOnly = false,
  showVerified = true,
  activeValue,
  verifiedValue = false,
  isVerifiableNow = true,
  onActiveChange,
  onVerifiedChange,
}) {
  return (
    <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 2.5,
          bgcolor: 'background.neutral',
          borderStyle: 'dashed',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Icon icon="solar:shield-check-bold" width={22} />
          <Typography variant="subtitle1" fontWeight={700}>
            {showVerified ? 'وضعیت حساب' : 'وضعیت کاربر'}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: showVerified ? 'repeat(2, minmax(0, 1fr))' : '1fr',
            },
            gap: 2,
            maxWidth: showVerified ? 'none' : { md: 480 },
          }}
        >
          <StatusToggleCard
            {...USER_ACTIVE_CARD}
            value={activeValue}
            onChange={onActiveChange}
            readOnly={readOnly}
            disabled={readOnly}
          />
          {showVerified && onVerifiedChange && (
            <StatusToggleCard
              title="تأیید هویت"
              hint={
                isVerifiableNow
                  ? 'پس از تکمیل اطلاعات الزامی قابل تأیید است.'
                  : 'ابتدا نام، نام خانوادگی، ایمیل، موبایل و نقش را کامل کنید.'
              }
              icon="solar:verified-check-bold"
              value={verifiedValue}
              onChange={onVerifiedChange}
              readOnly={readOnly}
              disabled={readOnly || !isVerifiableNow}
              positive={{
                value: true,
                label: 'تأیید شده',
                color: 'info',
                icon: 'solar:shield-check-bold',
              }}
              negative={{
                value: false,
                label: 'تأیید نشده',
                color: 'warning',
                icon: 'solar:clock-circle-bold',
              }}
            />
          )}
        </Box>

        {showVerified && !isVerifiableNow && !readOnly && (
          <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
            برای فعال‌کردن «تأیید شده»، فیلدهای نام، نام خانوادگی، ایمیل، موبایل و نقش را تکمیل کنید.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
