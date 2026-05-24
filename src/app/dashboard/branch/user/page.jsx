'use client';

import { useMemo } from 'react';
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
import { useAuthContext } from 'src/auth/hooks';
import { PERM, userHasPermission } from 'src/lib/permissions';
import { Iconify } from 'src/components/iconify';
import { DashboardPageShell } from '../../_components/dashboard-page-shell';
import { KpiGrid } from '../../_components/kpi-grid';
import { HorizontalBarsCard } from '../../_components/horizontal-bars-card';
import { ServiceBreakdownCards } from '../../_components/service-breakdown-cards';
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
  { label: 'صف کل شعبه', value: BRANCH_CONTEXT.queueTotal, hint: 'برای اولویت‌بندی کار خودتان' },
  { label: 'همکاران آنلاین', value: BRANCH_CONTEXT.teamOnline, hint: 'امکان ارجاع سریع' },
  { label: 'میانگین شعبه (تکمیل روز)', value: 23, hint: 'شما امروز ۵ مورد انجام دادید' },
];

const myTimeline = [
  { title: 'REQ-4821 — تایید مرحله اول', subtitle: '۱۰ دقیقه پیش', icon: 'solar:check-read-bold-duotone' },
  { title: 'ارجاع REQ-4802 به شما', subtitle: '۳۵ دقیقه پیش', icon: 'solar:transfer-horizontal-bold-duotone' },
  { title: 'یادداشت روی REQ-4798', subtitle: '۱ ساعت پیش', icon: 'solar:notes-bold-duotone' },
  { title: 'تکمیل REQ-4791', subtitle: '۲ ساعت پیش', icon: 'solar:archive-check-bold-duotone' },
];

const priorityColor = { high: 'error', medium: 'warning', low: 'default' };
const priorityLabel = { high: 'فوری', medium: 'متوسط', low: 'عادی' };

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

  return (
    <DashboardPageShell
      title={`داشبورد کاربر شعبه — ${fullName}`}
      subtitle={`${roleTitle} · ${BRANCH_CONTEXT.name} (${BRANCH_CONTEXT.code}) · فقط آمار و کارهای مرتبط با شما`}
    >
      <Card
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{
            p: 2.5,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.info.lighter} 0%, ${theme.palette.background.paper} 55%)`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'info.main', color: 'info.contrastText' }}>
              {fullName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{fullName}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {roleTitle} · صندوق شخصی: {toFaDigits(7)} مورد · آخرین فعالیت ۱۰ دقیقه پیش
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip icon={<Iconify icon="solar:buildings-2-bold-duotone" width={18} />} label={BRANCH_CONTEXT.name} />
            <Chip color="warning" variant="soft" label={`${toFaDigits(2)} کار فوری`} />
            <Chip color="success" variant="soft" label="هدف روز: ۸ تکمیل" />
          </Stack>
        </Stack>
      </Card>

      <KpiGrid items={myKpis} />

      <Grid container spacing={2}>
        {branchPulse.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Stack spacing={0.5} sx={{ p: 2.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {toFaDigits(item.value)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.hint}
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ServiceBreakdownCards services={myServiceBreakdown} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HorizontalBarsCard
            title="فعالیت من در ۷ روز اخیر"
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
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="پیشرفت هدف هفتگی" subheader="۱۹ از ۲۵ تکمیل — ۷۶٪" />
            <Stack spacing={2} sx={{ px: 2.5, pb: 2.5 }}>
              <LinearProgress variant="determinate" value={76} sx={{ height: 10, borderRadius: 99 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                با ۶ تکمیل دیگر به هدف هفتگی می‌رسید. ۲ مورد فوری در صف مانده‌اند.
              </Typography>
              {serviceLinks.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {serviceLinks.map((link) => (
                    <Button
                      key={link.path}
                      component={RouterLink}
                      href={link.path}
                      size="small"
                      variant="outlined"
                    >
                      {link.label}
                    </Button>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="صندوق ورودی من" subheader="درخواست‌هایی که منتظر اقدام شما هستند" />
            <List sx={{ py: 0 }}>
              {myInbox.map((item, index) => (
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
                      secondary={`متقاضی: ${item.applicant} · مرحله: ${item.step}`}
                      secondaryTypographyProps={{ sx: { mt: 0.5 } }}
                    />
                  </ListItem>
                  {index < myInbox.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardHeader title="خط زمان من" />
            <List sx={{ py: 0 }}>
              {myTimeline.map((entry, index) => (
                <Box key={entry.title}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.100', color: 'info.main' }}>
                        <Iconify icon={entry.icon} width={22} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={entry.title} secondary={entry.subtitle} />
                  </ListItem>
                  {index < myTimeline.length - 1 && <Divider component="li" variant="inset" />}
                </Box>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
    </DashboardPageShell>
  );
}
