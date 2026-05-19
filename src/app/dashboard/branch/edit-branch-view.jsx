'use client';

import { z as zod } from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Autocomplete from '@mui/material/Autocomplete';
import {
  Box,
  Card,
  Alert,
  Stack,
  Radio,
  Table,
  Paper,
  Button,
  Divider,
  TableRow,
  Snackbar,
  Container,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  RadioGroup,
  CardContent,
  FormControl,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import {
  normalizeService,
  fetchServiceCatalog,
  assignBranchServices,
  fetchCompanyServices,
  fetchBranchServicesForCompany,
} from 'src/lib/service-entitlement-api';

import { fetchCompaniesOptions } from 'src/lib/company-api';
import { affiliationReviewToPayload, branchFormValuesFromBranch, BRANCH_AFFILIATION } from 'src/lib/branch-workflow';
import { branchWorkflowZodFields, branchWorkflowSuperRefine } from 'src/lib/branch-workflow-schema';

import { Form, Field } from 'src/components/hook-form';
import BranchWorkflowSection from 'src/components/branch/BranchWorkflowSection';
import ProvinceRegistrationUnitFields from 'src/components/location/ProvinceRegistrationUnitFields';

import { useAuthContext } from 'src/auth/hooks';

import BranchUsersPanel from './BranchUsersPanel';
import { countActiveBranchUsers } from './branch-users-api';

// --------------------------------------
// ZOD SCHEMA
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
  max_users: zod.coerce
    .number({
      invalid_type_error: 'تعداد کاربران باید عدد باشد',
      required_error: 'تعداد کاربران مجاز الزامی است',
    })
    .int('تعداد کاربران باید عدد صحیح باشد')
    .min(0, 'حداقل ۰ (بدون سقف)'),
  is_active: zod.boolean(),
  services: zod.array(zod.number()),
  ...branchWorkflowZodFields,
}).superRefine(branchWorkflowSuperRefine);

const DocumentSchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان مدرک الزامی است'),
  file: zod.instanceof(File, { message: 'فایل مدرک الزامی است' }),
});

// --------------------------------------
// COMPONENT
// --------------------------------------
function resolveBranchServiceIds(branch) {
  const fromServices = (branch?.services || [])
    .map((s) => s?.ID ?? s?.id)
    .filter(Boolean);
  if (fromServices.length > 0) return fromServices;
  return (branch?.permissions || []).map((p) => p?.ID ?? p?.id).filter(Boolean);
}

export default function EditBranch({ branchData, onSaved, readOnly = false }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [documents, setDocuments] = useState(branchData?.documents || []);
  const [newDocuments, setNewDocuments] = useState([
    { rowId: Date.now(), title: '', file: null, previewUrl: null },
  ]);
  const [deleteDocumentIds, setDeleteDocumentIds] = useState([]);

  const normalizeIsActive = (value) => value === true || value === 'true' || value === 1;

  const branchLocationId = branchData?.ID ?? branchData?.id;
  const resolveRegistrationUnitId = (data) =>
    data?.registration_unit ?? data?.registration_unit_id ?? data?.city ?? '';

  const workflowDefaults = branchFormValuesFromBranch(branchData);

  const methods = useForm({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      title: branchData?.title || '',
      province: String(branchData?.province || ''),
      registration_unit: String(resolveRegistrationUnitId(branchData) || ''),
      ip: branchData?.ip || '',
      phone: branchData?.phone || '',
      address: branchData?.address || '',
      description: branchData?.description || '',
      max_users: branchData?.max_users || '',
      is_active: normalizeIsActive(branchData?.is_active),
      services: resolveBranchServiceIds(branchData),
      ...workflowDefaults,
    },
  });

  const userType = String(user?.user_type ?? '').trim();
  const isCompanyAdmin = userType === 'company_admin';
  const isCoreAdmin = userType === 'company';
  const branchId = Number(branchData?.ID ?? branchData?.id ?? 0);
  const adminCompanyId = Number(
    user?.company_id ?? companyId ?? branchData?.company_id ?? branchData?.CompanyID ?? 0
  );
  const hasCompany =
    Number(companyId ?? branchData?.company_id ?? branchData?.CompanyID ?? 0) > 0;
  const canEditWorkflow = !readOnly && (isCoreAdmin || isCompanyAdmin);
  const canEditAffiliation = !readOnly && isCoreAdmin;
  const canEditReviewPolicy =
    !readOnly && (isCoreAdmin || (isCompanyAdmin && (hasCompany || adminCompanyId > 0)));
  const lockAffiliation = isCompanyAdmin ? BRANCH_AFFILIATION.CORPORATE : null;
  const lockCompanyId = isCompanyAdmin && adminCompanyId > 0 ? adminCompanyId : null;
  const [branchUsers, setBranchUsers] = useState(branchData?.users || []);
  const maxUsersLimit = Number(branchData?.max_users ?? 0);
  const activeUserCount = countActiveBranchUsers(branchUsers);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (isCoreAdmin) {
      (async () => {
        try {
          setCompanies(await fetchCompaniesOptions());
        } catch {
          setCompanies([]);
        }
      })();
    }
  }, [isCoreAdmin]);

  useEffect(() => {
    setDocuments(branchData?.documents || []);
    setDeleteDocumentIds([]);
    setNewDocuments([{ rowId: Date.now(), title: '', file: null, previewUrl: null }]);
    methods.reset({
      title: branchData?.title || '',
      province: String(branchData?.province || ''),
      registration_unit: String(resolveRegistrationUnitId(branchData) || ''),
      ip: branchData?.ip || '',
      phone: branchData?.phone || '',
      address: branchData?.address || '',
      description: branchData?.description || '',
      max_users: branchData?.max_users || '',
      is_active: normalizeIsActive(branchData?.is_active),
      services: resolveBranchServiceIds(branchData),
      ...branchFormValuesFromBranch(branchData),
    });
    const cid = branchData?.company_id ?? branchData?.companyId ?? branchData?.CompanyID;
    setCompanyId(cid != null && Number(cid) > 0 ? Number(cid) : null);
  }, [branchData, methods]);

  useEffect(() => {
    (async () => {
      const branchId = Number(branchData?.ID ?? branchData?.id);
      const rawCid = companyId ?? branchData?.company_id ?? branchData?.companyId ?? branchData?.CompanyID;
      const cid = rawCid != null && Number(rawCid) > 0 ? Number(rawCid) : null;
      const current = (branchData?.services || [])
        .map((s) => normalizeService(s))
        .filter(Boolean)
        .map((s) => ({ id: s.id, title: s.title }));

      try {
        let options = [];
        if (isCompanyAdmin && cid) {
          options = await fetchCompanyServices(cid);
          if (branchId) {
            const assigned = await fetchBranchServicesForCompany(cid, branchId);
            if (assigned.length > 0) {
              methods.setValue(
                'services',
                assigned.map((s) => s.id),
                { shouldDirty: false }
              );
            }
          }
        } else if (cid) {
          options = await fetchCompanyServices(cid);
        } else {
          options = await fetchServiceCatalog();
        }

        const merged = new Map();
        [...options, ...current].forEach((item) => {
          if (item?.id) merged.set(item.id, { id: item.id, title: item.title });
        });
        setServicesList(Array.from(merged.values()));
      } catch {
        setServicesList(current);
      }
    })();
  }, [branchData, companyId, isCompanyAdmin, methods]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const branchId = Number(branchData?.ID ?? branchData?.id);

      if (!branchId) {
        setErrorMessage('شناسه شعبه معتبر نیست');
        return;
      }

      const payload = {
        title: data.title,
        province: Number(data.province),
        registration_unit: Number(data.registration_unit),
        max_users: Number(data.max_users),
        is_active: data.is_active,
        delete_document_ids: deleteDocumentIds,
      };

      const serviceIds = data.services || [];
      const rawCid = companyId ?? branchData?.company_id ?? branchData?.companyId ?? branchData?.CompanyID;
      const cid = rawCid != null && Number(rawCid) > 0 ? Number(rawCid) : null;

      const validNewDocuments = newDocuments.filter((doc) => doc.title.trim() || doc.file);
      const parsedNewDocuments = [];

      for (const doc of validNewDocuments) {
        const parsed = DocumentSchema.safeParse(doc);
        if (!parsed.success) {
          setSuccessMessage(null);
          setErrorMessage(parsed.error.issues[0]?.message || 'اطلاعات مدارک جدید نامعتبر است');
          return;
        }
        parsedNewDocuments.push(parsed.data);
      }

      if (isCompanyAdmin && cid) {
        await assignBranchServices(cid, branchId, serviceIds);
      }

      let branchPayload = isCompanyAdmin && cid ? payload : { ...payload, service_ids: serviceIds };

      if (canEditWorkflow) {
        branchPayload = {
          ...branchPayload,
          ...affiliationReviewToPayload(data.branch_affiliation, data.review_policy, {
            companyId: data.company_id,
          }),
        };
      }
      const formData = new FormData();
      formData.append('payload', JSON.stringify(branchPayload));
      parsedNewDocuments.forEach((doc) => {
        formData.append('documents', doc.file);
        formData.append('document_tags', doc.title.trim());
      });

      await axios.put(`/api/membership/branch/${branchId}`, formData, {
        headers: {
          mode: 'company',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onSaved) {
        await onSaved();
      }

      setDeleteDocumentIds([]);
      setNewDocuments([{ rowId: Date.now(), title: '', file: null, previewUrl: null }]);
      setErrorMessage(null);
      setSuccessMessage('ویرایش شعبه و مدارک با موفقیت انجام شد');
    } catch (err) {
      setSuccessMessage(null);
      setErrorMessage(extractMembershipErrorMessage(err, 'خطا در ویرایش اطلاعات'));
    }
  });

  const handleToggleDeleteDocument = (docId) => {
    if (!docId) return;
    setDeleteDocumentIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const addNewDocumentRow = () => {
    setNewDocuments((prev) => [
      ...prev,
      { rowId: Date.now() + Math.random(), title: '', file: null, previewUrl: null },
    ]);
  };

  const removeNewDocumentRow = (rowId) => {
    setNewDocuments((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((row) => row.rowId !== rowId);
    });
  };

  const updateNewDocumentRow = (rowId, field, value) => {
    setNewDocuments((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleCloseToast = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const getDocumentDownloadUrl = (rawPath) => {
    if (!rawPath || rawPath === '-') return null;

    const sourcePath = String(rawPath).trim();
    if (!sourcePath) return null;

    if (/^https?:\/\//i.test(sourcePath)) {
      return sourcePath;
    }

    const normalizedPath = sourcePath.replace(/\\/g, '/').replace(/^\/+/, '');

    if (!normalizedPath) return null;

    if (!CONFIG.serverUrl) {
      return `/${normalizedPath}`;
    }

    return `${CONFIG.serverUrl.replace(/\/+$/, '')}/${normalizedPath}`;
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        mr: 0,
        p: { xs: 1.5, md: 3 },
        background:
          'linear-gradient(180deg, rgba(33,150,243,0.08) 0%, rgba(255,255,255,0.95) 45%, rgba(76,175,80,0.06) 100%)',
        borderRadius: 3,
      }}
    >
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h4" fontWeight={800}>
            ویرایش شعبه
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, mt: 1 }}>
            اطلاعات شعبه را ویرایش کنید و در پایان تغییرات را ذخیره کنید
          </Typography>

          <Divider sx={{ mb: 3.5 }} />

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
              {/* BASIC */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2, fontSize: 18 }}>
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
                      helperText={
                        maxUsersLimit > 0
                          ? `کاربران فعال: ${activeUserCount} از ${maxUsersLimit}`
                          : `کاربران فعال: ${activeUserCount} (بدون سقف)`
                      }
                      disabled={readOnly || (isCompanyAdmin && !isCoreAdmin)}
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
                          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                            وضعیت شعبه
                          </Typography>
                          <RadioGroup
                            row
                            value={field.value ? 'true' : 'false'}
                            onChange={(event) => field.onChange(event.target.value === 'true')}
                            sx={{ gap: 3 }}
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
                readOnly={readOnly || !canEditWorkflow}
                canEditAffiliation={canEditAffiliation}
                canEditReviewPolicy={canEditReviewPolicy}
                lockAffiliation={lockAffiliation}
                lockCompanyId={lockCompanyId}
                hideCompanySelect={isCompanyAdmin}
              />

              {/* LOCATION */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2, fontSize: 18 }}>
                  اطلاعات موقعیت
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    columnGap: 3,
                    rowGap: 2,
                  }}
                >
                  <ProvinceRegistrationUnitFields
                    key={branchLocationId ?? 'branch-location'}
                    disabled={readOnly}
                  />
                </Box>
              </Box>

              {/* SERVICES */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2, fontSize: 18 }}>
                  انتخاب خدمات شعبه
                </Typography>

                {isCompanyAdmin && companyId ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    فقط خدمات مجاز شرکت قابل انتخاب است.
                  </Typography>
                ) : null}

                {isCoreAdmin && companyId ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => router.push(paths.dashboard.company.edit(companyId))}
                    >
                      مدیریت خدمات مجاز شرکت
                    </Button>
                  </Typography>
                ) : null}

                <Controller
                  name="services"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      disabled={readOnly}
                      options={servicesList}
                      getOptionLabel={(o) => o.title}
                      value={servicesList.filter((s) => field.value?.includes(s.id))}
                      onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                      filterSelectedOptions
                      renderInput={(params) => (
                        <TextField {...params} label="جستجو و انتخاب خدمات" placeholder="خدمت..." />
                      )}
                    />
                  )}
                />
              </Box>

              {/* ADDRESS */}
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                  <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                    آدرس و توضیحات
                  </Typography>
                </Box>
                <Box>
                  <Field.Text name="address" label="نشانی شعبه" multiline rows={3} />
                </Box>
                <Box>
                  <Field.Text name="description" label="توضیحات" multiline rows={3} />
                </Box>
              </Box>

              <BranchUsersPanel
                branchId={Number(branchData?.ID ?? branchData?.id)}
                maxUsers={maxUsersLimit}
                readOnly={readOnly}
                onUsersChanged={setBranchUsers}
              />

              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography fontWeight={700} sx={{ mb: 2, fontSize: 18 }}>
                  مدیریت مدارک و مستندات
                </Typography>

                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2.5,
                    border: (theme) => `1px solid ${theme.palette.info.main}`,
                    boxShadow: (theme) => `0 8px 24px ${theme.palette.info.main}1A`,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                    مدارک قبلی
                  </Typography>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 2, borderColor: 'info.light', backgroundColor: 'background.neutral' }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'info.lighter' }}>
                          <TableCell>نام مدرک</TableCell>
                          <TableCell>تصویر مدرک</TableCell>
                          <TableCell width={220}>عملیات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {documents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography variant="body2" color="text.secondary">
                                مدرکی ثبت نشده است.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {documents.map((doc, index) => {
                          const docId = doc?.ID ?? doc?.id;
                          const isMarkedForDelete = deleteDocumentIds.includes(docId);
                          const docTitle = doc?.title || doc?.Title || '-';
                          const docFileName = doc?.file_name || doc?.fileName || doc?.FileName || '-';
                          const docPath = doc?.path || doc?.Path || '-';
                          const downloadUrl = getDocumentDownloadUrl(docPath);

                          return (
                            <TableRow key={`${docPath || docFileName || docId}-${index}`} hover>
                              <TableCell>{docTitle}</TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {docFileName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {docPath}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    component="a"
                                    href={downloadUrl || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={docFileName !== '-' ? docFileName : true}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    disabled={!downloadUrl}
                                  >
                                    دانلود
                                  </Button>
                                  <Button
                                    type="button"
                                    color={isMarkedForDelete ? 'inherit' : 'error'}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleToggleDeleteDocument(docId)}
                                  >
                                    {isMarkedForDelete ? 'لغو حذف' : 'حذف'}
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2.5,
                    border: (theme) => `1px solid ${theme.palette.success.main}`,
                    boxShadow: (theme) => `0 8px 24px ${theme.palette.success.main}1A`,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography fontWeight={700}>مدارک جدید</Typography>
                    <Button type="button" variant="contained" onClick={addNewDocumentRow}>
                      + افزودن سطر
                    </Button>
                  </Box>

                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 2, borderColor: 'success.light' }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'success.lighter' }}>
                          <TableCell>نام مدرک</TableCell>
                          <TableCell>تصویر مدرک</TableCell>
                          <TableCell width={120}>حذف</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {newDocuments.map((row) => (
                          <TableRow key={row.rowId}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="نام مدرک را وارد کنید"
                                value={row.title}
                                onChange={(event) =>
                                  updateNewDocumentRow(row.rowId, 'title', event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Box
                                component="label"
                                sx={{
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '100%',
                                  minHeight: 84,
                                  px: 2,
                                  border: '1px solid',
                                  borderColor: 'text.primary',
                                  borderRadius: 0.5,
                                  cursor: 'pointer',
                                  backgroundColor: 'background.paper',
                                  overflow: 'hidden',
                                }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;

                                    if (!file) {
                                      updateNewDocumentRow(row.rowId, 'file', null);
                                      updateNewDocumentRow(row.rowId, 'previewUrl', null);
                                      return;
                                    }

                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      updateNewDocumentRow(row.rowId, 'file', file);
                                      updateNewDocumentRow(
                                        row.rowId,
                                        'previewUrl',
                                        typeof reader.result === 'string' ? reader.result : null
                                      );
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                                {row.previewUrl ? (
                                  <Box
                                    component="img"
                                    src={row.previewUrl}
                                    alt={row.file?.name || 'پیش نمایش تصویر'}
                                    sx={{
                                      width: '100%',
                                      maxHeight: 110,
                                      objectFit: 'contain',
                                      pointerEvents: 'none',
                                    }}
                                  />
                                ) : (
                                  <>
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        width: '75%',
                                        borderTop: '1px solid',
                                        borderColor: 'text.secondary',
                                        transform: 'rotate(15deg)',
                                        pointerEvents: 'none',
                                      }}
                                    >
                                      &nbsp;
                                    </Box>
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        width: '75%',
                                        borderTop: '1px solid',
                                        borderColor: 'text.secondary',
                                        transform: 'rotate(-15deg)',
                                        pointerEvents: 'none',
                                      }}
                                    >
                                      &nbsp;
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        zIndex: 1,
                                        px: 1,
                                        backgroundColor: 'background.paper',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      تصویر مدرک جدید
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                color="error"
                                variant="outlined"
                                size="small"
                                onClick={() => removeNewDocumentRow(row.rowId)}
                              >
                                حذف
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: '0 8px 20px rgba(25,118,210,0.35)',
                }}
              >
                ذخیره تغییرات
              </Button>
            </Stack>
          </Form>
        </CardContent>
      </Card>
      <Snackbar
        open={!!errorMessage || !!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={errorMessage ? 'error' : 'success'}
          variant="filled"
          sx={{ minWidth: 320 }}
        >
          {errorMessage || successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
