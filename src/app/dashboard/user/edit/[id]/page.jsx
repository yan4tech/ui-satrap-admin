'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Typography } from '@mui/material';

import EditUserView from '../../edit-user-view';
import { fetchUserById } from '../../user-api';

export default function UserEditPage() {
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
      const data = await fetchUserById(rawId);
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

  const reloadUser = async () => {
    setStatus('loading');
    const data = await fetchUserById(rawId);
    if (!data) {
      setRow(null);
      setStatus('notfound');
      return;
    }
    setRow(data);
    setStatus('ready');
  };

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
        کاربر یافت نشد.
      </Typography>
    );
  }

  return <EditUserView user={row} readOnly={readOnly} onSaved={reloadUser} />;
}
