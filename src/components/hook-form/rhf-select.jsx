import { Children, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { merge } from 'es-toolkit';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { HelperText } from './help-text';

// ----------------------------------------------------------------------

function getMenuItemLabel(selectChildren, selected) {
  let label = null;

  Children.forEach(selectChildren, (child) => {
    if (label != null) return;
    if (!isValidElement(child) || child.props.value === undefined) return;
    if (String(child.props.value) !== String(selected)) return;
    label = child.props.children;
  });

  return label;
}

export function RHFSelect({ name, children, helperText, placeholder, slotProps = {}, sx, ...other }) {
  const { control } = useFormContext();
  const effectivePlaceholder = placeholder || 'انتخاب کنید';

  const labelId = `${name}-select`;
  const rootRef = useRef(null);
  const [menuPaperMinPx, setMenuPaperMinPx] = useState(undefined);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const updateWidth = () => {
      const w = rootRef.current?.offsetWidth ?? 0;
      setMenuPaperMinPx(w > 0 ? w : undefined);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(rootRef.current);

    return () => observer.disconnect();
  }, []);

  const baseSlotProps = useMemo(
    () => ({
      select: {
        sx: { width: '100%', textTransform: 'capitalize' },
        ...(placeholder
          ? {
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '' || selected == null) {
                  return (
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      {placeholder}
                    </Box>
                  );
                }

                const label = getMenuItemLabel(children, selected);
                if (label != null) {
                  return label;
                }

                return selected;
              },
            }
          : {
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === '' || selected == null) {
                  return (
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      {effectivePlaceholder}
                    </Box>
                  );
                }

                const label = getMenuItemLabel(children, selected);
                if (label != null) {
                  return label;
                }

                return selected;
              },
            }),
        MenuProps: {
          slotProps: {
            paper: {
              sx: [
                { maxHeight: 280 },
                (theme) => ({
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  ...theme.mixins.paperStyles(theme, { dropdown: true }),
                }),
              ],
            },
          },
        },
      },
      htmlInput: { id: labelId },
      inputLabel: {
        htmlFor: labelId,
        sx: {
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'clip',
          lineHeight: 1.3,
        },
      },
    }),
    [placeholder, children, labelId, effectivePlaceholder]
  );

  const mergedSlotProps = useMemo(() => {
    const merged = merge(baseSlotProps, slotProps);
    const selectProps = merged.select ?? {};
    const userOnOpen = selectProps.onOpen;
    const userOnClose = selectProps.onClose;
    const menuProps = selectProps.MenuProps ?? {};
    const paperSlot = menuProps.slotProps?.paper;
    const paperObject = typeof paperSlot === 'function' ? null : paperSlot ?? {};

    const paperSlotMerged =
      paperObject === null
        ? paperSlot
        : {
            ...paperObject,
            style: {
              ...paperObject.style,
              ...(menuPaperMinPx != null ? { minWidth: menuPaperMinPx } : {}),
            },
            sx: [
              ...(Array.isArray(paperObject.sx) ? paperObject.sx : paperObject.sx ? [paperObject.sx] : []),
              ...(menuPaperMinPx != null ? [{ minWidth: `${menuPaperMinPx}px` }] : []),
            ],
          };

    return {
      ...merged,
      select: {
        ...selectProps,
        onOpen: (event) => {
          const w = rootRef.current?.offsetWidth ?? 0;
          flushSync(() => setMenuPaperMinPx(w > 0 ? w : undefined));
          userOnOpen?.(event);
        },
        onClose: (event) => {
          setMenuPaperMinPx(undefined);
          userOnClose?.(event);
        },
        MenuProps: {
          ...menuProps,
          slotProps: {
            ...menuProps.slotProps,
            paper: paperSlotMerged,
          },
        },
      },
    };
  }, [baseSlotProps, slotProps, menuPaperMinPx]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const { ref: fieldRef, ...fieldRest } = field;

        const handleRef = (node) => {
          rootRef.current = node;
          fieldRef(node);
        };

        return (
          <TextField
            ref={handleRef}
            {...fieldRest}
            value={other.multiple ? (Array.isArray(fieldRest.value) ? fieldRest.value : []) : (fieldRest.value ?? '')}
            select
            fullWidth
            error={!!error}
            helperText={error?.message ?? helperText}
            slotProps={mergedSlotProps}
            sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
            {...other}
          >
            {children}
          </TextField>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFMultiSelect({
  name,
  chip,
  label,
  options,
  checkbox,
  placeholder,
  slotProps,
  helperText,
  ...other
}) {
  const { control } = useFormContext();

  const labelId = `${name}-multi-select`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const renderLabel = () => (
          <InputLabel htmlFor={labelId} {...slotProps?.inputLabel}>
            {label}
          </InputLabel>
        );

        const renderOptions = () =>
          options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {checkbox && (
                <Checkbox
                  size="small"
                  disableRipple
                  checked={field.value.includes(option.value)}
                  {...slotProps?.checkbox}
                />
              )}

              {option.label}
            </MenuItem>
          ));

        return (
          <FormControl error={!!error} {...other}>
            {label && renderLabel()}

            <Select
              {...field}
              multiple
              displayEmpty={!!placeholder}
              label={label}
              renderValue={(selected) => {
                const selectedItems = options.filter((item) => selected.includes(item.value));

                if (!selectedItems.length && placeholder) {
                  return <Box sx={{ color: 'text.disabled' }}>{placeholder}</Box>;
                }

                if (chip) {
                  return (
                    <Box sx={{ gap: 0.5, display: 'flex', flexWrap: 'wrap' }}>
                      {selectedItems.map((item) => (
                        <Chip
                          key={item.value}
                          size="small"
                          variant="soft"
                          label={item.label}
                          {...slotProps?.chip}
                        />
                      ))}
                    </Box>
                  );
                }

                return selectedItems.map((item) => item.label).join(', ');
              }}
              {...slotProps?.select}
              inputProps={{
                id: labelId,
                ...slotProps?.select?.inputProps,
              }}
            >
              {renderOptions()}
            </Select>

            <HelperText
              {...slotProps?.helperText}
              errorMessage={error?.message}
              helperText={helperText}
            />
          </FormControl>
        );
      }}
    />
  );
}
