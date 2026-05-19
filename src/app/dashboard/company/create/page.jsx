'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  Alert,
  Stack,
  Button,
  Divider,
  Container,
  Typography,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { createCompany } from 'src/lib/company-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';

import { Form, Field } from 'src/components/hook-form';

import CompanyFormSections from '../company-form-sections';
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
    formState: { isSubmitting },
  } = methods;

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
      <Card sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            شرکت جدید
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            سقف تعداد شعب، خدمات مجاز و شعب زیرمجموعه را در همین فرم تنظیم کنید.
          </Typography>
          <Divider sx={{ mb: 3 }} />

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
            <Stack spacing={3} sx={{ maxWidth: 640 }}>
              <Field.Text name="title" label="عنوان شرکت" />
              <Field.Text name="description" label="توضیحات" multiline rows={3} />
              <Field.Text
                name="max_branches"
                label="حداکثر تعداد شعب"
                type="number"
                helperText="۰ یعنی بدون سقف"
              />
              <Field.Switch name="is_active" label="فعال" />

              <CompanyFormSections
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
                selectedBranches={selectedBranches}
                onBranchesChange={setSelectedBranches}
              />

              <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
                ثبت شرکت
              </Button>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
