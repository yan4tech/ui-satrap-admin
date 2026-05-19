'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

import { updateCompany, updateMyCompany } from 'src/lib/company-api';
import { paths } from 'src/routes/paths';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';

import { Form, Field } from 'src/components/hook-form';

import CompanyFormSections from './company-form-sections';
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
    formState: { isSubmitting },
  } = methods;

  const branchCount = Array.isArray(companyData?.branches) ? companyData.branches.length : null;

  const companyFieldsReadOnly = readOnly || companyAdminMode;

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

  return (
    <Container maxWidth={false} disableGutters>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700}>
            {companyAdminMode ? 'مدیریت شرکت' : 'ویرایش شرکت'}
          </Typography>
          {branchCount != null && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              شعب ثبت‌شده: {branchCount}
              {Number(companyData?.max_branches) > 0 &&
                ` / سقف: ${companyData.max_branches}`}
            </Typography>
          )}
          <Divider sx={{ my: 3 }} />

          {!!errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          {!!successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3} sx={{ maxWidth: 640 }}>
              <Field.Text name="title" label="عنوان" disabled={companyFieldsReadOnly} />
              <Field.Text
                name="description"
                label="توضیحات"
                multiline
                rows={3}
                disabled={companyFieldsReadOnly}
              />
              <Field.Text
                name="max_branches"
                label="حداکثر تعداد شعب"
                type="number"
                helperText="۰ = بدون سقف"
                disabled={companyFieldsReadOnly}
              />
              <Field.Switch name="is_active" label="فعال" disabled={companyFieldsReadOnly} />

              {!readOnly && (
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
              )}

              {companyAdminMode && !readOnly && (
                <Button
                  variant="outlined"
                  href={paths.dashboard.branch.create}
                  component="a"
                >
                  تعریف شعبه جدید
                </Button>
              )}

              {!readOnly && (
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  ذخیره
                </Button>
              )}
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
