'use client';

import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { MenuItem, TextField } from '@mui/material';

import {
  branchCompanyId,
  filterBranchesForCompany,
} from './user-scope-utils';

/** MUI Select treats numeric 0 as empty; use '' for "none" in the UI. */
function scopeFieldToSelectValue(value) {
  const n = Number(value ?? 0);
  return n > 0 ? String(n) : '';
}

function scopeSelectToFieldValue(raw) {
  if (raw === '' || raw == null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function ScopeSelect({ name, label, disabled, children }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          select
          fullWidth
          name={field.name}
          label={label}
          disabled={disabled}
          error={!!error}
          helperText={error?.message}
          value={scopeFieldToSelectValue(field.value)}
          onChange={(event) => {
            field.onChange(scopeSelectToFieldValue(event.target.value));
          }}
          onBlur={field.onBlur}
          ref={field.ref}
          slotProps={{
            select: {
              displayEmpty: true,
              MenuProps: {
                slotProps: {
                  paper: { sx: [{ maxHeight: 220 }] },
                },
              },
            },
          }}
        >
          {children}
        </TextField>
      )}
    />
  );
}

/**
 * Company + branch selectors for user create/edit forms.
 */
export function UserScopeFields({
  companies = [],
  branches = [],
  companyId = 0,
  readOnly = false,
}) {
  const cid = Number(companyId ?? 0);
  const visibleBranches = useMemo(
    () => filterBranchesForCompany(branches, cid),
    [branches, cid]
  );

  return (
    <>
      <ScopeSelect name="company_id" label="شرکت" disabled={readOnly}>
        <MenuItem value="">بدون شرکت</MenuItem>
        {companies.map((c) => (
          <MenuItem key={c.id} value={String(c.id)}>
            {c.title}
          </MenuItem>
        ))}
      </ScopeSelect>
      <ScopeSelect name="branch_id" label="شعبه" disabled={readOnly}>
        <MenuItem value="">بدون شعبه</MenuItem>
        {visibleBranches.map((b) => {
          const bcid = branchCompanyId(b);
          const suffix = bcid > 0 && cid <= 0 ? ' (شعبه شرکت)' : bcid <= 0 ? ' (مستقل)' : '';
          return (
            <MenuItem key={b.id} value={String(b.id)}>
              {`${b.title}${suffix}`}
            </MenuItem>
          );
        })}
      </ScopeSelect>
    </>
  );
}
