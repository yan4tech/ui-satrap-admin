'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Switch,
  Button,
  Divider,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { fetchAssignableBranches } from 'src/lib/branch-api';
import { fetchBranchServiceOptionCatalog } from 'src/lib/service-entitlement-api';

function resolveBranchEditHref(branchEditBasePath, branchId) {
  if (!branchEditBasePath || !branchId) return null;
  if (typeof branchEditBasePath === 'function') {
    return branchEditBasePath(branchId);
  }
  const base = String(branchEditBasePath).replace(/\/+$/, '');
  return `${base}/${branchId}`;
}

export default function CompanyFormSections({
  parentBranchId = null,
  companyId = null,
  /** والد برای محدودیت خدمات (مثلاً شعبه مرکزی تو در تو) */
  servicesParentBranchId = null,
  branchesReloadKey = 0,
  selectedServices,
  onServicesChange,
  selectedBranches,
  onBranchesChange,
  disabled = false,
  branchesOnly = false,
  branchEditBasePath = null,
}) {
  const [catalog, setCatalog] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOptions = useCallback(async () => {
    const servicesParentId = Number(servicesParentBranchId) || 0;
    const [services, branches] = await Promise.all([
      fetchBranchServiceOptionCatalog(servicesParentId > 0 ? servicesParentId : null),
      fetchAssignableBranches({
        parentBranchId: parentBranchId || companyId || undefined,
        excludeBranchId: parentBranchId || companyId || undefined,
      }),
    ]);
    return { services, branches };
  }, [parentBranchId, companyId, servicesParentBranchId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { services, branches } = await loadOptions();
        if (cancelled) return;
        setCatalog(services);
        setBranchOptions(branches);
      } catch {
        if (!cancelled) {
          setCatalog([]);
          setBranchOptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOptions, branchesReloadKey]);

  const excludeBranchId = Number(parentBranchId || companyId || 0) || 0;

  const branchAutocompleteOptions = useMemo(() => {
    const merged = new Map();
    [...branchOptions, ...(selectedBranches ?? [])].forEach((item) => {
      if (item?.id) merged.set(item.id, item);
    });
    return Array.from(merged.values()).filter(
      (item) => !excludeBranchId || item.id !== excludeBranchId
    );
  }, [branchOptions, selectedBranches, excludeBranchId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Divider />
      {!branchesOnly && (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          تخصیص خدمات به شرکت
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {Number(servicesParentBranchId) > 0
            ? 'فقط خدمات تخصیص‌یافته به شعبهٔ والد در اینجا قابل انتخاب است. شعبات زیرمجموعه نیز فقط از همین مجموعه می‌توانند انتخاب کنند.'
            : 'شعبات زیرمجموعه فقط می‌توانند خدمات انتخاب‌شده در اینجا را دریافت کنند.'}
        </Typography>
        <Autocomplete
          multiple
          disabled={disabled}
          options={catalog}
          getOptionLabel={(o) => o.title}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={selectedServices}
          onChange={(_, value) => onServicesChange(value)}
          renderInput={(params) => (
            <TextField {...params} label="خدمات مجاز شرکت" placeholder="انتخاب خدمت..." />
          )}
        />
      </Box>
      )}

      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          شعب زیرمجموعه
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          فقط شعب آزاد (بدون والد مرکزی دیگر) یا شعب مستقیم همین شعبه مرکزی نمایش داده می‌شوند.
          شعبه در حال ویرایش و والدهای آن در فهرست نیستند تا ساختار درختی حفظ شود. شعبه مرکزی
          می‌تواند زیرمجموعه شعبه مرکزی دیگر باشد. برای هر شعبه می‌توانید بازبینی فرم را فعال یا
          غیرفعال کنید.
        </Typography>
        <Autocomplete
          multiple
          disabled={disabled}
          options={branchAutocompleteOptions}
          getOptionLabel={(o) => o.title}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={selectedBranches}
          onChange={(_, value) =>
            onBranchesChange(
              value.map((item) => ({
                ...item,
                review_required: item.review_required !== false,
              }))
            )
          }
          renderInput={(params) => (
            <TextField {...params} label="شعب" placeholder="انتخاب شعبه..." />
          )}
        />
        {selectedBranches.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {selectedBranches.map((branch) => (
              <Box
                key={branch.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {branch.title}
                  </Typography>
                  {branchEditBasePath && (
                    <Button
                      size="small"
                      variant="text"
                      href={resolveBranchEditHref(branchEditBasePath, branch.id)}
                      component="a"
                    >
                      ویرایش / فعال‌سازی
                    </Button>
                  )}
                </Stack>
                <FormControlLabel
                  disabled={disabled}
                  control={
                    <Switch
                      checked={branch.review_required !== false}
                      onChange={(e) => {
                        const next = selectedBranches.map((b) =>
                          b.id === branch.id
                            ? { ...b, review_required: e.target.checked }
                            : b
                        );
                        onBranchesChange(next);
                      }}
                      color="primary"
                    />
                  }
                  label="بازبینی فرم"
                />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
