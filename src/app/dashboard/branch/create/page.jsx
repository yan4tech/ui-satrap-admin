'use client';

import { z as zod } from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Card,
  Alert,
  Stack,
  Radio,
  Button,
  Divider,
  Container,
  Typography,
  RadioGroup,
  CardContent,
  FormControl,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';
import { fetchCompaniesOptions, fetchMyCompany } from 'src/lib/company-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';

import { PERM, userHasAnyPermission, userHasPermission } from 'src/lib/permissions';

import { useAuthContext } from 'src/auth/hooks';

import { Form, Field } from 'src/components/hook-form';
import BranchWorkflowSection from 'src/components/branch/BranchWorkflowSection';
import ProvinceRegistrationUnitFields from 'src/components/location/ProvinceRegistrationUnitFields';
import { affiliationReviewToPayload, BRANCH_AFFILIATION, REVIEW_POLICY } from 'src/lib/branch-workflow';
import { branchWorkflowZodFields, branchWorkflowSuperRefine } from 'src/lib/branch-workflow-schema';

// --------------------------------------
// ZOD
// --------------------------------------
export const BranchSchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان شعبه الزامی است'),
  province: zod.string().trim().min(1, 'استان الزامی است'),
  registration_unit: zod.string().trim().min(1, 'واحد ثبتی الزامی است'),
  ip: zod
    .string()
    .trim()
    .min(1, 'IP الزامی است')
    .regex(
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      'فرمت IP معتبر نیست'
    ),
  phone: zod.string().trim().min(1, 'شماره تلفن الزامی است'),
  address: zod.string().trim().min(1, 'نشانی شعبه الزامی است'),
  description: zod.string().optional(),
  max_users: zod
    .coerce
    .number({
      invalid_type_error: 'تعداد کاربران باید عدد باشد',
      required_error: 'تعداد کاربران مجاز الزامی است',
    })
    .int('تعداد کاربران باید عدد صحیح باشد')
    .min(0, 'حداقل ۰ (بدون سقف)'),
  ...branchWorkflowZodFields,
  is_active: zod.boolean(),
}).superRefine(branchWorkflowSuperRefine);

// --------------------------------------

const CreateBranch = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [myCompanyId, setMyCompanyId] = useState(null);

  const isCompanyAdmin = userHasPermission(user, PERM.ui.companyTenantManage);
  const isCoreAdmin = userHasAnyPermission(user, [PERM.ui.companyCentralList, PERM.ui.companyCentralCreate]);

  const methods = useForm({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      title: '',
      province: '',
      registration_unit: '',
      ip: '',
      description: '',
      address: '',
      phone: '',
      is_active: false,
      max_users: '',
      branch_affiliation: isCompanyAdmin ? BRANCH_AFFILIATION.CORPORATE : BRANCH_AFFILIATION.INDEPENDENT,
      review_policy: REVIEW_POLICY.REQUIRED,
      company_id: '',
    },
  });

  useEffect(() => {
    if (!isCoreAdmin) {
      return;
    }
    (async () => {
      try {
        setCompanies(await fetchCompaniesOptions());
      } catch {
        setCompanies([]);
      }
    })();
  }, [isCoreAdmin]);

  useEffect(() => {
    if (!isCompanyAdmin) {
      return;
    }
    (async () => {
      try {
        const company = await fetchMyCompany();
        const cid = Number(company?.ID ?? company?.id ?? user?.company_id ?? 0);
        if (cid > 0) {
          setMyCompanyId(cid);
          methods.setValue('branch_affiliation', BRANCH_AFFILIATION.CORPORATE);
          methods.setValue('company_id', String(cid));
        }
      } catch {
        setMyCompanyId(null);
      }
    })();
  }, [isCompanyAdmin, methods, user?.company_id]);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        title: data.title,
        province: Number(data.province),
        registration_unit: Number(data.registration_unit),
        ip: data.ip,
        phone: data.phone,
        address: data.address,
        description: data.description || '',
        is_active: data.is_active,
        max_users: Number(data.max_users),
        ...affiliationReviewToPayload(data.branch_affiliation, data.review_policy, {
          companyId: data.company_id,
        }),
      };
      const res = await axios.post('/api/membership/branch', payload, {
        headers: { mode: 'company' },
      });
      const createdId = res?.data?.ID;
      setErrorMessage(null);
      setSuccessMessage('شعبه با موفقیت ثبت شد. در حال انتقال به صفحه ویرایش...');

      if (createdId) {
        setTimeout(() => {
          router.push(paths.dashboard.branch.edit(createdId));
        }, 900);
      }
    } catch (err) {
      setSuccessMessage(null);
      setErrorMessage(extractMembershipErrorMessage(err, 'خطا در ثبت اطلاعات'));
    }
  });

  return (
    <Container maxWidth={false} disableGutters sx={{ mr: 0 }}>
      <Card sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            اطلاعات شعبه
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            لطفاً اطلاعات خواسته‌شده را تکمیل کنید
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
            <Stack spacing={4}>
              {/* ================= BASIC ================= */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: (theme) => `1px solid ${theme.palette.primary.main}`,
                  boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}1A`,
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography fontWeight={600} sx={{ mb: 2 }}>
                  اطلاعات پایه شعبه
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: 3,
                    rowGap: 2,
                  }}
                >
                  <Box>
                    <Field.Text name="title" label="عنوان شعبه" />
                  </Box>

                  <Box>
                    <Field.Text name="ip" label="IP" />
                  </Box>

                  <Box>
                    <Field.Text
                      name="max_users"
                      label="تعداد کاربران مجاز شعبه"
                      type="number"
                      helperText="۰ = بدون سقف"
                    />
                  </Box>
                  <Box>
                    <Field.Text name="phone" label="شماره تلفن" />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                    <Controller
                      name="is_active"
                      control={control}
                      render={({ field }) => (
                        <FormControl
                          sx={{
                            width: '100%',
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ mb: 1.5, textAlign: 'left' }}
                          >
                            وضعیت شعبه
                          </Typography>
                          <RadioGroup
                            row
                            value={field.value ? 'true' : 'false'}
                            onChange={(event) => field.onChange(event.target.value === 'true')}
                            sx={{
                              justifyContent: 'flex-start',
                              // direction: 'rtl',
                              gap: 3,
                            }}
                          >
                            <FormControlLabel
                              value="true"
                              control={<Radio size="medium" sx={{ transform: 'scale(1.2)' }} />}
                              label="فعال"
                              sx={{
                                '.MuiFormControlLabel-label': { fontSize: 18, fontWeight: 600 },
                              }}
                            />
                            <FormControlLabel
                              value="false"
                              control={<Radio size="medium" sx={{ transform: 'scale(1.2)' }} />}
                              label="غیرفعال"
                              sx={{
                                '.MuiFormControlLabel-label': { fontSize: 18, fontWeight: 600 },
                              }}
                            />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                  </Box>
                </Box>
              </Box>

              <BranchWorkflowSection
                companies={companies}
                canEditAffiliation={isCoreAdmin}
                lockAffiliation={isCompanyAdmin ? BRANCH_AFFILIATION.CORPORATE : null}
                lockCompanyId={isCompanyAdmin && myCompanyId ? myCompanyId : null}
                hideCompanySelect={isCompanyAdmin}
              />

              <Divider />

              {/* ================= LOCATION ================= */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: (theme) => `1px solid ${theme.palette.info.main}`,
                  boxShadow: (theme) => `0 8px 24px ${theme.palette.info.main}1A`,
                  backgroundColor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: 3,
                    rowGap: 2,
                  }}
                >
                  <ProvinceRegistrationUnitFields />
                </Box>
              </Box>

              <Divider />

              {/* ================= ADDRESS ================= */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: (theme) => `1px solid ${theme.palette.success.main}`,
                  boxShadow: (theme) => `0 8px 24px ${theme.palette.success.main}1A`,
                  backgroundColor: 'background.paper',
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Typography fontWeight={600}>آدرس و توضیحات</Typography>
                </Box>
                <Box>
                  <Field.Text name="address" label="نشانی شعبه" multiline rows={3} />
                </Box>
                <Box>
                  <Field.Text name="description" label="توضیحات" multiline rows={3} />
                </Box>
              </Box>

              {/* ================= SUBMIT ================= */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                }}
              >
                ثبت اطلاعات
              </Button>
            </Stack>
          </Form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateBranch;
