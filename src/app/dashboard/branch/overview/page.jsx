'use client';

import { Grid } from '@mui/material';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { Iconify } from 'src/components/iconify';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { KpiGrid } from '../../_components/kpi-grid';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
import { InfoBanner } from '../../_components/info-banner';
import { InboxQueueCard } from '../../_components/inbox-queue-card';
import { TeamListCard } from '../../_components/team-list-card';
import { ProgressAlertsCard } from '../../_components/progress-alerts-card';
import { StatusListCard } from '../../_components/status-list-card';
import { ActivityFeedCard } from '../../_components/activity-feed-card';
import { toFaDigits } from '../../_components/to-fa-digits';

const BRANCH_NAME = 'شعبه مرکزی ولیعصر';
const BRANCH_CODE = 'TH-001';
const MANAGER_NAME = 'علی محمدی';

const kpis = [
  {
    title: 'کاربران شعبه',
    value: '58',
    change: '+2',
    trend: 'up',
    icon: 'solar:users-group-rounded-bold-duotone',
  },
  {
    title: 'درخواست امروز',
    value: '23',
    change: '+18%',
    trend: 'up',
    icon: 'solar:calendar-bold-duotone',
  },
  {
    title: 'در انتظار بررسی',
    value: '14',
    change: '-2',
    trend: 'down',
    icon: 'solar:hourglass-line-duotone',
    avatarBg: 'warning.lighter',
    avatarColor: 'warning.main',
  },
  {
    title: 'تکمیل این ماه',
    value: '187',
    change: '+11%',
    trend: 'up',
    icon: 'solar:check-circle-bold-duotone',
    avatarBg: 'success.lighter',
    avatarColor: 'success.main',
  },
];

const serviceBreakdown = [
  { name: 'خدمت شماره یک', waitingReview: 6, waitingRegistryReply: 3, completed: 98, rejected: 2 },
  { name: 'خدمت شماره دو', waitingReview: 4, waitingRegistryReply: 2, completed: 54, rejected: 3 },
  { name: 'خدمت شماره سه', waitingReview: 4, waitingRegistryReply: 5, completed: 35, rejected: 1 },
];

const weeklyActivity = [12, 18, 15, 22, 19, 23, 14];

const statusDistribution = [
  { label: 'در انتظار بررسی شعبه', value: 14, color: 'warning.main' },
  { label: 'در انتظار پاسخ ثبت', value: 10, color: 'info.main' },
  { label: 'پایان یافته', value: 187, color: 'success.main' },
  { label: 'ریجکت شده', value: 6, color: 'error.main' },
];

const operatorPerformance = [
  { label: 'رضا کریمی', value: 42, color: 'primary.main' },
  { label: 'مینا احمدی', value: 38, color: 'info.main' },
  { label: 'حسین نوری', value: 31, color: 'success.main' },
  { label: 'سارا رضایی', value: 28, color: 'warning.main' },
];

const teamMembers = [
  { name: 'رضا کریمی', role: 'اپراتور', status: 'آنلاین', color: 'success' },
  { name: 'مینا احمدی', role: 'کارشناس', status: 'آنلاین', color: 'success' },
  { name: 'حسین نوری', role: 'اپراتور', status: 'مشغول', color: 'warning' },
  { name: 'سارا رضایی', role: 'پشتیبان', status: 'آفلاین', color: 'default' },
  { name: 'نیما صادقی', role: 'اپراتور', status: 'آنلاین', color: 'success' },
];

const pendingReviews = [
  { id: 'REQ-4821', service: 'خدمت شماره یک', applicant: 'محمد رضایی', wait: '۲ ساعت', priority: 'high' },
  { id: 'REQ-4819', service: 'خدمت شماره دو', applicant: 'زهرا موسوی', wait: '۵ ساعت', priority: 'medium' },
  { id: 'REQ-4815', service: 'خدمت شماره سه', applicant: 'امیر حسینی', wait: '۱ روز', priority: 'high' },
  { id: 'REQ-4808', service: 'خدمت شماره یک', applicant: 'فاطمه جعفری', wait: '۱ روز', priority: 'low' },
];

const serviceStatus = [
  { name: 'خدمت شماره یک', state: 'فعال', color: 'success' },
  { name: 'خدمت شماره دو', state: 'فعال', color: 'success' },
  { name: 'خدمت شماره سه', state: 'نیازمند بررسی', color: 'warning' },
];

const branchAlerts = [
  { label: '۳ درخواست بیش از ۴۸ ساعت در صف مانده', progress: 80 },
  { label: 'تکمیل پروفایل ۲ اپراتور جدید', progress: 35 },
  { label: 'بازبینی تنظیمات خدمت شماره سه', progress: 50 },
];

const latestActivities = [
  { title: 'درخواست REQ-4821 ثبت شد', subtitle: '۸ دقیقه پیش', icon: 'solar:document-add-bold-duotone' },
  { title: 'خدمت شماره یک توسط رضا کریمی تایید شد', subtitle: '۲۱ دقیقه پیش', icon: 'solar:check-read-bold-duotone' },
  { title: 'کاربر جدید به شعبه اضافه شد', subtitle: '۴۵ دقیقه پیش', icon: 'solar:user-plus-bold-duotone' },
  { title: 'گزارش روزانه شعبه صادر شد', subtitle: '۱ ساعت پیش', icon: 'solar:chart-2-bold-duotone' },
];

export default function BranchOverviewPage() {
  return (
    <DashboardPageShell
      title={`داشبورد شعبه — ${BRANCH_NAME}`}
      subtitle={`کد شعبه ${BRANCH_CODE} · مدیر شعبه: ${MANAGER_NAME} · وضعیت عملیاتی شعبه در یک نگاه`}
      actionLabel="گزارش روزانه شعبه"
      badge="مدیر شعبه"
      accent="primary"
    >
      <InfoBanner
        title={BRANCH_NAME}
        subtitle="تهران · همه سرویس‌ها فعال · آخرین همگام‌سازی ۳ دقیقه پیش"
        icon="solar:buildings-bold-duotone"
        chips={[
          { label: 'وضعیت: فعال', color: 'success', variant: 'soft' },
          { label: `صندوق ورودی: ${toFaDigits(14)}`, color: 'warning', variant: 'soft' },
          { label: `تکمیل ماه: ${toFaDigits(187)}`, color: 'info', variant: 'soft' },
        ]}
      />

      <KpiGrid items={kpis} />

      <ServiceBreakdownCards services={serviceBreakdown} sectionTitle="وضعیت خدمات این شعبه" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="فعالیت ۷ روز اخیر"
            subheader="تعداد درخواست‌های روزانه"
            items={weeklyActivity.map((value, index) => ({
              label: `روز ${index + 1}`,
              value,
              color: 'primary.main',
            }))}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard title="توزیع وضعیت درخواست‌های شعبه" items={statusDistribution} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard title="عملکرد اپراتورها (تکمیل‌شده)" items={operatorPerformance} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <InboxQueueCard
            title="صف بررسی مدیر شعبه"
            subheader="درخواست‌هایی که نیاز به اقدام فوری دارند"
            items={pendingReviews}
            showAction
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <TeamListCard title="تیم شعبه" members={teamMembers} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ProgressAlertsCard title="هشدارها و اقدامات شعبه" tasks={branchAlerts} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <StatusListCard
            title="وضعیت خدمات شعبه"
            items={serviceStatus}
            footerActions={[
              {
                component: RouterLink,
                href: paths.dashboard.services.list,
                variant: 'contained',
                startIcon: <Iconify icon="solar:list-bold-duotone" />,
                children: 'لیست درخواست‌ها',
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

      <ActivityFeedCard title="فعالیت‌های اخیر شعبه" activities={latestActivities} />
    </DashboardPageShell>
  );
}
