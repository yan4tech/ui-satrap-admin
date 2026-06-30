'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { Box, Typography, CircularProgress } from '@mui/material';

import axios from 'src/lib/axios';
import { getApiRequestMode } from 'src/lib/api-mode';

import EditBranchView from '../../edit-branch-view';

async function fetchBranchById(rawId) {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id < 1) return null;

  try {
    const res = await axios.get(`/api/membership/branch/${id}`, {
      headers: { mode: getApiRequestMode() },
    });
    return res?.data || null;
  } catch {
    return null;
  }
}

export default function BranchEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id;
  const readOnly = searchParams.get('view') === '1';
  const [branch, setBranch] = useState(null);
  const [status, setStatus] = useState('loading');

  const reloadBranch = async () => {
    setStatus('loading');
    const data = await fetchBranchById(rawId);
    if (!data) {
      setBranch(null);
      setStatus('notfound');
      return;
    }
    setBranch(data);
    setStatus('ready');
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const data = await fetchBranchById(rawId);
      if (cancelled) return;
      if (!data) {
        setBranch(null);
        setStatus('notfound');
        return;
      }
      setBranch(data);
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
        شعبه یافت نشد.
      </Typography>
    );
  }

  return <EditBranchView branchData={branch} readOnly={readOnly} onSaved={reloadBranch} />;
}
