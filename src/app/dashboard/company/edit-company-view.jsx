'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  Alert,
  Chip,
  Stack,
  Button,
  Paper,
  Container,
  Typography,
  CardContent,
} from '@mui/material';

import { updateCompany, updateMyCompany } from 'src/lib/company-api';
import { paths } from 'src/routes/paths';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import { ActiveStatusField } from 'src/components/status/active-status-field';

import { Form, Field } from 'src/components/hook-form';

import CompanyFormSections from './company-form-sections';
import CompanyPageHeader, { companySectionPaperSx } from './company-page-header';
import {
  idsFromSelection,
  branchAssignmentsFromSelection,
  branchesFromCompany,
  servicesFromCompany,
} from './company-form-utils';

const CompanySchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان الزامی است'),
  description: zod.string().optional(),
  max_branches: zod.coerce.number().int().min(0),
  is_active: zod.boolean(),
});

export default function EditCompanyView({ companyData, readOnly = false, companyAdminMode = false }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedServices, setSelectedServices] = useState(() => servicesFromCompany(companyData));
  const [selectedBranches, setSelectedBranches] = useState(() => branchesFromCompany(companyData));
  const [branchesReloadKey, setBranchesReloadKey] = useState(0);

  const companyId = companyData?.ID ?? companyData?.id;

  const methods = useForm({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      title: companyData?.title || '',
      description: companyData?.description || '',
      max_branches: companyData?.max_branches ?? 0,
      is_active: Boolean(companyData?.is_active),
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;
  const isActive = watch('is_active');

  const branchCount = Array.isArray(companyData?.branches) ? companyData.branches.length : null;
  const companyFieldsReadOnly = readOnly || companyAdminMode;
  const showStatusField = !companyAdminMode;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const branchPayload = {
        branch_assignments: branchAssignmentsFromSelection(selectedBranches),
      };
      const updated = companyAdminMode
        ? await updateMyCompany(branchPayload)
        : await updateCompany(companyId, {
            title: data.title,
            description: data.description || '',
            max_branches: Number(data.max_branches) || 0,
            is_active: data.is_active,
            service_ids: idsFromSelection(selectedServices),
            ...branchPayload,
          });
      setErrorMessage(null);
      setSuccessMessage('ذخیره شد.');
      if (updated) {
        setSelectedServices(servicesFromCompany(updated));
        setSelectedBranches(branchesFromCompany(updated));
      }
      setBranchesReloadKey((k) => k + 1);
    } catch (err) {
      setSuccessMessage(null);
      setErrorMessage(extractMembershipErrorMessage(err));
    }
  });

  const headerTitle = companyAdminMode ? 'مدیریت شرکت' : 'ویرایش شرکت';
  const headerSubtitle = companyAdminMode
    ? 'شعب و سیاست بازبینی زیرمجموعه شرکت خود را مدیریت کنید.'
    : 'اطلاعات شرکت، وضعیت، خدمات و شعب زیرمجموعه را به‌روزرسانی کنید.';

  return (
    <Container maxWidth={false} disableGutters>
      <Card
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.customShadows?.z8 || theme.shadows[8],
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <CompanyPageHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            badge={readOnly ? 'مشاهده' : companyAdminMode ? 'مدیر شرکت' : 'فرم ویرایش'}
            icon={companyAdminMode ? 'solar:case-round-bold' : 'solar:pen-new-square-bold'}
          />

          {(branchCount != null || companyData?.title) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {companyData?.title && (
                <Chip size="small" variant="outlined" label={`شرکت: ${companyData.title}`} />
              )}
              {branchCount != null && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={
                    Number(companyData?.max_branches) > 0
                      ? `شعب: ${branchCount} / ${companyData.max_branches}`
                      : `شعب: ${branchCount}`
                  }
                />
              )}
              {showStatusField && (
                <Chip
                  size="small"
                  color={isActive ? 'success' : 'default'}
                  label={isActive ? 'وضعیت: فعال' : 'وضعیت: غیرفعال'}
                />
              )}
            </Stack>
          )}

          {!!errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          {!!successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              {!companyAdminMode && (
                <Paper variant="outlined" sx={companySectionPaperSx}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    اطلاعات پایه
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      gap: 2.5,
                    }}
                  >
                    <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                      <Field.Text name="title" label="عنوان" disabled={companyFieldsReadOnly} />
                    </Box>
                    <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                      <Field.Text
                        name="description"
                        label="توضیحات"
                        multiline
                        rows={3}
                        disabled={companyFieldsReadOnly}
                      />
                    </Box>
                    <Field.Text
                      name="max_branches"
                      label="حداکثر تعداد شعب"
                      type="number"
                      helperText="۰ = بدون سقف"
                      disabled={companyFieldsReadOnly}
                    />
                    {showStatusField && (
                      <ActiveStatusField
                        sectionTitle="وضعیت شرکت"
                        sectionIcon="solar:buildings-2-bold"
                        title="وضعیت"
                        hint="شرکت غیرفعال در تخصیص شعب و استفاده از خدمات محدود می‌شود."
                        icon="solar:buildings-bold"
                        value={isActive}
                        onChange={(value) => setValue('is_active', value)}
                        readOnly={readOnly}
                        fullWidth
                      />
                    )}
                  </Box>
                </Paper>
              )}

              {!readOnly && (
                <Paper variant="outlined" sx={companySectionPaperSx}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    {companyAdminMode ? 'شعب شرکت' : 'خدمات و شعب'}
                  </Typography>
                  <CompanyFormSections
                    companyId={companyId}
                    branchesReloadKey={branchesReloadKey}
                    selectedServices={selectedServices}
                    onServicesChange={setSelectedServices}
                    selectedBranches={selectedBranches}
                    onBranchesChange={setSelectedBranches}
                    branchesOnly={companyAdminMode}
                    branchEditBasePath={paths.dashboard.branch.edit}
                  />
                </Paper>
              )}

              {companyAdminMode && !readOnly && (
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" href={paths.dashboard.branch.create} component="a">
                    تعریف شعبه جدید
                  </Button>
                </Stack>
              )}

              {!readOnly && (
                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                  <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
                    ذخیره تغییرات
                  </Button>
                </Stack>
              )}
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
