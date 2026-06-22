'use client';

import { Grid } from '@mui/material';

import { ActivityFeedCard } from './_components/activity-feed-card';
import { DashboardPageShell } from './_components/dashboard-page-shell';
import { HorizontalBarsCard } from './_components/horizontal-bars-card';
import { InfoBanner } from './_components/info-banner';
import { KpiGrid } from './_components/kpi-grid';
import { ProcessKpiTabs } from './_components/process-kpi-tabs';
import { ProgressAlertsCard } from './_components/progress-alerts-card';
import { ServiceBreakdownCards } from './_components/service-breakdown-cards';
import { StatusListCard } from './_components/status-list-card';
import { toFaDigits } from './_components/to-fa-digits';
import { dashboardServiceRow, SERVICE_LABELS } from 'src/lib/service-labels';

const kpis = [
  {
    title: 'کل درخواست‌ها',
    value: '12,480',
    change: '+12%',
    trend: 'up',
    icon: 'solar:file-text-bold-duotone',
  },
  {
    title: 'کاربران فعال',
    value: '1,245',
    change: '+8%',
    trend: 'up',
    icon: 'solar:users-group-rounded-bold-duotone',
  },
  {
    title: 'در انتظار بررسی',
    value: '184',
    change: '-3%',
    trend: 'down',
    icon: 'solar:hourglass-line-duotone',
  },
  {
    title: 'نرخ موفقیت',
    value: '96%',
    change: '+1.4%',
    trend: 'up',
    icon: 'solar:shield-check-bold-duotone',
    avatarBg: 'success.lighter',
    avatarColor: 'success.main',
  },
];

const serviceStatus = [
  { name: 'مدیریت کاربران', state: 'فعال', color: 'success' },
  { name: 'مدیریت شعبات', state: 'نیازمند بررسی', color: 'warning' },
  { name: SERVICE_LABELS.service1, state: 'فعال', color: 'success' },
  { name: SERVICE_LABELS.service2, state: 'اختلال جزئی', color: 'error' },
  { name: SERVICE_LABELS.service3, state: 'فعال', color: 'success' },
];

const latestActivities = [
  { title: 'کاربر جدید ثبت شد', subtitle: '۲ دقیقه پیش', icon: 'solar:user-plus-bold-duotone' },
  { title: `${SERVICE_LABELS.service2} بروزرسانی شد`, subtitle: '۱۱ دقیقه پیش', icon: 'solar:refresh-circle-bold-duotone' },
  { title: 'نقش جدید برای اپراتور تعریف شد', subtitle: '۳۵ دقیقه پیش', icon: 'solar:shield-keyhole-bold-duotone' },
  { title: 'گزارش روزانه تولید گردید', subtitle: '۵۹ دقیقه پیش', icon: 'solar:document-text-bold-duotone' },
];

const pendingTasks = [
  { label: 'بررسی ۱۴ درخواست تایید نشده', progress: 70 },
  { label: 'تکمیل تنظیمات دسترسی مدیر شعبه', progress: 45 },
  { label: `بازبینی خطاهای ثبت‌شده ${SERVICE_LABELS.service2}`, progress: 30 },
];

const serviceBreakdown = [
  dashboardServiceRow('service1', { waitingReview: 42, waitingRegistryReply: 18, completed: 133, rejected: 9 }),
  dashboardServiceRow('service2', { waitingReview: 27, waitingRegistryReply: 12, completed: 98, rejected: 14 }),
  dashboardServiceRow('service3', { waitingReview: 31, waitingRegistryReply: 16, completed: 121, rejected: 7 }),
];

const monthlyRequests = [180, 220, 210, 260, 240, 290];

const statusDistribution = [
  { label: 'در انتظار بررسی', value: 100, color: 'warning.main' },
  { label: 'در انتظار پاسخ ثبت', value: 46, color: 'info.main' },
  { label: 'پایان یافته', value: 352, color: 'success.main' },
  { label: 'ریجکت شده', value: 30, color: 'error.main' },
];

const processKpiByProvince = [
  {
    province: 'تهران',
    services: [
      dashboardServiceRow('service1', { success: 54, failed: 9, inReview: 12 }),
      dashboardServiceRow('service2', { success: 47, failed: 11, inReview: 14 }),
      dashboardServiceRow('service3', { success: 39, failed: 8, inReview: 10 }),
    ],
  },
  {
    province: 'اصفهان',
    services: [
      dashboardServiceRow('service1', { success: 41, failed: 7, inReview: 9 }),
      dashboardServiceRow('service2', { success: 36, failed: 10, inReview: 11 }),
      dashboardServiceRow('service3', { success: 31, failed: 6, inReview: 8 }),
    ],
  },
  {
    province: 'فارس',
    services: [
      dashboardServiceRow('service1', { success: 33, failed: 6, inReview: 7 }),
      dashboardServiceRow('service2', { success: 29, failed: 8, inReview: 9 }),
      dashboardServiceRow('service3', { success: 24, failed: 5, inReview: 6 }),
    ],
  },
];

export function CentralDashboardView() {
  return (
    <DashboardPageShell
      title="داشبورد شعبه مرکزی"
      subtitle="نمای کلی عملکرد شعبه مرکزی، شعب زیرمجموعه و خدمات فعال در سطح سازمان"
      actionLabel="دریافت گزارش امروز"
      badge="سطح سازمان"
      accent="primary"
    >
      <InfoBanner
        title="شعبه مرکزی — نمای مدیریتی"
        subtitle="۱۲ شعبه فعال · ۳ خدمت در جریان · آخرین همگام‌سازی ۳ دقیقه پیش"
        icon="solar:buildings-3-bold-duotone"
        chips={[
          { label: 'وضعیت کلی: پایدار', color: 'success', variant: 'soft' },
          { label: `در صف: ${toFaDigits(184)}`, color: 'warning', variant: 'soft' },
          { label: `موفقیت: ${toFaDigits('96%')}`, color: 'info', variant: 'soft' },
        ]}
      />

      <KpiGrid items={kpis} />

      <ServiceBreakdownCards services={serviceBreakdown} sectionTitle="خلاصه وضعیت خدمات سازمان" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="روند ۶ ماهه درخواست‌ها"
            subheader="حجم ماهانه درخواست‌های ثبت‌شده"
            items={monthlyRequests.map((value, index) => ({
              label: `ماه ${index + 1}`,
              value,
              color: 'primary.main',
            }))}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="سهم وضعیت خدمات"
            subheader="توزیع درصدی وضعیت‌ها"
            items={statusDistribution}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="مقایسه خروجی خدمات"
            subheader="تعداد تکمیل‌شده به تفکیک خدمت"
            items={serviceBreakdown.map((service) => ({
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
            tasks={pendingTasks}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <StatusListCard title="وضعیت سرویس‌ها" items={serviceStatus} />
        </Grid>
      </Grid>

      <ProcessKpiTabs data={processKpiByProvince} />

      <ActivityFeedCard title="فعالیت‌های اخیر" activities={latestActivities} />
    </DashboardPageShell>
  );
}
