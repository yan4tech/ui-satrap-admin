import { CONFIG } from 'src/global-config';
import {
  Box,
  Card,
  Chip,
  Grid,
  List,
  Stack,
  Avatar,
  Button,
  Divider,
  ListItem,
  Typography,
  CardHeader,
  LinearProgress,
  ListItemText,
} from '@mui/material';
import {
  Iconify
} from 'src/components/iconify';

// ----------------------------------------------------------------------

export const metadata = { title: `Dashboard - ${CONFIG.appName}` };

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
  },
];

const serviceStatus = [
  { name: 'مدیریت کاربران', state: 'فعال', color: 'success' },
  { name: 'مدیریت شعبات', state: 'نیازمند بررسی', color: 'warning' },
  { name: 'خدمات شماره یک', state: 'فعال', color: 'success' },
  { name: 'خدمات شماره دو', state: 'اختلال جزئی', color: 'error' },
  { name: 'خدمات شماره سه', state: 'فعال', color: 'success' },
];

const latestActivities = [
  { title: 'کاربر جدید ثبت شد', subtitle: '۲ دقیقه پیش' },
  { title: 'خدمت شماره دو بروزرسانی شد', subtitle: '۱۱ دقیقه پیش' },
  { title: 'نقش جدید برای اپراتور تعریف شد', subtitle: '۳۵ دقیقه پیش' },
  { title: 'گزارش روزانه تولید گردید', subtitle: '۵۹ دقیقه پیش' },
];

const pendingTasks = [
  { label: 'بررسی ۱۴ درخواست تایید نشده', progress: 70 },
  { label: 'تکمیل تنظیمات دسترسی مدیر شعبه', progress: 45 },
  { label: 'بازبینی خطاهای ثبت‌شده سرویس دو', progress: 30 },
];

const serviceBreakdown = [
  {
    name: 'خدمت شماره یک',
    waitingReview: 42,
    waitingRegistryReply: 18,
    completed: 133,
    rejected: 9,
  },
  {
    name: 'خدمت شماره دو',
    waitingReview: 27,
    waitingRegistryReply: 12,
    completed: 98,
    rejected: 14,
  },
  {
    name: 'خدمت شماره سه',
    waitingReview: 31,
    waitingRegistryReply: 16,
    completed: 121,
    rejected: 7,
  },
];

const toFaDigits = (value) =>
  String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const monthlyRequests = [180, 220, 210, 260, 240, 290];

const statusDistribution = [
  { label: 'در انتظار بررسی', value: 100, color: 'warning.main' },
  { label: 'در انتظار پاسخ ثبت', value: 46, color: 'info.main' },
  { label: 'پایان یافته', value: 352, color: 'success.main' },
  { label: 'ریجکت شده', value: 30, color: 'error.main' },
];

export default function Page() {
  const maxMonthly = Math.max(...monthlyRequests);
  const maxServiceCompleted = Math.max(...serviceBreakdown.map((item) => item.completed));
  const totalStatus = statusDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box
      sx={{
        bgcolor: 'common.white',
        minHeight: '100%',
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4">داشبورد مدیریتی</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              نمای کلی وضعیت سامانه، عملکرد سرویس‌ها و فعالیت‌های اخیر
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-minimalistic-bold-duotone" />}
          >
            دریافت گزارش امروز
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {kpis.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} sx={{ p: 2.5 }} alignItems="center">
                  <Avatar
                    variant="rounded"
                    sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 52, height: 52 }}
                  >
                    <Iconify icon={item.icon} width={26} />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: '0.02em',
                        color: 'text.primary',
                      }}
                    >
                      {toFaDigits(item.value)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: item.trend === 'up' ? 'success.main' : 'error.main',
                      }}
                    >
                      {toFaDigits(item.change)}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          {serviceBreakdown.map((service) => (
            <Grid key={service.name} size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Stack spacing={1.5} sx={{ p: 2.5 }}>
                  <Typography variant="h6">{service.name}</Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      در انتظار بررسی
                    </Typography>
                    <Chip
                      label={toFaDigits(service.waitingReview)}
                      color="warning"
                      sx={{ fontWeight: 800, minWidth: 56 }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      در انتظار پاسخ سازمان ثبت
                    </Typography>
                    <Chip
                      label={toFaDigits(service.waitingRegistryReply)}
                      color="info"
                      sx={{ fontWeight: 800, minWidth: 56 }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      پایان یافته
                    </Typography>
                    <Chip
                      label={toFaDigits(service.completed)}
                      color="success"
                      sx={{ fontWeight: 800, minWidth: 56 }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      ریجکت شده
                    </Typography>
                    <Chip
                      label={toFaDigits(service.rejected)}
                      color="error"
                      sx={{ fontWeight: 800, minWidth: 56 }}
                    />
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardHeader title="روند ۶ ماهه درخواست‌ها" />
              <Stack spacing={1.25} sx={{ px: 2.5, pb: 2.5 }}>
                {monthlyRequests.map((value, index) => (
                  <Box key={`month-${index}`}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ماه {toFaDigits(index + 1)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {toFaDigits(value)}
                      </Typography>
                    </Stack>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 99, height: 8 }}>
                      <Box
                        sx={{
                          height: 1,
                          borderRadius: 99,
                          bgcolor: 'primary.main',
                          width: `${(value / maxMonthly) * 100}%`,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardHeader title="سهم وضعیت خدمات" />
              <Stack spacing={1.25} sx={{ px: 2.5, pb: 2.5 }}>
                {statusDistribution.map((item) => (
                  <Box key={item.label}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {toFaDigits(item.value)}
                      </Typography>
                    </Stack>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 99, height: 8 }}>
                      <Box
                        sx={{
                          height: 1,
                          borderRadius: 99,
                          bgcolor: item.color,
                          width: `${(item.value / totalStatus) * 100}%`,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardHeader title="مقایسه خروجی خدمات" />
              <Stack spacing={1.25} sx={{ px: 2.5, pb: 2.5 }}>
                {serviceBreakdown.map((service) => (
                  <Box key={`completed-${service.name}`}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {service.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {toFaDigits(service.completed)}
                      </Typography>
                    </Stack>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 99, height: 8 }}>
                      <Box
                        sx={{
                          height: 1,
                          borderRadius: 99,
                          bgcolor: 'success.main',
                          width: `${(service.completed / maxServiceCompleted) * 100}%`,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
              <CardHeader title="تسک‌های فوری مدیریتی" />
              <Stack spacing={2} sx={{ px: 3, pb: 3 }}>
                {pendingTasks.map((task) => (
                  <Box key={task.label}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2">{task.label}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {toFaDigits(task.progress)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={task.progress}
                      sx={{ height: 8, borderRadius: 99 }}
                    />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
              <CardHeader title="وضعیت سرویس‌ها" />
              <List sx={{ py: 0 }}>
                {serviceStatus.map((service, index) => (
                  <Box key={service.name}>
                    <ListItem
                      secondaryAction={<Chip label={service.state} color={service.color} size="small" />}
                    >
                      <ListItemText primary={service.name} />
                    </ListItem>
                    {index < serviceStatus.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardHeader title="فعالیت‌های اخیر" />
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
      </Stack>
    </Box>
  );
}
