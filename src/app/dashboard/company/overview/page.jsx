'use client';

import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Stack,
  Divider,
  ListItem,
  Typography,
  CardHeader,
  LinearProgress,
  ListItemText,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { Iconify } from 'src/components/iconify';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { KpiGrid } from '../../_components/kpi-grid';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
import { BranchKpiTabs } from '../../_components/branch-kpi-tabs';
import { toFaDigits } from '../../_components/to-fa-digits';

const COMPANY_NAME = 'شرکت نمونه پارس';

const kpis = [
  {
    title: 'کاربران شرکت',
    value: '428',
    change: '+6%',
    trend: 'up',
    icon: 'solar:users-group-rounded-bold-duotone',
  },
  {
    title: 'شعب فعال',
    value: '12',
    change: '+1',
    trend: 'up',
    icon: 'solar:buildings-2-bold-duotone',
  },
  {
    title: 'درخواست‌های باز',
    value: '96',
    change: '-4%',
    trend: 'down',
    icon: 'solar:file-text-bold-duotone',
  },
  {
    title: 'نرخ تکمیل',
    value: '94%',
    change: '+0.8%',
    trend: 'up',
    icon: 'solar:shield-check-bold-duotone',
  },
];

const branchStatus = [
  { name: 'شعبه مرکزی تهران', city: 'تهران', state: 'فعال', color: 'success', users: 58, pending: 14 },
  { name: 'شعبه اصفهان', city: 'اصفهان', state: 'فعال', color: 'success', users: 41, pending: 9 },
  { name: 'شعبه شیراز', city: 'شیراز', state: 'نیازمند بررسی', color: 'warning', users: 36, pending: 22 },
  { name: 'شعبه مشهد', city: 'مشهد', state: 'فعال', color: 'success', users: 44, pending: 11 },
  { name: 'شعبه تبریز', city: 'تبریز', state: 'اختلال جزئی', color: 'error', users: 29, pending: 18 },
  { name: 'شعبه کرج', city: 'البرز', state: 'فعال', color: 'success', users: 33, pending: 7 },
];

const serviceBreakdown = [
  { name: 'خدمت شماره یک', waitingReview: 28, waitingRegistryReply: 11, completed: 412, rejected: 6 },
  { name: 'خدمت شماره دو', waitingReview: 19, waitingRegistryReply: 8, completed: 287, rejected: 9 },
  { name: 'خدمت شماره سه', waitingReview: 24, waitingRegistryReply: 14, completed: 356, rejected: 5 },
];

const monthlyRequests = [420, 480, 510, 560, 530, 610];

const statusDistribution = [
  { label: 'در انتظار بررسی شعبه', value: 71, color: 'warning.main' },
  { label: 'در انتظار پاسخ ثبت', value: 33, color: 'info.main' },
  { label: 'پایان یافته', value: 1055, color: 'success.main' },
  { label: 'ریجکت شده', value: 20, color: 'error.main' },
];

const branchVolume = [
  { label: 'شعبه مرکزی تهران', value: 610, color: 'primary.main' },
  { label: 'شعبه اصفهان', value: 420, color: 'info.main' },
  { label: 'شعبه شیراز', value: 380, color: 'success.main' },
  { label: 'شعبه مشهد', value: 455, color: 'warning.main' },
  { label: 'شعبه تبریز', value: 290, color: 'error.main' },
];

const branchKpiByBranch = [
  {
    branch: 'شعبه مرکزی تهران',
    services: [
      { name: 'خدمت شماره یک', success: 88, failed: 7, inReview: 12 },
      { name: 'خدمت شماره دو', success: 62, failed: 5, inReview: 8 },
      { name: 'خدمت شماره سه', success: 74, failed: 4, inReview: 9 },
    ],
  },
  {
    branch: 'شعبه اصفهان',
    services: [
      { name: 'خدمت شماره یک', success: 61, failed: 6, inReview: 7 },
      { name: 'خدمت شماره دو', success: 44, failed: 8, inReview: 6 },
      { name: 'خدمت شماره سه', success: 52, failed: 3, inReview: 5 },
    ],
  },
  {
    branch: 'شعبه شیراز',
    services: [
      { name: 'خدمت شماره یک', success: 48, failed: 11, inReview: 14 },
      { name: 'خدمت شماره دو', success: 39, failed: 9, inReview: 11 },
      { name: 'خدمت شماره سه', success: 41, failed: 7, inReview: 10 },
    ],
  },
];

const pendingTasks = [
  { label: 'تایید ۸ کاربر جدید در شعبه شیراز', progress: 65 },
  { label: 'بازبینی تنظیمات خدمت شماره دو برای ۳ شعبه', progress: 40 },
  { label: 'پیگیری درخواست‌های معوق بیش از ۷ روز', progress: 55 },
];

const latestActivities = [
  { title: 'شعبه کرج به سامانه متصل شد', subtitle: '۵ دقیقه پیش' },
  { title: 'مدیر شعبه اصفهان به‌روزرسانی شد', subtitle: '۲۳ دقیقه پیش' },
  { title: '۱۴ درخواست خدمت یک تایید شد', subtitle: '۴۷ دقیقه پیش' },
  { title: 'گزارش هفتگی شرکت تولید شد', subtitle: '۱ ساعت پیش' },
];

const userRolesSummary = [
  { role: 'مدیر شعبه', count: 12, color: 'primary' },
  { role: 'اپراتور', count: 286, color: 'info' },
  { role: 'کارشناس', count: 98, color: 'success' },
  { role: 'پشتیبان', count: 32, color: 'warning' },
];

export default function CompanyOverviewPage() {
  return (
    <DashboardPageShell
      title={`داشبورد شرکت — ${COMPANY_NAME}`}
      subtitle="نمای کلی کاربران، شعب، درخواست‌ها و عملکرد خدمات در سطح شرکت"
      actionLabel="گزارش عملکرد شرکت"
    >
      <KpiGrid items={kpis} />

      <ServiceBreakdownCards services={serviceBreakdown} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="روند ۶ ماهه درخواست‌های شرکت"
            items={monthlyRequests.map((value, index) => ({
              label: `ماه ${index + 1}`,
              value,
              color: 'primary.main',
            }))}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard title="توزیع وضعیت درخواست‌ها" items={statusDistribution} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="حجم درخواست به تفکیک شعبه"
            items={branchVolume}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader
              title="وضعیت شعب"
              subheader="وضعیت عملیاتی، کاربران فعال و صف در انتظار هر شعبه"
            />
            <List sx={{ py: 0 }}>
              {branchStatus.map((branch, index) => (
                <Box key={branch.name}>
                  <ListItem
                    sx={{ py: 1.5 }}
                    secondaryAction={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${toFaDigits(branch.users)} کاربر`}
                        />
                        <Chip
                          size="small"
                          color="warning"
                          variant="soft"
                          label={`${toFaDigits(branch.pending)} در صف`}
                        />
                        <Chip label={branch.state} color={branch.color} size="small" />
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={branch.name}
                      secondary={`${branch.city} — شناسه نمایشی ${toFaDigits(index + 1)}`}
                      secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                    />
                  </ListItem>
                  {index < branchStatus.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="کاربران به تفکیک نقش" />
            <Stack spacing={1.5} sx={{ px: 2.5, pb: 2.5 }}>
              {userRolesSummary.map((item) => (
                <Stack
                  key={item.role}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="body2">{item.role}</Typography>
                  <Chip label={toFaDigits(item.count)} color={item.color} sx={{ fontWeight: 700 }} />
                </Stack>
              ))}
            </Stack>
            <Divider />
            <Stack spacing={1} sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                دسترسی سریع
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  component={RouterLink}
                  href={paths.dashboard.branch.search}
                  clickable
                  icon={<Iconify icon="solar:buildings-2-bold-duotone" width={18} />}
                  label="مدیریت شعب"
                  variant="outlined"
                />
                <Chip
                  component={RouterLink}
                  href={paths.dashboard.user.search}
                  clickable
                  icon={<Iconify icon="solar:user-bold-duotone" width={18} />}
                  label="کاربران"
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <BranchKpiTabs data={branchKpiByBranch} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardHeader title="اقدامات فوری مدیر شرکت" />
            <Stack spacing={2} sx={{ px: 3, pb: 3 }}>
              {pendingTasks.map((task) => (
                <Box key={task.label}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">{task.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {toFaDigits(task.progress)}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={task.progress} sx={{ height: 8, borderRadius: 99 }} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <HorizontalBarsCard
            title="مقایسه خروجی خدمات (پایان‌یافته)"
            items={serviceBreakdown.map((s) => ({
              label: s.name,
              value: s.completed,
              color: 'success.main',
            }))}
          />
        </Grid>
      </Grid>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardHeader title="فعالیت‌های اخیر شرکت" />
        <List sx={{ py: 0 }}>
          {latestActivities.map((activity, index) => (
            <Box key={activity.title}>
              <ListItem>
                <ListItemText
                  primary={activity.title}
                  secondary={activity.subtitle}
                  secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                />
              </ListItem>
              {index < latestActivities.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </List>
      </Card>
    </DashboardPageShell>
  );
}
