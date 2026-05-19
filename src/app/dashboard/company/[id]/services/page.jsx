'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Box, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';

/** تخصیص خدمات اکنون در فرم ویرایش شرکت است؛ این مسیر به همان صفحه هدایت می‌شود. */
export default function CompanyServicesRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id;

  useEffect(() => {
    if (companyId) {
      router.replace(paths.dashboard.company.edit(companyId));
    }
  }, [companyId, router]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
