'use client';

import { useMemo } from 'react';
import { Grid } from '@mui/material';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useAuthContext } from 'src/auth/hooks';
import { PERM, userHasPermission } from 'src/lib/permissions';
import { Iconify } from 'src/components/iconify';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { KpiGrid } from '../../_components/kpi-grid';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
import { InfoBanner } from '../../_components/info-banner';
import { PulseStatCards } from '../../_components/pulse-stat-cards';
import { InboxQueueCard } from '../../_components/inbox-queue-card';
import { TimelineCard } from '../../_components/timeline-card';
import { WeeklyGoalCard } from '../../_components/weekly-goal-card';
import { toFaDigits } from '../../_components/to-fa-digits';

const BRANCH_CONTEXT = {
  name: 'شعبه مرکزی ولیعصر',
  code: 'TH-001',
  queueTotal: 14,
  teamOnline: 4,
};

const myKpis = [
  {
    title: 'درخواست‌های من (باز)',
    value: '7',
    change: '۲ فوری',
    trend: 'up',
    icon: 'solar:inbox-in-bold-duotone',
    avatarBg: 'warning.lighter',
    avatarColor: 'warning.main',
  },
  {
    title: 'تکمیل‌شده این هفته',
    value: '19',
    change: '+۴ نسبت به هفته قبل',
    trend: 'up',
    icon: 'solar:check-circle-bold-duotone',
    avatarBg: 'success.lighter',
    avatarColor: 'success.main',
  },
  {
    title: 'میانگین زمان رسیدگی',
    value: '۳.۲ ساعت',
    change: '-۱۸ دقیقه',
    trend: 'down',
    icon: 'solar:clock-circle-bold-duotone',
  },
  {
    title: 'نرخ پذیرش من',
    value: '۹۴٪',
    change: '+۲٪',
    trend: 'up',
    icon: 'solar:medal-ribbons-star-bold-duotone',
    avatarBg: 'info.lighter',
    avatarColor: 'info.main',
  },
];

const myServiceBreakdown = [
  { name: 'خدمت شماره یک', waitingReview: 3, waitingRegistryReply: 1, completed: 42, rejected: 1 },
  { name: 'خدمت شماره دو', waitingReview: 2, waitingRegistryReply: 0, completed: 28, rejected: 2 },
  { name: 'خدمت شماره سه', waitingReview: 2, waitingRegistryReply: 2, completed: 15, rejected: 0 },
];

const weeklyMine = [3, 5, 4, 6, 5, 7, 4];

const myStatusMix = [
  { label: 'منتظر اقدام من', value: 7, color: 'warning.main' },
  { label: 'منتظر پاسخ ثبت', value: 3, color: 'info.main' },
  { label: 'تکمیل‌شده', value: 85, color: 'success.main' },
  { label: 'رد شده', value: 3, color: 'error.main' },
];

const myInbox = [
  {
    id: 'REQ-4821',
    service: 'خدمت شماره یک',
    applicant: 'محمد رضایی',
    wait: '۲ ساعت',
    step: 'بررسی اولیه',
    priority: 'high',
  },
  {
    id: 'REQ-4819',
    service: 'خدمت شماره دو',
    applicant: 'زهرا موسوی',
    wait: '۵ ساعت',
    step: 'تکمیل مدارک',
    priority: 'medium',
  },
  {
    id: 'REQ-4815',
    service: 'خدمت شماره سه',
    applicant: 'امیر حسینی',
    wait: '۱ روز',
    step: 'ارسال به ثبت',
    priority: 'high',
  },
];

const branchPulse = [
  {
    label: 'صف کل شعبه',
    value: BRANCH_CONTEXT.queueTotal,
    hint: 'برای اولویت‌بندی کار خودتان',
    icon: 'solar:inbox-bold-duotone',
  },
  {
    label: 'همکاران آنلاین',
    value: BRANCH_CONTEXT.teamOnline,
    hint: 'امکان ارجاع سریع',
    icon: 'solar:users-group-two-rounded-bold-duotone',
  },
  {
    label: 'میانگین شعبه (تکمیل روز)',
    value: 23,
    hint: 'شما امروز ۵ مورد انجام دادید',
    icon: 'solar:chart-2-bold-duotone',
  },
];

const myTimeline = [
  { title: 'REQ-4821 — تایید مرحله اول', subtitle: '۱۰ دقیقه پیش', icon: 'solar:check-read-bold-duotone' },
  { title: 'ارجاع REQ-4802 به شما', subtitle: '۳۵ دقیقه پیش', icon: 'solar:transfer-horizontal-bold-duotone' },
  { title: 'یادداشت روی REQ-4798', subtitle: '۱ ساعت پیش', icon: 'solar:notes-bold-duotone' },
  { title: 'تکمیل REQ-4791', subtitle: '۲ ساعت پیش', icon: 'solar:archive-check-bold-duotone' },
];

function displayName(user) {
  const name = [user?.name, user?.family].filter(Boolean).join(' ').trim();
  return name || user?.mobile || 'کاربر شعبه';
}

function displayRole(user) {
  return user?.role?.title || user?.role_title || user?.role?.slug || 'کاربر عملیاتی';
}

export default function BranchUserDashboardPage() {
  const { user } = useAuthContext();

  const fullName = useMemo(() => displayName(user), [user]);
  const roleTitle = useMemo(() => displayRole(user), [user]);

  const serviceLinks = useMemo(
    () =>
      [
        { perm: PERM.ui.servicesOne, path: paths.dashboard.services.one, label: 'خدمت یک' },
        { perm: PERM.ui.servicesTwo, path: paths.dashboard.services.two, label: 'خدمت دو' },
        { perm: PERM.ui.servicesThree, path: paths.dashboard.services.three, label: 'خدمت سه' },
        { perm: PERM.ui.servicesList, path: paths.dashboard.services.list, label: 'لیست درخواست‌ها' },
      ].filter((item) => userHasPermission(user, item.perm)),
    [user]
  );

  const goalActions = serviceLinks.map((link) => ({
    component: RouterLink,
    href: link.path,
    variant: 'outlined',
    children: link.label,
  }));

  return (
    <DashboardPageShell
      title={`داشبورد کاربر شعبه — ${fullName}`}
      subtitle={`${roleTitle} · ${BRANCH_CONTEXT.name} (${BRANCH_CONTEXT.code}) · فقط آمار و کارهای مرتبط با شما`}
      badge="کاربر عملیاتی"
      accent="info"
    >
      <InfoBanner
        accent="info"
        title={fullName}
        subtitle={`${roleTitle} · صندوق شخصی: ${toFaDigits(7)} مورد · آخرین فعالیت ۱۰ دقیقه پیش`}
        avatarLetter={fullName.charAt(0)}
        chips={[
          {
            icon: <Iconify icon="solar:buildings-2-bold-duotone" width={18} />,
            label: BRANCH_CONTEXT.name,
          },
          { label: `${toFaDigits(2)} کار فوری`, color: 'warning', variant: 'soft' },
          { label: 'هدف روز: ۸ تکمیل', color: 'success', variant: 'soft' },
        ]}
      />

      <KpiGrid items={myKpis} />

      <PulseStatCards items={branchPulse} />

      <ServiceBreakdownCards services={myServiceBreakdown} sectionTitle="کارهای من به تفکیک خدمت" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="فعالیت من در ۷ روز اخیر"
            subheader="تعداد رسیدگی روزانه"
            items={weeklyMine.map((value, index) => ({
              label: `روز ${index + 1}`,
              value,
              color: 'info.main',
            }))}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard title="ترکیب وضعیت کارهای من" items={myStatusMix} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <WeeklyGoalCard
            title="پیشرفت هدف هفتگی"
            subheader="۱۹ از ۲۵ تکمیل"
            progress={76}
            description="با ۶ تکمیل دیگر به هدف هفتگی می‌رسید. ۲ مورد فوری در صف مانده‌اند."
            actions={goalActions}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <InboxQueueCard
            title="صندوق ورودی من"
            subheader="درخواست‌هایی که منتظر اقدام شما هستند"
            items={myInbox}
            showAction
            actionLabel="شروع رسیدگی"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <TimelineCard title="خط زمان من" entries={myTimeline} />
        </Grid>
      </Grid>
    </DashboardPageShell>
  );
}
