'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { Box, Typography, CircularProgress } from '@mui/material';

import { fetchCompanyById } from 'src/lib/company-api';

import EditCompanyView from '../../edit-company-view';

export default function CompanyEditPage() {
  const params = useParams();
  const rawId = params?.id;
  const [company, setCompany] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchCompanyById(rawId);
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
  }, [rawId]);

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
        شرکت یافت نشد.
      </Typography>
    );
  }

  return <EditCompanyView companyData={company} />;
}
