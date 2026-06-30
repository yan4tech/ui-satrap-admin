import React from 'react';

import { useWatch } from 'react-hook-form';

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



export default function GardenPropertyDetailsStep() {

  const propertyType = useWatch({ name: 'expertVisit.visit_property_type' });



  if (propertyType !== 'garden') {

    return null;

  }



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

          name="expertVisit.visit_garden_tree_count"

          label="تعداد درخت"

          fullWidth

          inputProps={{ inputMode: 'numeric' }}

        />

        <InfoHint text="تعداد تقریبی درختان مشاهده‌شده در باغ در زمان بازدید کارشناس." />

      </Box>



      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>

        <Field.Text name="expertVisit.visit_garden_tree_type" label="نوع درخت" fullWidth />

        <InfoHint text="نوع درختان غالب در باغ (مثلاً پسته، انگور، سیب و ...)." />

      </Box>



      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>

        <Field.Text name="expertVisit.visit_garden_age" label="قدمت باغ" fullWidth />

        <InfoHint text="قدمت یا سن تقریبی باغ مشاهده‌شده در بازدید (مثلاً سال کاشت یا تعداد سال)." />

      </Box>



      <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>

        <Field.Text

          name="expertVisit.visit_garden_description"

          label="توضیحات"

          multiline

          rows={3}

          fullWidth

        />

      </Box>

    </Box>

  );

}

