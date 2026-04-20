'use client';

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  Container,
  Divider,
} from '@mui/material';

import Step0 from './steps/Step0';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Step5 from './steps/Step5';

export default function WorkflowWizard() {
  const methods = useForm({
    resolver: zodResolver(z.object({})),
    mode: 'onChange',
    defaultValues: {
      request_type: 1,
      contract_number: '',
      contract_date: '',
      service_type: 1,
      request_description: '',

      applicant_name: '',
      applicant_family: '',
      national_id: '',
      mobile: '',
      email: '',
      address: '',

      total_amount: 0,
      discount: 0,
      final_amount: 0,
      extra_description: '',
      attachment: '',
    },
  });

  const { handleSubmit, watch, setValue } = methods;

  // ---------------- CALC FINAL AMOUNT ----------------
  const total = watch('total_amount') || 0;
  const discount = watch('discount') || 0;

  useEffect(() => {
    setValue('final_amount', Math.max(0, total - discount));
  }, [total, discount, setValue]);

  // ---------------- SUBMIT ----------------
  const onSubmit = (data) => {
    console.log('FINAL DATA:', data);
    alert('ثبت موفق 🎉');
  };

  return (
    <Container maxWidth="lg">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" mb={3}>
            تکمیل فرم درخواست اولیه توسط متقاضی
          </Typography>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ minHeight: 250, display: 'grid', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    اطلاعات شخصی
                  </Typography>
                  <Step0 />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    اطلاعات نماینده
                  </Typography>
                  <Step1 />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    اطلاعات مکانی
                  </Typography>
                  <Step2 />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    اطلاعات ملک
                  </Typography>
                  <Step3 />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    دسترسی به دیگران
                  </Typography>
                  <Step4 />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    تخصیص کارشناس نقشه برداری
                  </Typography>
                  <Step5 />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button type="submit" variant="contained" color="success">
                  ثبت نهایی
                </Button>
              </Box>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </Container>
  );
}
