import React from 'react';
import { Box, IconButton, MenuItem, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

import { VISIT_BOUNDARY_DIRECTIONS } from '../schemas';

const BOUNDARY_TYPE_OPTIONS = [
  { value: 'natural', label: 'حد طبیعی' },
  { value: 'artificial', label: 'حد مصنوعی' },
  { value: 'passage', label: 'معبر' },
  { value: 'neighbor_property', label: 'ملک مجاور' },
  { value: 'river', label: 'رودخانه / آب' },
  { value: 'other', label: 'سایر' },
];

function InfoHint({ text }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" color="info" onClick={handleOpen} sx={{ mt: 1, p: 0.5 }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'info.main',
            color: 'info.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          i
        </Box>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">
          {text}
        </Typography>
      </Popover>
    </>
  );
}

export default function BoundarySidesStep() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {VISIT_BOUNDARY_DIRECTIONS.map((direction, index) => (
        <Box
          key={direction.value}
          sx={{
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} mb={2}>
            ضلع {direction.label}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              columnGap: 3,
              rowGap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Select
                name={`expertVisit.visit_boundary_sides.${index}.boundary_type`}
                label="نوع حد"
                fullWidth
              >
                {BOUNDARY_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <InfoHint text={`نوع حد (طبیعی، مصنوعی، معبر و ...) در سمت ${direction.label} ملک.`} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Field.Text
                name={`expertVisit.visit_boundary_sides.${index}.adjacent_plaque`}
                label="پلاک مجاور"
                fullWidth
              />
              <InfoHint text={`پلاک ثبتی ملک یا قطعه مجاور در سمت ${direction.label}.`} />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.5,
                gridColumn: { xs: 'span 1', md: 'span 2' },
              }}
            >
              <Field.Text
                name={`expertVisit.visit_boundary_sides.${index}.adjacent_title`}
                label="عنوان مجاور"
                fullWidth
              />
              <InfoHint
                text={`عنوان یا مشخصات مجاور (نام مالک، معبر، رودخانه و ...) در سمت ${direction.label}.`}
              />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
