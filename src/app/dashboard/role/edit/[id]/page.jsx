'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { Box, CircularProgress, Typography } from '@mui/material';

import EditRoleView from '../../edit-role-view';
import axios from 'src/lib/axios';

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
      try {
        const res = await axios.get(`/api/membership/ac/role/${rawId}`, {
          headers: { mode: 'company' },
        });
        if (cancelled) return;
        const item = res?.data?.data;
        if (!item) {
          setRow(null);
          setStatus('notfound');
          return;
        }
        const mapped = {
          id: item?.ID ?? item?.id,
          title: item?.title ?? '',
          slug: item?.slug ?? '',
          description: item?.description ?? '',
          active: Boolean(item?.active),
          content: item?.content ?? '',
          permission_ids: Array.isArray(item?.permission_ids)
            ? item.permission_ids.map((id) => Number(id))
            : Array.isArray(item?.permissions)
              ? item.permissions.map((p) => Number(p?.ID ?? p?.id)).filter((id) => !Number.isNaN(id))
              : [],
        };
        setRow(mapped);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setRow(null);
        setStatus('notfound');
      }
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
