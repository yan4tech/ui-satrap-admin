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
import Page1 from './page1/WorkflowWizard';
import Page2 from './page2/WorkflowWizard';
import PaymentPage from './payment/WorkflowWizard';
import SurveyPaymentPage from './payment-survey/WorkflowWizard';
import RegistrationTrackingPage from './registration-tracking/WorkflowWizard';
import SurveyRegistrationTrackingPage from './survey-registration-tracking/WorkflowWizard';

const steps = [
  'پرداخت',
  'اطلاعات اولیه',
  'تایید توسط سازمان ثبت',
  'پرداخت مرحله نقشه برداری',
  'نقشه برداری',
  'تایید نقشه برداری توسط سازمان ثبت',
];

const stepSchemas = [
  z.object({}),
  z.object({}),
  z.object({
    registrationTracking: z.object({
      sentTrackingCode: z.string().min(1, 'کد رهگیری ارسالی را وارد کنید'),
    }),
  }),
  z.object({}),
  z.object({}),
  z.object({
    surveyRegistrationTracking: z.object({
      sentTrackingCode: z.string().min(1, 'کد رهگیری ارسالی را وارد کنید'),
    }),
  }),
];

export default function WorkflowWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [approvalState, setApprovalState] = useState({});
  const approvalSteps = [2, 5];

  const methods = useForm({
    resolver: zodResolver(stepSchemas[activeStep] || z.object({})),
    defaultValues: {
      request: { title: '' },
      payment: { amount: '' },
      info: { description: '' },
      survey: {
        image_1: null,
        image_2: null,
        image_3: null,
        image_4: null,
        map_file: null,
        description: '',
      },
      registrationTracking: { sentTrackingCode: '' },
      surveyRegistrationTracking: { sentTrackingCode: '' },
    },
  });

  const { handleSubmit, trigger } = methods;

  const handleNext = async () => {
    const valid = await trigger();
    if (!valid) return;

    if (approvalSteps.includes(activeStep)) {
      setApprovalState((prev) => ({ ...prev, [activeStep]: true }));
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = (data) => {
    console.log('FINAL WORKFLOW DATA:', data);
    alert('فرآیند کامل شد 🎉');
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <PaymentPage />;

      case 1:
        return <Page1 />;

      case 2:
        return <RegistrationTrackingPage />;

      case 3:
        return <SurveyPaymentPage />;

      case 4:
        return <Page2 />;

      case 5:
        return <SurveyRegistrationTrackingPage />;

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }}>
          خدمت شماره دو
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ minHeight: 120 }}>{renderStep()}</Box>

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
