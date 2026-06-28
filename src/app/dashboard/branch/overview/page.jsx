'use client';

import { Grid, Alert } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBranchDashboardOverview } from 'src/hooks/use-branch-dashboard-overview';

import { PERM, userHasPermission } from 'src/lib/permissions';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { KpiGrid } from '../../_components/kpi-grid';
import { faCount } from '../../_lib/dashboard-mappers';
import { InfoBanner } from '../../_components/info-banner';
import { TeamListCard } from '../../_components/team-list-card';
import { InboxQueueCard } from '../../_components/inbox-queue-card';
import { StatusListCard } from '../../_components/status-list-card';
import { ActivityFeedCard } from '../../_components/activity-feed-card';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { ProgressAlertsCard } from '../../_components/progress-alerts-card';
import { DashboardFetchState } from '../../_components/dashboard-fetch-state';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
import { BranchOverviewDashboardSkeleton } from '../../_components/dashboard-section-skeleton';

export default function BranchOverviewPage() {
  const { user } = useAuthContext();
  const { data, error, isLoading, enabled, refresh } = useBranchDashboardOverview();

  const hasPermission =
    enabled || userHasPermission(user, PERM.ui.dashboardBranchView);

  if (!hasPermission) {
    return (
      <DashboardPageShell
        title="داشبورد شعبه"
        subtitle="دسترسی به این بخش محدود است"
        badge="مدیر شعبه"
        accent="primary"
      >
        <Alert severity="warning">شما دسترسی مشاهده داشبورد شعبه را ندارید.</Alert>
      </DashboardPageShell>
    );
  }

  const branchName = data?.branchName ?? '…';
  const branchCode = data?.branchCode ?? '…';
  const managerName = data?.managerName ?? '…';

  return (
    <DashboardPageShell
      title={`داشبورد شعبه — ${branchName}`}
      subtitle={`کد شعبه ${branchCode} · مدیر شعبه: ${managerName} · وضعیت عملیاتی شعبه در یک نگاه`}
      actionLabel="گزارش روزانه"
      onAction={refresh}
      actionDisabled={isLoading}
      badge="مدیر شعبه"
      accent="primary"
    >
      <DashboardFetchState error={error} onRetry={refresh}>
        {isLoading ? (
          <BranchOverviewDashboardSkeleton />
        ) : null}

        {!isLoading && data?.isEmpty ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            داده‌ای برای نمایش در داشبورد شعبه وجود ندارد.
          </Alert>
        ) : null}

        {!isLoading && data && !data.isEmpty ? (
          <>
            <InfoBanner
              title={data.meta.branchName}
              subtitle={data.meta.bannerSubtitle}
              icon="solar:buildings-bold-duotone"
              chips={[
                { label: 'وضعیت: فعال', color: 'success', variant: 'soft' },
                {
                  label: `صندوق ورودی: ${faCount(data.banner?.inboxCount ?? 0)}`,
                  color: 'warning',
                  variant: 'soft',
                },
                {
                  label: `تکمیل ماه: ${faCount(data.banner?.monthCompleted ?? 0)}`,
                  color: 'info',
                  variant: 'soft',
                },
              ]}
            />

            <KpiGrid items={data.kpis} />

            <ServiceBreakdownCards
              services={data.serviceBreakdown}
              sectionTitle="وضعیت خدمات این شعبه"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <HorizontalBarsCard
                  title="فعالیت ۷ روز اخیر"
                  subheader="تعداد درخواست‌های روزانه"
                  items={data.weeklyActivity}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <HorizontalBarsCard
                  title="توزیع وضعیت درخواست‌های شعبه"
                  items={data.statusDistribution}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <HorizontalBarsCard
                  title="عملکرد اپراتورها (تکمیل‌شده)"
                  items={data.operatorPerformance}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <InboxQueueCard
                  title="صف بررسی مدیر شعبه"
                  subheader="درخواست‌هایی که نیاز به اقدام فوری دارند"
                  items={data.pendingReviews}
                  showAction
                  actionHref={paths.dashboard.services.inbox}
                  emptyMessage="درخواستی در صف بررسی نیست"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <TeamListCard
                  title="تیم شعبه"
                  members={data.teamMembers}
                  emptyMessage="عضوی در تیم شعبه ثبت نشده است"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <ProgressAlertsCard
                  title="هشدارها و اقدامات شعبه"
                  tasks={data.branchAlerts}
                  emptyMessage="هشداری برای نمایش وجود ندارد"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <StatusListCard
                  title="وضعیت خدمات شعبه"
                  items={data.serviceStatus}
                  emptyMessage="وضعیت خدماتی برای نمایش وجود ندارد"
                  footerActions={[
                    {
                      component: RouterLink,
                      href: paths.dashboard.services.inbox,
                      variant: 'contained',
                      startIcon: <Iconify icon="solar:inbox-in-bold-duotone" />,
                      children: 'صندوق کار',
                    },
                    {
                      component: RouterLink,
                      href: paths.dashboard.user.search,
                      variant: 'outlined',
                      startIcon: <Iconify icon="solar:user-bold-duotone" />,
                      children: 'کاربران شعبه',
                    },
                  ]}
                />
              </Grid>
            </Grid>

            <ActivityFeedCard
              title="فعالیت‌های اخیر شعبه"
              activities={data.latestActivities}
              emptyMessage="فعالیتی در شعبه ثبت نشده است"
            />
          </>
        ) : null}
      </DashboardFetchState>
    </DashboardPageShell>
  );
}
