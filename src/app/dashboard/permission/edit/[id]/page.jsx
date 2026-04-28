'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Typography } from '@mui/material';

import EditPermissionView from '../../edit-permission-view';
import axios from 'src/lib/axios';

async function fetchPermissionById(rawId) {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id < 1) return null;

  try {
    const res = await axios.get(`/api/membership/ac/permission/${id}`, {
      headers: { mode: 'company' },
    });
    const item = res?.data?.data ?? res?.data ?? null;
    if (!item) return null;

    return {
      id: item?.ID ?? item?.id,
      title: item?.title ?? '',
      slug: item?.slug ?? '',
      description: item?.description ?? '',
      permission_type: String(item?.permission_type ?? '').trim().toUpperCase(),
      active: Boolean(item?.active),
      api_path: item?.api_path ?? '',
      api_method: String(item?.api_method ?? '').trim().toUpperCase(),
      process: Number(item?.process ?? 0),
    };
  } catch {
    return null;
  }
}

export default function PermissionEditPage() {
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
      const data = await fetchPermissionById(rawId);
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
        دسترسی یافت نشد.
      </Typography>
    );
  }

  return <EditPermissionView permission={row} readOnly={readOnly} />;
}
