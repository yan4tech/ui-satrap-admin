'use client';

import { Grid, Alert } from '@mui/material';

import { useCentralDashboardOverview } from 'src/hooks/use-central-dashboard-overview';

import { PERM, userHasPermission } from 'src/lib/permissions';

import { ActivityFeedCard } from './_components/activity-feed-card';
import { DashboardPageShell } from './_components/dashboard-page-shell';
import { HorizontalBarsCard } from './_components/horizontal-bars-card';
import { InfoBanner } from './_components/info-banner';
import { KpiGrid } from './_components/kpi-grid';
import { ProcessKpiTabs } from './_components/process-kpi-tabs';
import { ProgressAlertsCard } from './_components/progress-alerts-card';
import { ServiceBreakdownCards } from './_components/service-breakdown-cards';
import { StatusListCard } from './_components/status-list-card';
import { DashboardFetchState } from './_components/dashboard-fetch-state';
import { BranchOverviewDashboardSkeleton } from './_components/dashboard-section-skeleton';
import { faCount } from './_lib/dashboard-mappers';

import { useAuthContext } from 'src/auth/hooks';

export function CentralDashboardView() {
  const { user } = useAuthContext();
  const { data, error, isLoading, enabled, refresh } = useCentralDashboardOverview();

  const hasPermission = enabled || userHasPermission(user, PERM.ui.dashboardView);

  if (!hasPermission) {
    return (
      <DashboardPageShell
        title="داشبورد شعبه مرکزی"
        subtitle="دسترسی به این بخش محدود است"
        badge="سطح سازمان"
        accent="primary"
      >
        <Alert severity="warning">شما دسترسی مشاهده داشبورد شعبه مرکزی را ندارید.</Alert>
      </DashboardPageShell>
    );
  }

  const branchName = data?.branchName ?? '…';

  return (
    <DashboardPageShell
      title="داشبورد شعبه مرکزی"
      subtitle={`${branchName} · نمای کلی عملکرد شعبه مرکزی، شعب زیرمجموعه و خدمات فعال در سطح سازمان`}
      actionLabel="دریافت گزارش امروز"
      onAction={refresh}
      actionDisabled={isLoading}
      badge="سطح سازمان"
      accent="primary"
    >
      <DashboardFetchState error={error} onRetry={refresh}>
        {isLoading ? <BranchOverviewDashboardSkeleton /> : null}

        {!isLoading && data?.isEmpty ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            داده‌ای برای نمایش در داشبورد شعبه مرکزی وجود ندارد.
          </Alert>
        ) : null}

        {!isLoading && data && !data.isEmpty ? (
          <>
            <InfoBanner
              title={`${branchName} — نمای مدیریتی`}
              subtitle={data.meta.bannerSubtitle}
              icon="solar:buildings-3-bold-duotone"
              chips={[
                { label: 'وضعیت کلی: پایدار', color: 'success', variant: 'soft' },
                {
                  label: `در صف: ${faCount(data.banner?.pendingReview ?? 0)}`,
                  color: 'warning',
                  variant: 'soft',
                },
                {
                  label: `موفقیت: ${faCount(data.banner?.successRate ?? '—')}`,
                  color: 'info',
                  variant: 'soft',
                },
              ]}
            />

            <KpiGrid items={data.kpis} />

            <ServiceBreakdownCards
              services={data.serviceBreakdown}
              sectionTitle="خلاصه وضعیت خدمات سازمان"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <HorizontalBarsCard
                  title="روند ۶ ماهه درخواست‌ها"
                  subheader="حجم ماهانه درخواست‌های ثبت‌شده"
                  items={data.monthlyActivity}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <HorizontalBarsCard
                  title="سهم وضعیت خدمات"
                  subheader="توزیع درصدی وضعیت‌ها"
                  items={data.statusDistribution}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <HorizontalBarsCard
                  title="مقایسه خروجی خدمات"
                  subheader="تعداد تکمیل‌شده به تفکیک خدمت"
                  items={data.serviceBreakdown.map((service) => ({
                    label: service.name,
                    value: service.completed,
                    color: 'success.main',
                  }))}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <ProgressAlertsCard
                  title="تسک‌های فوری مدیریتی"
                  subheader="اقداماتی که نیاز به پیگیری سریع دارند"
                  tasks={data.pendingTasks}
                  emptyMessage="اقدام فوری برای نمایش وجود ندارد"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <StatusListCard
                  title="وضعیت سرویس‌ها"
                  items={data.serviceStatus}
                  emptyMessage="وضعیت خدماتی برای نمایش وجود ندارد"
                />
              </Grid>
            </Grid>

            {data.processKpiByProvince?.length ? (
              <ProcessKpiTabs data={data.processKpiByProvince} />
            ) : null}

            <ActivityFeedCard
              title="فعالیت‌های اخیر"
              activities={data.latestActivities}
              emptyMessage="فعالیتی ثبت نشده است"
            />
          </>
        ) : null}
      </DashboardFetchState>
    </DashboardPageShell>
  );
}
