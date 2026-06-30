'use client';



import React from 'react';

import { Box, Card, CardContent, IconButton, Popover, Stack, Typography } from '@mui/material';



import { Field } from 'src/components/hook-form';

import ProvinceRegistrationUnitFields from 'src/components/location/ProvinceRegistrationUnitFields';



const DOCUMENT_DELIVERY_RECIPIENT_FIELDS = [

  {

    name: 'documentDelivery.document_delivery_recipient_name',

    label: 'نام گیرنده سند',

    hint: 'نام و نام خانوادگی فردی که سند صادرشده به او تحویل داده می‌شود.',

  },

  {

    name: 'documentDelivery.document_delivery_recipient_national_id',

    label: 'کد ملی گیرنده سند',

    hint: 'کد ملی گیرنده باید معتبر باشد.',

  },

  {

    name: 'documentDelivery.document_delivery_recipient_mobile',

    label: 'شماره موبایل گیرنده سند',

    hint: 'شماره موبایل باید در سامانه شاهکار به نام گیرنده ثبت شده باشد.',

  },

];



function InfoHint({ text }) {

  const [anchorEl, setAnchorEl] = React.useState(null);



  return (

    <>

      <IconButton size="small" color="info" onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ mt: 1, p: 0.5 }}>

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

        onClose={() => setAnchorEl(null)}

        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}

      >

        <Typography sx={{ p: 1.5, maxWidth: 320 }} variant="body2">

          {text}

        </Typography>

      </Popover>

    </>

  );

}



export default function DocumentDeliveryWorkflowWizard() {

  return (

    <Box

      sx={{

        border: '1px solid',

        borderColor: 'divider',

        borderRadius: 2,

        p: { xs: 2, md: 3 },

        bgcolor: 'background.paper',

      }}

    >

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>

        آدرس پستی تحویل سند

      </Typography>



      <Stack spacing={2}>

        <Card variant="outlined">

          <CardContent>

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>

              مشخصات گیرنده سند

            </Typography>

            <Box

              sx={{

                display: 'grid',

                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },

                columnGap: 3,

                rowGap: 2,

              }}

            >

              {DOCUMENT_DELIVERY_RECIPIENT_FIELDS.map((field) => (

                <Box key={field.name} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>

                  <Field.Text name={field.name} label={field.label} />

                  <InfoHint text={field.hint} />

                </Box>

              ))}

            </Box>

          </CardContent>

        </Card>



        <Card variant="outlined">

          <CardContent>

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>

              نشانی پستی

            </Typography>

            <Box

              sx={{

                display: 'grid',

                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },

                columnGap: 3,

                rowGap: 2,

              }}

            >

              <ProvinceRegistrationUnitFields

                provinceName="documentDelivery.document_delivery_province"

                registrationUnitName="documentDelivery.document_delivery_registration_unit"

                provinceLabel="استان"

                registrationUnitLabel="واحد ثبتی"

                useStringValues={false}

              />



              <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>

                  <Field.Text

                    name="documentDelivery.document_delivery_postal_code"

                    label="کد پستی"

                  />

                  <InfoHint text="کد پستی محل تحویل سند باید ۱۰ رقم باشد." />

                </Box>

              </Box>

            </Box>



            <Box sx={{ mt: 2 }}>

              <Field.Text

                name="documentDelivery.document_delivery_address"

                label="نشانی پستی کامل"

                multiline

                rows={4}

                fullWidth

              />

            </Box>

          </CardContent>

        </Card>

      </Stack>

    </Box>

  );

}

