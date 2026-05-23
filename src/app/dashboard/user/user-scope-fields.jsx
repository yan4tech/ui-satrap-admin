'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Box, MenuItem, TextField } from '@mui/material';

const EMPTY_BRANCH_LABEL = 'بدون شعبه';

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

function ScopeSelect({ name, label, disabled, emptyLabel, options = [] }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const selectValue = scopeFieldToSelectValue(field.value);

        return (
          <TextField
            select
            fullWidth
            name={field.name}
            label={label}
            disabled={disabled}
            error={!!error}
            helperText={error?.message}
            value={selectValue}
            onChange={(event) => {
              field.onChange(scopeSelectToFieldValue(event.target.value));
            }}
            onBlur={field.onBlur}
            inputRef={field.ref}
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {emptyLabel}
                      </Box>
                    );
                  }
                  const match = options.find((opt) => String(opt.value) === String(selected));
                  return match?.label ?? selected;
                },
                MenuProps: {
                  slotProps: {
                    paper: { sx: { maxHeight: 220 } },
                  },
                },
              },
            }}
          >
            <MenuItem value="">{emptyLabel}</MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        );
      }}
    />
  );
}

/** Branch selector for user create/edit forms. */
export function UserScopeFields({ branches = [], readOnly = false }) {
  const branchOptions = branches.map((b) => ({
    value: b.id,
    label: b.title,
  }));

  return (
    <ScopeSelect
      name="branch_id"
      label="شعبه"
      disabled={readOnly}
      emptyLabel={EMPTY_BRANCH_LABEL}
      options={branchOptions}
    />
  );
}
