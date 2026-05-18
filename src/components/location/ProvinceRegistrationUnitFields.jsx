'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Box, MenuItem } from '@mui/material';

import { Field } from 'src/components/hook-form';
import { fetchProvinces, fetchRegistrationUnitsByProvince } from 'src/lib/location-api';

/**
 * استان + واحد ثبتی (وابسته به استان) — داده از /api/membership/lookup
 */
export default function ProvinceRegistrationUnitFields({
  provinceName = 'province',
  registrationUnitName = 'registration_unit',
  provinceLabel = 'استان',
  registrationUnitLabel = 'واحد ثبتی',
  disabled = false,
  useStringValues = true,
}) {
  const { watch, setValue } = useFormContext();
  const selectedProvince = watch(provinceName);

  const [provinces, setProvinces] = useState([]);
  const [registrationUnits, setRegistrationUnits] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const prevProvinceRef = useRef(undefined);

  const toFieldValue = (id) => (useStringValues ? String(id) : id);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingProvinces(true);
      try {
        const list = await fetchProvinces();
        if (!cancelled) setProvinces(list);
      } catch {
        if (!cancelled) setProvinces([]);
      } finally {
        if (!cancelled) setLoadingProvinces(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setRegistrationUnits([]);
      return undefined;
    }

    const provinceChanged =
      prevProvinceRef.current !== undefined &&
      String(prevProvinceRef.current) !== String(selectedProvince);
    prevProvinceRef.current = selectedProvince;

    let cancelled = false;

    (async () => {
      setLoadingUnits(true);
      if (provinceChanged) {
        setValue(registrationUnitName, useStringValues ? '' : undefined, { shouldValidate: true });
      }
      try {
        const list = await fetchRegistrationUnitsByProvince(selectedProvince);
        if (cancelled) return;
        setRegistrationUnits(list);

        const currentUnit = watch(registrationUnitName);
        if (currentUnit && !list.some((u) => String(u.id) === String(currentUnit))) {
          setValue(registrationUnitName, useStringValues ? '' : undefined, { shouldValidate: true });
        }
      } catch {
        if (!cancelled) setRegistrationUnits([]);
      } finally {
        if (!cancelled) setLoadingUnits(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProvince, registrationUnitName, setValue, useStringValues, watch]);

  return (
    <>
      <Box>
        <Field.Select
          name={provinceName}
          label={provinceLabel}
          placeholder={loadingProvinces ? 'در حال بارگذاری...' : 'انتخاب استان'}
          disabled={disabled || loadingProvinces}
        >
          {provinces.map((p) => (
            <MenuItem key={p.id} value={toFieldValue(p.id)}>
              {p.name}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      <Box>
        <Field.Select
          name={registrationUnitName}
          label={registrationUnitLabel}
          disabled={disabled || !selectedProvince || loadingUnits}
          placeholder={
            !selectedProvince
              ? 'ابتدا استان را انتخاب کنید'
              : loadingUnits
                ? 'در حال بارگذاری...'
                : 'انتخاب واحد ثبتی'
          }
        >
          {registrationUnits.map((u) => (
            <MenuItem key={u.id} value={toFieldValue(u.id)}>
              {u.name}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
    </>
  );
}
