import React from 'react';
import { Typography, Box } from '@mui/material';
import { Field } from 'src/components/hook-form';
import ProvinceRegistrationUnitFields from 'src/components/location/ProvinceRegistrationUnitFields';

export default function Page2() {
  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          columnGap: 3,
          rowGap: 2,
        }}
      >
        <ProvinceRegistrationUnitFields useStringValues={false} />

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Field.Text name="postal_code" label="کد پستی" />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              مختصات جغرافیایی یک نقطه از ملک
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
                <Field.Text name="longitude" label="طول جغرافیایی" />
              </Box>

              <Box>
                <Field.Text name="latitude" label="عرض جغرافیایی" />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Field.Text name="property_address" label="نشانی ملک" multiline rows={6} fullWidth />
      </Box>
    </>
  );
}
