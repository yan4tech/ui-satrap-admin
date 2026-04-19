'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';

import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Field } from 'src/components/hook-form';

// ---------------- STEPS ----------------

const steps = [
  'درخواست خدمت شماره 1',
  'پرداخت',
  'اطلاعات اولیه',
  'تایید توسط شرکت',
  'تایید توسط سازمان ثبت',
  'پرداخت مرحله نقشه برداری',
  'نقشه برداری',
  'تایید نقشه برداری توسط شرکت',
  'تایید نقشه برداری توسط سازمان ثبت',
];

// ---------------- SAMPLE VALIDATION ----------------
// (بعداً می‌تونی برای هر step schema واقعی بزنی)

const stepSchemas = steps.map(() => z.object({}));

// ---------------- COMPONENT ----------------

export default function WorkflowWizard() {
  const [activeStep, setActiveStep] = useState(0);

  const methods = useForm({
    resolver: zodResolver(stepSchemas[activeStep] || z.object({})),
    defaultValues: {
      request: { title: '' },
      payment: { amount: '' },
      info: { description: '' },
    },
  });

  const { handleSubmit, trigger } = methods;

  // -------- NEXT --------
  const handleNext = async () => {
    const valid = await trigger();
    if (!valid) return;

    setActiveStep((prev) => prev + 1);
  };

  // -------- BACK --------
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // -------- SUBMIT --------
  const onSubmit = (data) => {
    console.log('FINAL WORKFLOW DATA:', data);
    alert('فرآیند کامل شد 🎉');
  };

  // -------- STEP CONTENT (فعلاً placeholder) --------
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <Typography>ایجاد درخواست خدمت</Typography>;

      case 1:
        return <Field.Text name="payment.amount" label="پرداخت" type="number" />;

      case 2:
        return <Field.Text name="info.description" label="اطلاعات اولیه" />;

      case 3:
        return <Typography>در انتظار تایید شرکت...</Typography>;

      case 4:
        return <Typography>در انتظار تایید سازمان ثبت...</Typography>;

      case 5:
        return <Typography>شروع نقشه برداری ...</Typography>;

      case 6:
        return <Typography>در حال نقشه برداری...</Typography>;

      case 7:
        return <Typography>تایید نقشه برداری توسط شرکت</Typography>;

      case 8:
        return <Typography>تایید نقشه برداری توسط سازمان ثبت</Typography>;

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Workflow خدمات
        </Typography>

        {/* STEP HEADER */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* FORM */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ minHeight: 120 }}>{renderStep()}</Box>

            {/* ACTIONS */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
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
  );
}
