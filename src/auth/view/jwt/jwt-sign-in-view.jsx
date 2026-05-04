'use client';

import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Form, Field } from 'src/components/hook-form';

import {
  clearBranchIdForApi,
  getBranchIdStored,
  setBranchIdForApi,
} from 'src/lib/api-branch-header';
import { API_MODE_LABELS_FA, API_MODE_VALUES, getApiMode, setApiMode } from 'src/lib/api-mode';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { submitMobile, submitMobileCode } from '../../context/jwt';

// ----------------------------------------------------------------------

export const SignInSchema = zod.object({
  mobile: zod
    .string()
    .trim()
    .regex(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست.' }),
  code: zod
    .string()
    .optional()
    .refine((value) => !value || /^\d{4,6}$/.test(value), {
      message: 'کد تایید باید بین 4 تا 6 رقم باشد.',
    }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const { checkUserSession } = useAuthContext();

  const [step, setStep] = useState('mobile');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [apiMode, setApiModeState] = useState('mobile');
  const [branchIdInput, setBranchIdInput] = useState('');

  useEffect(() => {
    const m = getApiMode();
    setApiModeState(m);
    if (m === 'branch') {
      setBranchIdInput(getBranchIdStored());
    }
  }, []);

  const handleApiModeChange = (_event, value) => {
    if (value == null) return;
    setApiMode(value);
    setApiModeState(value);
    if (value !== 'branch') {
      clearBranchIdForApi();
      setBranchIdInput('');
    } else {
      setBranchIdInput(getBranchIdStored());
    }
  };

  const defaultValues = {
    mobile: '',
    code: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const mobileValue = watch('mobile');

  const submitLabel = useMemo(() => {
    if (isSubmitting) return step === 'mobile' ? 'در حال ارسال...' : 'در حال تایید...';
    return step === 'mobile' ? 'ارسال کد تایید' : 'تایید و ورود';
  }, [isSubmitting, step]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);

      if (getApiMode() === 'branch' && !getBranchIdStored()) {
        setErrorMessage('برای ورود از حالت شعبه، شناسه شعبه را وارد کنید.');
        return;
      }

      if (step === 'mobile') {
        await submitMobile({ mobile: data.mobile.trim() });
        setSuccessMessage('کد تایید برای شماره شما ارسال شد.');
        setStep('code');
        return;
      }

      if (!data.code) {
        throw new Error('کد تایید را وارد کنید.');
      }

      await submitMobileCode({
        mobile: data.mobile.trim(),
        code: data.code,
      });
      await checkUserSession?.();
      router.push(paths.dashboard.root);
      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          نوع ورود (mode)
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={apiMode}
          onChange={handleApiModeChange}
          disabled={step === 'code'}
          color="primary"
          sx={{
            '& .MuiToggleButton-root': {
              py: 1.1,
              typography: 'body2',
              fontWeight: 600,
            },
          }}
        >
          {API_MODE_VALUES.map((m) => (
            <ToggleButton key={m} value={m}>
              {API_MODE_LABELS_FA[m]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, lineHeight: 1.5 }}>
          قبل از وارد کردن شماره، حالت دسترسی را انتخاب کنید؛ هدر <strong>mode</strong> برای تمام درخواست‌های
          axios و API موتور روی همین مقدار تنظیم می‌شود. با انتخاب «شعبه»، هدر <strong>branch</strong> هم با
          شناسهٔ زیر ارسال می‌شود.
        </Typography>
      </Box>

      {apiMode === 'branch' ? (
        <TextField
          fullWidth
          label="شناسه شعبه"
          placeholder="مثلاً ۱۲"
          value={branchIdInput}
          onChange={(e) => {
            const v = e.target.value;
            setBranchIdInput(v);
            setBranchIdForApi(v);
          }}
          disabled={step === 'code'}
          slotProps={{ inputLabel: { shrink: true } }}
          helperText="این مقدار در هدر branch برای همهٔ درخواست‌ها به سرور و موتور فرستاده می‌شود."
        />
      ) : null}

      <Field.Text
        name="mobile"
        label="شماره موبایل"
        placeholder="09123456789"
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={step === 'code'}
      />

      {step === 'code' && (
        <>
          <Field.Text
            name="code"
            label="کد تایید"
            placeholder="کد 4 تا 6 رقمی"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Link
              component="button"
              type="button"
              variant="body2"
              color="inherit"
              onClick={async () => {
                try {
                  setErrorMessage(null);
                  if (getApiMode() === 'branch' && !getBranchIdStored()) {
                    setErrorMessage('شناسه شعبه را وارد کنید.');
                    return;
                  }
                  await submitMobile({ mobile: mobileValue.trim() });
                  setSuccessMessage('کد تایید مجددا ارسال شد.');
                } catch (error) {
                  const feedbackMessage = getErrorMessage(error);
                  setErrorMessage(feedbackMessage);
                }
              }}
            >
              ارسال دوباره کد
            </Link>

            <Link
              component="button"
              type="button"
              variant="body2"
              color="inherit"
              onClick={() => {
                setStep('mobile');
                setValue('code', '');
                setSuccessMessage(null);
              }}
            >
              تغییر شماره موبایل
            </Link>
          </Stack>
        </>
      )}

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={submitLabel}
      >
        {submitLabel}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="ورود با شماره موبایل"
        description={
          <>
            {`حساب ندارید؟ `}
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              شروع کنید
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
