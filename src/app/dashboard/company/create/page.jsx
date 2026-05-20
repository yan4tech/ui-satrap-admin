'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  Alert,
  Stack,
  Button,
  Paper,
  Container,
  Typography,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { createCompany } from 'src/lib/company-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import { ActiveStatusField } from 'src/components/status/active-status-field';

import { Form, Field } from 'src/components/hook-form';

import CompanyFormSections from '../company-form-sections';
import CompanyPageHeader, { companySectionPaperSx } from '../company-page-header';
import {
  idsFromSelection,
  branchAssignmentsFromSelection,
} from '../company-form-utils';

const CompanySchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان شرکت الزامی است'),
  description: zod.string().optional(),
  max_branches: zod.coerce
    .number()
    .int()
    .min(0, 'حداقل ۰ (نامحدود)')
    .optional()
    .or(zod.literal('')),
  is_active: zod.boolean(),
});

export default function CreateCompanyPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  const methods = useForm({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      title: '',
      description: '',
      max_branches: 0,
      is_active: true,
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;
  const isActive = watch('is_active');

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || '',
        is_active: data.is_active,
        max_branches: Number(data.max_branches) || 0,
        service_ids: idsFromSelection(selectedServices),
        branch_assignments: branchAssignmentsFromSelection(selectedBranches),
      };
      const created = await createCompany(payload);
      const id = created?.ID ?? created?.id;
      setErrorMessage(null);
      setSuccessMessage('شرکت با موفقیت ثبت شد.');
      if (id) {
        setTimeout(() => router.push(paths.dashboard.company.edit(id)), 800);
      }
    } catch (err) {
      setSuccessMessage(null);
      setErrorMessage(extractMembershipErrorMessage(err, 'خطا در ثبت شرکت'));
    }
  });

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.customShadows?.z8 || theme.shadows[8],
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <CompanyPageHeader
            title="شرکت جدید"
            subtitle="سقف شعب، وضعیت، خدمات مجاز و شعب زیرمجموعه را در این فرم تنظیم کنید."
            badge="فرم ایجاد"
          />

          {!!errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          {!!successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
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
                    <Field.Text name="title" label="عنوان شرکت" />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Field.Text name="description" label="توضیحات" multiline rows={3} />
                  </Box>
                  <Field.Text
                    name="max_branches"
                    label="حداکثر تعداد شعب"
                    type="number"
                    helperText="۰ یعنی بدون سقف"
                  />
                  <ActiveStatusField
                    sectionTitle="وضعیت شرکت"
                    sectionIcon="solar:buildings-2-bold"
                    title="وضعیت"
                    hint="شرکت غیرفعال در تخصیص شعب و استفاده از خدمات محدود می‌شود."
                    icon="solar:buildings-bold"
                    value={isActive}
                    onChange={(value) => setValue('is_active', value)}
                    fullWidth
                  />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={companySectionPaperSx}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  خدمات و شعب
                </Typography>
                <CompanyFormSections
                  selectedServices={selectedServices}
                  onServicesChange={setSelectedServices}
                  selectedBranches={selectedBranches}
                  onBranchesChange={setSelectedBranches}
                />
              </Paper>

              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                <Button variant="outlined" onClick={() => router.back()}>
                  انصراف
                </Button>
                <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
                  ثبت شرکت
                </Button>
              </Stack>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
