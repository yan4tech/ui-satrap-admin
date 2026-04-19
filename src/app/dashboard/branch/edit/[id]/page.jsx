'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { Box, CircularProgress, Typography } from '@mui/material';

import EditBranchView from '../../edit-branch-view';

/** Mock fetch — align with search list (`searchBranches` mock). Replace with API call. */
async function fetchBranchById(rawId) {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id < 1) return null;

  const i = id - 1;
  const isEven = i % 2 === 0;

  return {
    ID: id,
    title: `شعبه ${id}`,
    province: isEven ? '1' : '2',
    city: isEven ? '10' : '21',
    phone: '021123456',
    is_active: isEven,
    max_users: String(10 + (i % 5)),
    ip: '',
    address: '',
    description: '',
  };
}

export default function BranchEditPage() {
  const params = useParams();
  const rawId = params?.id;
  const [branch, setBranch] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus('loading');
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

  return <EditBranchView branch={branch} />;
}
