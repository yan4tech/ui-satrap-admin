'use client';

import { Box, Grid, Stack, Skeleton } from '@mui/material';

import { DashboardCard } from './dashboard-card';

/**
 * Per-section loading skeletons — match real dashboard card dimensions to avoid layout shift.
 *
 * @typedef {'kpi' | 'bars' | 'inbox' | 'list'} DashboardSectionSkeletonVariant
 */

function KpiSectionSkeleton({ count = 4, cardHeight = 104 }) {
  return (
    <Grid container spacing={2} aria-hidden>
      {Array.from({ length: count }, (_, key) => (
        <Grid key={key} size={{ xs: 12, sm: 6, md: count <= 3 ? 4 : 3 }}>
          <Skeleton variant="rounded" height={cardHeight} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );
}

function BarsSectionSkeleton({ rows = 7, minHeight = 280 }) {
  return (
    <DashboardCard hover={false} sx={{ height: '100%', minHeight }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Skeleton variant="text" width="55%" height={28} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
      </Box>
      <Stack spacing={1.5} sx={{ px: 2.5, pb: 2.5 }}>
        {Array.from({ length: rows }, (_, key) => (
          <Box key={key}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Skeleton variant="text" width="35%" height={18} />
              <Skeleton variant="text" width={28} height={18} />
            </Stack>
            <Skeleton variant="rounded" height={10} sx={{ borderRadius: 99 }} />
          </Box>
        ))}
      </Stack>
    </DashboardCard>
  );
}

function InboxSectionSkeleton({ rows = 4, minHeight = 320 }) {
  return (
    <DashboardCard hover={false} sx={{ height: '100%', minHeight }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ px: 2.5, pt: 2.5, pb: 1 }}
      >
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="45%" height={28} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="rounded" width={88} height={32} />
      </Stack>
      <Stack spacing={0} sx={{ px: 2.5, pb: 2.5 }}>
        {Array.from({ length: rows }, (_, key) => (
          <Stack
            key={key}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.75, borderTop: key > 0 ? 1 : 0, borderColor: 'divider' }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="85%" height={16} sx={{ mt: 0.5 }} />
            </Box>
            <Stack direction="row" spacing={0.75}>
              <Skeleton variant="rounded" width={48} height={24} />
              <Skeleton variant="rounded" width={56} height={24} />
            </Stack>
          </Stack>
        ))}
      </Stack>
    </DashboardCard>
  );
}

function ListSectionSkeleton({ rows = 4, showAvatar = true, minHeight = 320 }) {
  return (
    <DashboardCard hover={false} sx={{ height: '100%', minHeight }}>
      <Skeleton variant="text" width="40%" height={28} sx={{ mx: 2.5, mt: 2.5, mb: 1 }} />
      <Stack sx={{ px: 2.5, pb: 2.5 }}>
        {Array.from({ length: rows }, (_, key) => (
          <Stack
            key={key}
            direction="row"
            alignItems="center"
            spacing={showAvatar ? 1.5 : 0}
            sx={{ py: 1.25 }}
          >
            {showAvatar ? (
              <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
            ) : null}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="55%" height={20} />
              <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="rounded" width={64} height={24} sx={{ flexShrink: 0 }} />
          </Stack>
        ))}
      </Stack>
    </DashboardCard>
  );
}

function BannerSectionSkeleton() {
  return <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2.5 }} aria-hidden />;
}

function ServiceBreakdownSectionSkeleton({ count = 3 }) {
  return (
    <Stack spacing={1.5} aria-hidden>
      <Skeleton variant="text" width="30%" height={28} sx={{ px: 0.5 }} />
      <Grid container spacing={2}>
        {Array.from({ length: count }, (_, key) => (
          <Grid key={key} size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

/**
 * @param {{
 *   variant: DashboardSectionSkeletonVariant,
 *   count?: number,
 *   rows?: number,
 *   showAvatar?: boolean,
 *   cardHeight?: number,
 *   minHeight?: number,
 *   sx?: import('@mui/material').SxProps,
 * }} props
 */
export function DashboardSectionSkeleton({
  variant,
  count,
  rows,
  showAvatar,
  cardHeight,
  minHeight,
  sx,
}) {
  const content = (() => {
    switch (variant) {
      case 'kpi':
        return <KpiSectionSkeleton count={count} cardHeight={cardHeight} />;
      case 'bars':
        return <BarsSectionSkeleton rows={rows} minHeight={minHeight} />;
      case 'inbox':
        return <InboxSectionSkeleton rows={rows} minHeight={minHeight} />;
      case 'list':
        return <ListSectionSkeleton rows={rows} showAvatar={showAvatar} minHeight={minHeight} />;
      default:
        return null;
    }
  })();

  if (!content) return null;

  return sx ? <Box sx={sx}>{content}</Box> : content;
}

/** Branch manager overview — mirrors overview/page.jsx section order. */
export function BranchOverviewDashboardSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true" aria-label="در حال بارگذاری داشبورد شعبه">
      <BannerSectionSkeleton />
      <DashboardSectionSkeleton variant="kpi" count={4} />
      <ServiceBreakdownSectionSkeleton count={3} />
      <Grid container spacing={2}>
        {[0, 1, 2].map((key) => (
          <Grid key={key} size={{ xs: 12, md: 4 }}>
            <DashboardSectionSkeleton variant="bars" />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DashboardSectionSkeleton variant="inbox" />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <DashboardSectionSkeleton variant="list" />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DashboardSectionSkeleton variant="bars" rows={4} minHeight={280} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <DashboardSectionSkeleton variant="list" showAvatar={false} />
        </Grid>
      </Grid>
      <DashboardSectionSkeleton variant="list" rows={5} showAvatar={false} minHeight={240} />
    </Stack>
  );
}

/** Branch operator user dashboard — mirrors user/page.jsx section order. */
export function BranchUserDashboardSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true" aria-label="در حال بارگذاری داشبورد کاربر">
      <BannerSectionSkeleton />
      <DashboardSectionSkeleton variant="kpi" count={4} />
      <DashboardSectionSkeleton variant="kpi" count={3} cardHeight={120} />
      <ServiceBreakdownSectionSkeleton count={3} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardSectionSkeleton variant="bars" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardSectionSkeleton variant="bars" rows={5} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardSectionSkeleton variant="bars" rows={4} minHeight={280} />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <DashboardSectionSkeleton variant="inbox" />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <DashboardSectionSkeleton variant="list" />
        </Grid>
      </Grid>
    </Stack>
  );
}
