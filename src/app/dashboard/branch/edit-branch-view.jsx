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
  CardContent,
  TableContainer,
} from '@mui/material';

import axios from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { getApiRequestMode } from 'src/lib/api-mode';
import { fetchCentralBranchOptions } from 'src/lib/branch-api';
import { extractMembershipErrorMessage } from 'src/lib/membership-errors';
import { PERM, userHasPermission, userHasAnyPermission } from 'src/lib/permissions';
import { branchWorkflowZodFields, branchWorkflowSuperRefine } from 'src/lib/branch-workflow-schema';
import {
  normalizeService,
  assignBranchServices,
  fetchBranchServicesForCompany,
  fetchBranchServiceOptionCatalog,
} from 'src/lib/service-entitlement-api';
import {
  REVIEW_POLICY,
  BRANCH_AFFILIATION,
  affiliationReviewToPayload,
  branchFormValuesFromBranch,
  isCentralBranchAffiliation,
  branchAssignmentsFromSelection,
  centralBranchFieldsFromAffiliation,
  resolveServiceConstraintParentBranchId,
} from 'src/lib/branch-workflow';

import { Form, Field } from 'src/components/hook-form';
import { ActiveStatusField } from 'src/components/status/active-status-field';
import BranchWorkflowSection from 'src/components/branch/BranchWorkflowSection';
import ProvinceRegistrationUnitFields from 'src/components/location/ProvinceRegistrationUnitFields';

import { useAuthContext } from 'src/auth/hooks';

import BranchUsersPanel from './BranchUsersPanel';
import { countActiveBranchUsers } from './branch-users-api';
import CompanyFormSections from '../company/company-form-sections';
import { branchesFromCompany } from '../company/company-form-utils';

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
  const [selectedSubBranches, setSelectedSubBranches] = useState(() =>
    branchesFromCompany(branchData)
  );
  const [subBranchesReloadKey, setSubBranchesReloadKey] = useState(0);

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

  const isCentralBranch = Boolean(branchData?.is_central ?? branchData?.IsCentral);

  const isCompanyAdmin = userHasPermission(user, PERM.ui.companyTenantManage);
  const canManageCentralBranches = userHasAnyPermission(user, [
    PERM.ui.branchCentralList,
    PERM.ui.branchCentralCreate,
    PERM.ui.branchCentral,
    'api.branch.manage',
  ]);
  const isCompanyOnlyAdmin = isCompanyAdmin && !canManageCentralBranches;
  const branchId = Number(branchData?.ID ?? branchData?.id ?? 0);
  const tenantCentralBranchId = Number(user?.branch_id ?? user?.BranchID ?? 0);
  const adminCompanyId = Number(
    companyId ?? branchData?.parent_branch_id ?? branchData?.ParentBranchID ?? 0
  );
  const hasCompany =
    Number(companyId ?? branchData?.parent_branch_id ?? branchData?.ParentBranchID ?? 0) > 0;
  const canEditWorkflow = !readOnly && (canManageCentralBranches || isCompanyAdmin);
  const canEditAffiliation = !readOnly && canManageCentralBranches;
  const canEditReviewPolicy =
    !readOnly && (canManageCentralBranches || (isCompanyAdmin && (hasCompany || adminCompanyId > 0)));
  const isOwnCentralBranch =
    isCompanyAdmin && tenantCentralBranchId === branchId && isCentralBranch;
  const lockAffiliation =
    isCompanyOnlyAdmin && !isOwnCentralBranch ? BRANCH_AFFILIATION.SUB : null;
  const lockParentBranchId =
    isCompanyOnlyAdmin && tenantCentralBranchId > 0 && !isOwnCentralBranch
      ? tenantCentralBranchId
      : null;
  const [branchUsers, setBranchUsers] = useState(branchData?.users || []);
  const maxUsersLimit = Number(branchData?.max_users ?? 0);
  const activeUserCount = countActiveBranchUsers(branchUsers);

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;
  const isActive = watch('is_active');
  const branchAffiliation = watch('branch_affiliation');
  const watchedParentBranchId = watch('parent_branch_id');
  const isCentralAffiliation = isCentralBranchAffiliation(branchAffiliation);
  const serviceConstraintParentId = resolveServiceConstraintParentBranchId({
    branchAffiliation,
    parentBranchId: watchedParentBranchId,
    branchData,
    companyId,
  });
  const canManageSubBranches =
    isCentralAffiliation &&
    (canManageCentralBranches || (isCompanyAdmin && tenantCentralBranchId === branchId));

  useEffect(() => {
    if (!canManageCentralBranches && !canEditWorkflow) {
      return;
    }
    (async () => {
      try {
        setCompanies(await fetchCentralBranchOptions({ excludeBranchId: branchId }));
      } catch {
        setCompanies([]);
      }
    })();
  }, [canManageCentralBranches, canEditWorkflow, branchId]);

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
    const cid = branchData?.parent_branch_id ?? branchData?.companyId ?? branchData?.ParentBranchID;
    setCompanyId(cid != null && Number(cid) > 0 ? Number(cid) : null);
    setSelectedSubBranches(branchesFromCompany(branchData));
  }, [branchData, methods]);

  useEffect(() => {
    (async () => {
      const branchId = Number(branchData?.ID ?? branchData?.id);
      const constraintParentId = resolveServiceConstraintParentBranchId({
        branchAffiliation,
        parentBranchId: watchedParentBranchId,
        branchData,
        companyId,
      });
      const current = (branchData?.services || [])
        .map((s) => normalizeService(s))
        .filter(Boolean)
        .map((s) => ({ id: s.id, title: s.title }));

      const mergeServiceOptions = (...groups) => {
        const merged = new Map();
        groups.flat().forEach((item) => {
          if (item?.id) merged.set(item.id, { id: item.id, title: item.title });
        });
        return Array.from(merged.values());
      };

      let assigned = [];
      try {
        if (branchId) {
          assigned = await fetchBranchServicesForCompany(constraintParentId, branchId);
        }
      } catch {
        assigned = [];
      }

      try {
        const options = await fetchBranchServiceOptionCatalog(constraintParentId);
        const mergedOptions = mergeServiceOptions(options, current, assigned);
        const allowedIds = new Set(mergedOptions.map((s) => s.id));

        const assignedIds = assigned.map((s) => s.id);
        const initialIds =
          assignedIds.length > 0 ? assignedIds : resolveBranchServiceIds(branchData);
        const selectedIds = constraintParentId
          ? initialIds.filter((id) => allowedIds.has(id))
          : initialIds;

        if (selectedIds.length > 0) {
          methods.setValue('services', selectedIds, { shouldDirty: false });
        } else if (constraintParentId) {
          methods.setValue('services', [], { shouldDirty: false });
        }

        const formIds = methods.getValues('services') || [];
        const trimmedFormIds = constraintParentId
          ? formIds.filter((id) => allowedIds.has(id))
          : formIds;
        if (trimmedFormIds.length !== formIds.length) {
          methods.setValue('services', trimmedFormIds, { shouldDirty: true });
        }

        setServicesList(mergedOptions);
      } catch {
        const fallbackIds =
          assigned.length > 0
            ? assigned.map((s) => s.id)
            : resolveBranchServiceIds(branchData);
        if (fallbackIds.length > 0) {
          methods.setValue('services', fallbackIds, { shouldDirty: false });
        }
        setServicesList(mergeServiceOptions(current, assigned));
      }
    })();
  }, [branchData, companyId, branchAffiliation, watchedParentBranchId, methods]);

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
      const rawCid = companyId ?? branchData?.parent_branch_id ?? branchData?.companyId ?? branchData?.ParentBranchID;
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

      if (canEditWorkflow && !isCompanyOnlyAdmin) {
        branchPayload = {
          ...branchPayload,
          ...affiliationReviewToPayload(data.branch_affiliation, data.review_policy, {
            parentBranchId: data.parent_branch_id,
          }),
        };
      } else if (isCompanyOnlyAdmin && canEditReviewPolicy) {
        branchPayload.review_required = data.review_policy === REVIEW_POLICY.REQUIRED;
      }

      const isCentralForm = isCentralBranchAffiliation(data.branch_affiliation);
      const canSaveSubBranches =
        isCentralForm &&
        (canManageCentralBranches || (isCompanyAdmin && tenantCentralBranchId === branchId));

      if (canSaveSubBranches) {
        branchPayload.sub_branch_assignments = branchAssignmentsFromSelection(selectedSubBranches);
      }

      if (canManageCentralBranches && !isCompanyOnlyAdmin) {
        Object.assign(
          branchPayload,
          centralBranchFieldsFromAffiliation(data.branch_affiliation, data.max_sub_branches)
        );
      }
      const formData = new FormData();
      formData.append('payload', JSON.stringify(branchPayload));
      parsedNewDocuments.forEach((doc) => {
        formData.append('documents', doc.file);
        formData.append('document_tags', doc.title.trim());
      });

      await axios.put(`/api/membership/branch/${branchId}`, formData, {
        headers: {
          mode: getApiRequestMode(),
          'Content-Type': 'multipart/form-data',
        },
      });

      if (canSaveSubBranches) {
        setSubBranchesReloadKey((k) => k + 1);
      }

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
                      disabled={readOnly || isCompanyOnlyAdmin}
                    />
                  </Box>
                  <Box>
                    <Field.Text name="phone" label="شماره تلفن" />
                  </Box>
                  <Box>
                    <ActiveStatusField
                      sectionTitle="وضعیت شعبه"
                      sectionIcon="solar:shop-2-bold"
                      title="وضعیت"
                      hint="شعبه غیرفعال در تخصیص کاربر و استفاده از سرویس‌ها محدود می‌شود."
                      icon="solar:shop-bold"
                      value={Boolean(isActive)}
                      onChange={(value) => setValue('is_active', value)}
                      readOnly={readOnly}
                      fullWidth
                    />
                  </Box>
                </Box>
              </Box>

              {canEditWorkflow || isCentralBranch || isCentralAffiliation || isOwnCentralBranch ? (
                <BranchWorkflowSection
                  centralBranches={companies}
                  readOnly={readOnly}
                  canEditAffiliation={canEditAffiliation && !isOwnCentralBranch}
                  canEditReviewPolicy={canEditReviewPolicy}
                  showCentralType={(canManageCentralBranches && !isCompanyOnlyAdmin) || isOwnCentralBranch}
                  lockAffiliation={lockAffiliation}
                  lockParentBranchId={lockParentBranchId}
                  hideParentSelect={false}
                />
              ) : null}

              {canManageSubBranches ? (
                <Box
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    زیرشعب
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    شعب زیرمجموعه مستقیم این شعبه مرکزی را انتخاب کنید. فقط شعب آزاد یا همین
                    زیرمجموعه‌ها نمایش داده می‌شوند؛ خود این شعبه و والدهایش در فهرست نیستند.
                  </Typography>
                  <CompanyFormSections
                    parentBranchId={branchId}
                    branchesReloadKey={subBranchesReloadKey}
                    selectedBranches={selectedSubBranches}
                    onBranchesChange={setSelectedSubBranches}
                    disabled={readOnly}
                    branchesOnly
                    branchEditBasePath="/dashboard/branch/edit"
                  />
                </Box>
              ) : null}

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

                {serviceConstraintParentId ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    این شعبه زیرمجموعهٔ شعبهٔ والد است؛ فقط خدماتی که به شعبهٔ والد تخصیص
                    داده شده‌اند قابل انتخاب هستند و نمی‌توانید خدماتی فراتر از آن ارائه دهید.
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
                      isOptionEqualToValue={(a, b) => a.id === b.id}
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
