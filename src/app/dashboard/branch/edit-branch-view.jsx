'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Alert,
  Container,
  Divider,
  Stack,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
} from '@mui/material';

import Autocomplete from '@mui/material/Autocomplete';

import { Form, Field } from 'src/components/hook-form';
import axios from 'src/lib/axios';
import { CONFIG } from 'src/global-config';

// --------------------------------------
// ZOD SCHEMA
// --------------------------------------
export const BranchSchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان شعبه الزامی است'),
  province: zod.string().trim().min(1, 'استان الزامی است'),
  city: zod.string().trim().min(1, 'شهر الزامی است'),
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
    .min(1, 'تعداد کاربران باید حداقل 1 باشد'),
  is_active: zod.boolean(),
  permissions: zod.array(zod.number()),
});

const DocumentSchema = zod.object({
  title: zod.string().trim().min(1, 'عنوان مدرک الزامی است'),
  file: zod.instanceof(File, { message: 'فایل مدرک الزامی است' }),
});

// --------------------------------------
// COMPONENT
// --------------------------------------
export default function EditBranch({ branchData, onSaved }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]);
  const [documents, setDocuments] = useState(branchData?.documents || []);
  const [newDocuments, setNewDocuments] = useState([
    { rowId: Date.now(), title: '', file: null, previewUrl: null },
  ]);
  const [deleteDocumentIds, setDeleteDocumentIds] = useState([]);

  const normalizeIsActive = (value) => value === true || value === 'true' || value === 1;

  // fake APIs
  const fetchProvinces = async () => [
    { id: 1, name: 'تهران' },
    { id: 2, name: 'اصفهان' },
  ];

  const fetchCitiesByProvince = async (provinceId) => {
    const data = {
      1: [
        { id: 10, name: 'تهران' },
        { id: 11, name: 'اسلامشهر' },
      ],
      2: [
        { id: 20, name: 'اصفهان' },
        { id: 21, name: 'کاشان' },
      ],
    };
    return data[provinceId] || [];
  };

  const methods = useForm({
    resolver: zodResolver(BranchSchema),
    defaultValues: {
      title: branchData?.title || '',
      province: String(branchData?.province || ''),
      city: String(branchData?.city || ''),
      ip: branchData?.ip || '',
      phone: branchData?.phone || '',
      address: branchData?.address || '',
      description: branchData?.description || '',
      max_users: branchData?.max_users || '',
      is_active: normalizeIsActive(branchData?.is_active),
      permissions: branchData?.permissions?.map((p) => p?.ID ?? p?.id).filter(Boolean) || [],
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { isSubmitting },
  } = methods;

  const selectedProvince = watch('province');

  useEffect(() => {
    setDocuments(branchData?.documents || []);
    setDeleteDocumentIds([]);
    setNewDocuments([{ rowId: Date.now(), title: '', file: null, previewUrl: null }]);
    methods.reset({
      title: branchData?.title || '',
      province: String(branchData?.province || ''),
      city: String(branchData?.city || ''),
      ip: branchData?.ip || '',
      phone: branchData?.phone || '',
      address: branchData?.address || '',
      description: branchData?.description || '',
      max_users: branchData?.max_users || '',
      is_active: normalizeIsActive(branchData?.is_active),
      permissions: branchData?.permissions?.map((p) => p?.ID ?? p?.id).filter(Boolean) || [],
    });
  }, [branchData, methods]);

  // load provinces
  useEffect(() => {
    (async () => {
      const res = await fetchProvinces();
      setProvinces(res);
    })();
  }, []);

  // load permissions/services options
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/membership/ac/permission?permission_type=PROCESS', {
          headers: { mode: 'company' },
        });
        const apiOptions = (res?.data?.data || []).map((item) => ({
          id: item.ID,
          title: item.title,
        }));
        const currentBranchOptions = (branchData?.permissions || [])
          .map((item) => ({
            id: item?.ID ?? item?.id,
            title: item?.title || '-',
          }))
          .filter((item) => item.id);

        const mergedOptionsMap = new Map();
        [...apiOptions, ...currentBranchOptions].forEach((item) => {
          mergedOptionsMap.set(item.id, item);
        });

        setPermissionsList(Array.from(mergedOptionsMap.values()));
      } catch {
        const fallbackOptions = (branchData?.permissions || [])
          .map((item) => ({
            id: item?.ID ?? item?.id,
            title: item?.title || '-',
          }))
          .filter((item) => item.id);
        setPermissionsList(fallbackOptions);
      }
    })();
  }, [branchData]);

  useEffect(() => {
    if (!selectedProvince) return;

    (async () => {
      const res = await fetchCitiesByProvince(selectedProvince);
      setCities(res);
      const currentCity = methods.getValues('city');
      const cityExistsInProvince = res.some((c) => String(c.id) === String(currentCity));
      if (!cityExistsInProvince) {
        setValue('city', '');
      }
    })();
  }, [selectedProvince, setValue, methods]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const branchId = Number(branchData?.ID ?? branchData?.id);

      if (!branchId) {
        setErrorMessage('شناسه شعبه معتبر نیست');
        return;
      }

      const payload = {
        title: data.title,
        max_users: Number(data.max_users),
        is_active: data.is_active,
        user_ids: (branchData?.users || []).map((u) => u?.ID ?? u?.id).filter(Boolean),
        permission_ids: data.permissions,
        delete_document_ids: deleteDocumentIds,
      };

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

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payload));
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
    } catch {
      setSuccessMessage(null);
      setErrorMessage('خطا در ویرایش اطلاعات');
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
                    <Field.Text name="max_users" label="تعداد کاربران مجاز شعبه" type="number" />
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
                  <Box>
                    <Field.Select name="province" label="استان" placeholder="انتخاب استان">
                      {provinces.map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>

                  <Box>
                    <Field.Select
                      name="city"
                      label="شهر"
                      disabled={!selectedProvince}
                      placeholder="انتخاب شهر"
                    >
                      {cities.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Field.Select>
                  </Box>
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
                  انتخاب خدمات
                </Typography>

                <Controller
                  name="permissions"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={permissionsList}
                      getOptionLabel={(o) => o.title}
                      value={permissionsList.filter((s) => field.value?.includes(s.id))}
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

                <Box sx={{ mb: 3 }}>
                  <Typography fontWeight={600} sx={{ mb: 1.5 }}>
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

                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography fontWeight={600}>مدارک جدید</Typography>
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
