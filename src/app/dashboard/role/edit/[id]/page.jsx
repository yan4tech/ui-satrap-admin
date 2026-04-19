'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Typography } from '@mui/material';

import EditRoleView from '../../edit-role-view';
import { getRole } from 'src/app/dashboard/_lib/access-control-mock';

export default function RoleEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const readOnly = searchParams.get('view') === '1';
  const [row, setRow] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setStatus('loading');
      const data = getRole(rawId);
      if (cancelled) return;
      if (!data) {
        setRow(null);
        setStatus('notfound');
        return;
      }
      setRow(data);
      setStatus('ready');
    };
    run();
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
        نقش یافت نشد.
      </Typography>
    );
  }

  return <EditRoleView role={row} readOnly={readOnly} />;
}
