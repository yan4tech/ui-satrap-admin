'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Container,
} from '@mui/material';

import { stepSchemas } from './schemas';

import Step0 from './steps/Step0';
import Step1 from './steps/Step0';
import Step2 from './steps/Step1';
import Step3 from './steps/Step2';
import Step4 from './steps/Step3';
import Step5 from './steps/Step4';

const steps = [
  'اطلاعات شخصی',
  'اطلاعات نماینده',
  'اطلاعات مکانی',
  'اطلاعات ملک',
  'دسترسی به دیگران',
  'تخصیص کارشناس نقشه برداری',
];

// 🔥 فیلدهای هر step برای validation دقیق
const getStepFields = (step) => {
  switch (step) {
    case 0:
      return [
        'request_type',
        'contract_number',
        'contract_date',
        'service_type',
        'request_description',
      ];

    case 1:
      return ['applicant_name', 'applicant_family', 'national_id', 'mobile', 'email', 'address'];

    case 2:
      return []; // Step3 fields اگر داشتی اضافه کن

    case 3:
      return ['total_amount', 'discount', 'final_amount', 'extra_description'];

    case 4:
      return [];

    case 5:
      return [];
    case 6:
      return [];

    default:
      return [];
  }
};

export default function WorkflowWizard() {
  const [activeStep, setActiveStep] = useState(0);

  const methods = useForm({
    resolver: zodResolver(stepSchemas[activeStep]),
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

  const { handleSubmit, trigger, watch, setValue } = methods;

  // ---------------- CALC FINAL AMOUNT ----------------
  const total = watch('total_amount') || 0;
  const discount = watch('discount') || 0;

  useEffect(() => {
    setValue('final_amount', Math.max(0, total - discount));
  }, [total, discount, setValue]);

  // ---------------- NEXT ----------------
  const handleNext = async () => {
    const fields = getStepFields(activeStep);

    const isValid = await trigger(fields);
    if (!isValid) return;

    setActiveStep((prev) => prev + 1);
  };

  // ---------------- BACK ----------------
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // ---------------- SUBMIT ----------------
  const onSubmit = (data) => {
    console.log('FINAL DATA:', data);
    alert('ثبت موفق 🎉');
  };

  // ---------------- RENDER STEP ----------------
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <Step0 />;
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      case 5:
        return <Step5 />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" mb={3}>
            تکمیل فرم درخواست اولیه توسط متقاضی
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((s) => (
              <Step key={s}>
                <StepLabel>{s}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ minHeight: 250 }}>{renderStep()}</Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  قبلی
                </Button>

                {activeStep < steps.length - 1 ? (
                  <Button variant="contained" onClick={handleNext}>
                    بعدی
                  </Button>
                ) : (
                  <Button type="submit" variant="contained" color="success">
                    پایان
                  </Button>
                )}
              </Box>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </Container>
  );
}
