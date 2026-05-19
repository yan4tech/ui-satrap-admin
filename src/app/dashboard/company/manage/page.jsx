'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Box, Typography, CircularProgress } from '@mui/material';

import { paths } from 'src/routes/paths';
import { fetchMyCompany } from 'src/lib/company-api';

import { useAuthContext } from 'src/auth/hooks';

import EditCompanyView from '../edit-company-view';

export default function CompanyManagePage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [company, setCompany] = useState(null);
  const [status, setStatus] = useState('loading');

  const userType = String(user?.user_type ?? '').trim();

  useEffect(() => {
    if (userType && userType !== 'company_admin') {
      router.replace(paths.dashboard.root);
    }
  }, [userType, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userType !== 'company_admin') {
        return;
      }
      const data = await fetchMyCompany();
      if (cancelled) return;
      if (!data) {
        setStatus('notfound');
        return;
      }
      setCompany(data);
      setStatus('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [userType]);

  if (userType && userType !== 'company_admin') {
    return null;
  }

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'notfound') {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        شرکت شما یافت نشد.
      </Typography>
    );
  }

  return <EditCompanyView companyData={company} companyAdminMode />;
}
