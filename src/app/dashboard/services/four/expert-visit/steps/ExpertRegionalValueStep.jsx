import React from 'react';
import { Box, IconButton, Popover, Typography } from '@mui/material';

import { Field } from 'src/components/hook-form';

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

export default function ExpertRegionalValueStep() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        columnGap: 3,
        rowGap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Field.Text
          name="expertVisit.visit_expert_regional_value"
          label="ارزش منطقه‌ای کارشناس (ریال)"
          fullWidth
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
        <InfoHint text="چون ارزش منطقه‌ای ملک در استعلام ثبت مشخص نشده، کارشناس باید ارزش منطقه‌ای را بر اساس بازدید و مستندات تعیین کند." />
      </Box>
    </Box>
  );
}
