'use client';

import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import { Box, Card, Button, Tooltip, IconButton, Typography, CardContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { fetchCompanies } from 'src/lib/company-api';

function normalizeId(row) {
  return row?.ID ?? row?.id;
}

export default function CompanySearchPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCompanies({ limit: 200, offset: 0 });
      setRows(
        data.map((item) => ({
          id: normalizeId(item),
          title: item?.title ?? '-',
          max_branches: item?.max_branches ?? 0,
          is_active: item?.is_active ? 'فعال' : 'غیرفعال',
          branch_count: Array.isArray(item?.branches) ? item.branches.length : '—',
        }))
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { field: 'id', headerName: 'شناسه', width: 90 },
    { field: 'title', headerName: 'عنوان', flex: 1, minWidth: 160 },
    { field: 'max_branches', headerName: 'سقف شعب', width: 110 },
    { field: 'branch_count', headerName: 'شعب فعلی', width: 110 },
    { field: 'is_active', headerName: 'وضعیت', width: 100 },
    {
      field: 'actions',
      headerName: 'عملیات',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="ویرایش">
          <IconButton
            size="small"
            onClick={() => router.push(paths.dashboard.company.edit(params.row.id))}
          >
            <Icon icon="solar:pen-bold" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            لیست شرکت‌ها
          </Typography>
          <Button variant="contained" onClick={() => router.push(paths.dashboard.company.create)}>
            شرکت جدید
          </Button>
        </Box>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </CardContent>
    </Card>
  );
}
