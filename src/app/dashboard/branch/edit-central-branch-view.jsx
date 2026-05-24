'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  Alert,
  Stack,
  Button,
  Container,
  Typography,
  CardContent,
} from '@mui/material';

import { updateCentralBranch } from 'src/lib/central-branch-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import { branchAssignmentsFromSelection } from 'src/lib/branch-workflow';
import { Form, Field } from 'src/components/hook-form';

import CompanyFormSections from '../company/company-form-sections';
import {
  idsFromSelection,
  branchesFromCompany,
  servicesFromCompany,
} from '../company/company-form-utils';

const CentralBranchSchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان الزامی است'),
  description: zod.string().optional(),
  max_sub_branches: zod.coerce.number().int().min(0),
});

function childBranchesFromCentral(branch) {
  return branchesFromCompany({ branches: branch?.child_branches ?? branch?.ChildBranches });
}

export default function EditCentralBranchView({ branchData, tenantAdminMode = false }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedServices, setSelectedServices] = useState(() => servicesFromCompany(branchData));
  const [selectedBranches, setSelectedBranches] = useState(() => childBranchesFromCentral(branchData));
  const [branchesReloadKey, setBranchesReloadKey] = useState(0);

  const branchId = branchData?.ID ?? branchData?.id;
  const servicesParentBranchId = Number(
    branchData?.parent_branch_id ?? branchData?.ParentBranchID ?? 0
  );

  const methods = useForm({
    resolver: zodResolver(CentralBranchSchema),
    defaultValues: {
      title: branchData?.title || '',
      description: branchData?.description || '',
      max_sub_branches: branchData?.max_sub_branches ?? 0,
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = tenantAdminMode
        ? { sub_branch_assignments: branchAssignmentsFromSelection(selectedBranches) }
        : {
            title: data.title,
            description: data.description || '',
            max_sub_branches: Number(data.max_sub_branches) || 0,
            is_central: true,
            service_ids: idsFromSelection(selectedServices),
            sub_branch_assignments: branchAssignmentsFromSelection(selectedBranches),
          };
      const updated = await updateCentralBranch(branchId, payload);
      setErrorMessage(null);
      setSuccessMessage('ذخیره شد.');
      if (updated) {
        setSelectedServices(servicesFromCompany(updated));
        setSelectedBranches(childBranchesFromCentral(updated));
      }
      setBranchesReloadKey((k) => k + 1);
    } catch (err) {
      setSuccessMessage(null);
      setErrorMessage(extractMembershipErrorMessage(err));
    }
  });

  return (
    <Container maxWidth={false} disableGutters>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {tenantAdminMode ? 'مدیریت شعبه مرکزی' : 'ویرایش شعبه مرکزی'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            شعب زیرمجموعه و خدمات شعبه مرکزی را مدیریت کنید.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Form methods={methods} onSubmit={onSubmit}>
            <Stack spacing={3}>
              {!tenantAdminMode && (
                <>
                  <Field.Text name="title" label="عنوان شعبه مرکزی" />
                  <Field.Text name="description" label="توضیحات" multiline rows={2} />
                  <Field.Text name="max_sub_branches" label="حداکثر تعداد زیرشعب" type="number" />
                </>
              )}
              <CompanyFormSections
                parentBranchId={branchId}
                servicesParentBranchId={servicesParentBranchId > 0 ? servicesParentBranchId : null}
                branchesReloadKey={branchesReloadKey}
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
                selectedBranches={selectedBranches}
                onBranchesChange={setSelectedBranches}
                branchesOnly={tenantAdminMode}
                branchEditBasePath="/dashboard/branch/edit"
              />
              <Box>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  ذخیره
                </Button>
              </Box>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
}
