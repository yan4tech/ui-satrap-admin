'use client';

import { useMemo } from 'react';

import { Grid, Alert } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useUserDashboardOverview } from 'src/hooks/use-user-dashboard-overview';

import { PERM, userHasPermission } from 'src/lib/permissions';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { KpiGrid } from '../../_components/kpi-grid';
import { InfoBanner } from '../../_components/info-banner';
import { TimelineCard } from '../../_components/timeline-card';
import { PulseStatCards } from '../../_components/pulse-stat-cards';
import { InboxQueueCard } from '../../_components/inbox-queue-card';
import { WeeklyGoalCard } from '../../_components/weekly-goal-card';
import { SERVICE_LABELS } from 'src/lib/service-labels';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { DashboardFetchState } from '../../_components/dashboard-fetch-state';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
import { BranchUserDashboardSkeleton } from '../../_components/dashboard-section-skeleton';
import { faCount, resolveFirstInboxActionHref } from '../../_lib/dashboard-mappers';

function displayName(user) {
  const name = [user?.name, user?.family].filter(Boolean).join(' ').trim();
  return name || user?.mobile || 'کاربر شعبه';
}

function displayRole(user) {
  return user?.role?.title || user?.role_title || user?.role?.slug || 'کاربر عملیاتی';
}

export default function BranchUserDashboardPage() {
  const { user } = useAuthContext();
  const { data, error, isLoading, enabled, refresh } = useUserDashboardOverview();

  const hasPermission =
    enabled || userHasPermission(user, PERM.ui.dashboardBranchUserView);

  const fullName = useMemo(
    () => data?.userName || displayName(user),
    [data?.userName, user]
  );
  const roleTitle = useMemo(
    () => data?.roleTitle || displayRole(user),
    [data?.roleTitle, user]
  );

  const branchContext = data?.branchContext ?? { name: '…', code: '…' };

  const serviceLinks = useMemo(
    () =>
      [
        { perm: PERM.ui.servicesOne, path: paths.dashboard.services.one, label: SERVICE_LABELS.service1 },
        { perm: PERM.ui.servicesTwo, path: paths.dashboard.services.two, label: SERVICE_LABELS.service2 },
        { perm: PERM.ui.servicesThree, path: paths.dashboard.services.three, label: SERVICE_LABELS.service3 },
        { perm: PERM.ui.servicesFour, path: paths.dashboard.services.four, label: SERVICE_LABELS.service4 },
        { perm: PERM.ui.servicesInbox, path: paths.dashboard.services.inbox, label: 'صندوق کار' },
        { perm: PERM.ui.servicesList, path: paths.dashboard.services.list, label: 'گزارش فرایندها' },
      ].filter((item) => userHasPermission(user, item.perm)),
    [user]
  );

  const goalActions = serviceLinks.map((link) => ({
    component: RouterLink,
    href: link.path,
    variant: 'outlined',
    children: link.label,
  }));

  const inboxActionHref = useMemo(
    () => resolveFirstInboxActionHref(data?.inbox),
    [data?.inbox]
  );

  if (!hasPermission) {
    return (
      <DashboardPageShell
        title="داشبورد کاربر شعبه"
        subtitle="دسترسی به این بخش محدود است"
        badge="کاربر عملیاتی"
        accent="info"
      >
        <Alert severity="warning">شما دسترسی مشاهده داشبورد کاربر شعبه را ندارید.</Alert>
      </DashboardPageShell>
    );
  }

  const personalQueue = data?.banner?.personalQueue ?? 0;
  const urgentCount = data?.banner?.urgentCount ?? 0;
  const lastActivity = data?.banner?.lastActivityLabel ?? '';

  const myKpis = data?.myKpis ?? data?.kpis ?? [];
  const branchPulse = data?.branchPulse ?? data?.pulseStats ?? [];
  const myServiceBreakdown = data?.myServiceBreakdown ?? data?.serviceBreakdown ?? [];
  const weeklyMine = data?.weeklyMine ?? data?.weeklyActivity ?? [];
  const myStatusMix = data?.myStatusMix ?? data?.statusMix ?? [];
  const weeklyGoal = data?.weeklyGoal ?? {
    title: 'پیشرفت هدف هفتگی',
    subheader: '',
    progress: 0,
    description: '',
  };
  const dailyGoalLabel = data?.banner?.dailyGoalLabel ?? weeklyGoal.subheader ?? '';

  return (
    <DashboardPageShell
      title={`داشبورد کاربر شعبه — ${fullName}`}
      subtitle={`${roleTitle} · ${branchContext.name} (${branchContext.code}) · فقط آمار و کارهای مرتبط با شما`}
      badge="کاربر عملیاتی"
      accent="info"
    >
      <DashboardFetchState error={error} onRetry={refresh}>
        {isLoading ? (
          <BranchUserDashboardSkeleton />
        ) : null}

        {!isLoading && data?.isEmpty ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            داده‌ای برای نمایش در داشبورد شخصی وجود ندارد.
          </Alert>
        ) : null}

        {!isLoading && data ? (
          <>
            <InfoBanner
              accent="info"
              title={fullName}
              subtitle={`${roleTitle} · صندوق شخصی: ${faCount(personalQueue)} مورد${
                lastActivity ? ` · آخرین فعالیت ${lastActivity}` : ''
              }`}
              avatarLetter={fullName.charAt(0)}
              chips={[
                {
                  icon: <Iconify icon="solar:buildings-2-bold-duotone" width={18} />,
                  label: branchContext.name,
                },
                {
                  label: `${faCount(urgentCount)} کار فوری`,
                  color: 'warning',
                  variant: 'soft',
                },
                ...(dailyGoalLabel
                  ? [{ label: dailyGoalLabel, color: 'success', variant: 'soft' }]
                  : []),
              ]}
            />

            {!data.isEmpty ? (
              <>
                <KpiGrid items={myKpis} />

                <PulseStatCards items={branchPulse} />

                <ServiceBreakdownCards
                  services={myServiceBreakdown}
                  sectionTitle="کارهای من به تفکیک خدمت"
                  emptyMessage="خدمتی یافت نشد"
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <HorizontalBarsCard
                      title="فعالیت من در ۷ روز اخیر"
                      subheader="تعداد رسیدگی روزانه"
                      items={weeklyMine}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <HorizontalBarsCard title="ترکیب وضعیت کارهای من" items={myStatusMix} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <WeeklyGoalCard
                      title={weeklyGoal.title}
                      subheader={weeklyGoal.subheader}
                      progress={weeklyGoal.progress}
                      description={weeklyGoal.description}
                      actions={goalActions}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <InboxQueueCard
                      title="صندوق ورودی من"
                      subheader="درخواست‌هایی که منتظر اقدام شما هستند"
                      items={data.inbox}
                      showAction={Boolean(inboxActionHref)}
                      actionLabel="شروع رسیدگی"
                      actionHref={inboxActionHref ?? undefined}
                      emptyMessage="درخواستی در صندوق شخصی شما نیست"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TimelineCard
                      title="خط زمان من"
                      entries={data.timeline}
                      emptyMessage="فعالیتی در خط زمان شما ثبت نشده است"
                    />
                  </Grid>
                </Grid>
              </>
            ) : null}
          </>
        ) : null}
      </DashboardFetchState>
    </DashboardPageShell>
  );
}
