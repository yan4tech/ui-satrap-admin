'use client';

import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Stack,
  Button,
  Avatar,
  Divider,
  ListItem,
  Typography,
  CardHeader,
  LinearProgress,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { Iconify } from 'src/components/iconify';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { KpiGrid } from '../../_components/kpi-grid';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
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
  { title: 'درخواست REQ-4821 ثبت شد', subtitle: '۸ دقیقه پیش' },
  { title: 'خدمت شماره یک توسط رضا کریمی تایید شد', subtitle: '۲۱ دقیقه پیش' },
  { title: 'کاربر جدید به شعبه اضافه شد', subtitle: '۴۵ دقیقه پیش' },
  { title: 'گزارش روزانه شعبه صادر شد', subtitle: '۱ ساعت پیش' },
];

const priorityColor = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

const priorityLabel = {
  high: 'فوری',
  medium: 'متوسط',
  low: 'عادی',
};

export default function BranchOverviewPage() {
  return (
    <DashboardPageShell
      title={`داشبورد شعبه — ${BRANCH_NAME}`}
      subtitle={`کد شعبه ${BRANCH_CODE} · مدیر شعبه: ${MANAGER_NAME} · وضعیت عملیاتی شعبه در یک نگاه`}
      actionLabel="گزارش روزانه شعبه"
    >
      <Card
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.lighter',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 2.5 }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              variant="rounded"
              sx={{ width: 56, height: 56, bgcolor: 'primary.main', color: 'primary.contrastText' }}
            >
              <Iconify icon="solar:buildings-bold-duotone" width={28} />
            </Avatar>
            <Box>
              <Typography variant="h6">{BRANCH_NAME}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                تهران · همه سرویس‌ها فعال · آخرین همگام‌سازی ۳ دقیقه پیش
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="وضعیت: فعال" color="success" />
            <Chip label={`صندوق ورودی: ${toFaDigits(14)}`} color="warning" variant="soft" />
            <Chip label={`تکمیل ماه: ${toFaDigits(187)}`} color="info" variant="soft" />
          </Stack>
        </Stack>
      </Card>

      <KpiGrid items={kpis} />

      <ServiceBreakdownCards services={serviceBreakdown} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="فعالیت ۷ روز اخیر"
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
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader
              title="صف بررسی مدیر شعبه"
              subheader="درخواست‌هایی که نیاز به اقدام فوری دارند"
            />
            <List sx={{ py: 0 }}>
              {pendingReviews.map((item, index) => (
                <Box key={item.id}>
                  <ListItem
                    sx={{ py: 1.5 }}
                    secondaryAction={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={item.wait} variant="outlined" />
                        <Chip
                          size="small"
                          label={priorityLabel[item.priority]}
                          color={priorityColor[item.priority]}
                        />
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={`${item.id} — ${item.service}`}
                      secondary={`متقاضی: ${item.applicant}`}
                      secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                    />
                  </ListItem>
                  {index < pendingReviews.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="تیم شعبه" />
            <List sx={{ py: 0 }}>
              {teamMembers.map((member, index) => (
                <Box key={member.name}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.200', color: 'text.secondary' }}>
                        {member.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={member.name} secondary={member.role} />
                    <Chip label={member.status} color={member.color} size="small" />
                  </ListItem>
                  {index < teamMembers.length - 1 && <Divider component="li" variant="inset" />}
                </Box>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardHeader title="هشدارها و اقدامات شعبه" />
            <Stack spacing={2} sx={{ px: 3, pb: 3 }}>
              {branchAlerts.map((task) => (
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
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardHeader title="وضعیت خدمات شعبه" />
            <List sx={{ py: 0 }}>
              {serviceStatus.map((service, index) => (
                <Box key={service.name}>
                  <ListItem secondaryAction={<Chip label={service.state} color={service.color} size="small" />}>
                    <ListItemText primary={service.name} />
                  </ListItem>
                  {index < serviceStatus.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
            <Divider />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ p: 2 }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.services.list}
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:list-bold-duotone" />}
              >
                لیست درخواست‌ها
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.user.search}
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:user-bold-duotone" />}
              >
                کاربران شعبه
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardHeader title="فعالیت‌های اخیر شعبه" />
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
