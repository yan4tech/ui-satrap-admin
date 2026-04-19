'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Icon } from '@iconify/react';

const createMock = (n = 12) =>
  Array.from({ length: n }).map((_, i) => ({
    id: i + 1,
    title: `خدمت ${i + 1}`,
    is_active: i % 2 === 0,
  }));

const ProcessDefinitionList = () => {
  const [rows, setRows] = useState(createMock());

  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, row: null });

  // -------- وضعیت --------
  const openStatusDialog = (row) => setStatusDialog({ open: true, row });
  const closeStatusDialog = () => setStatusDialog({ open: false, row: null });

  const confirmToggleStatus = () => {
    setRows((prev) =>
      prev.map((r) => (r.id === statusDialog.row.id ? { ...r, is_active: !r.is_active } : r))
    );
    closeStatusDialog();
  };

  // -------- حذف --------
  const openDeleteDialog = (row) => setDeleteDialog({ open: true, row });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, row: null });

  const confirmDelete = () => {
    setRows((p) => p.filter((r) => r.id !== deleteDialog.row.id));
    closeDeleteDialog();
  };

  const columns = [
    { field: 'title', headerName: 'عنوان', flex: 1 },
    {
      field: 'is_active',
      headerName: 'وضعیت',
      flex: 0.6,
      renderCell: (params) => (
        <Tooltip title="برای تغییر کلیک کنید">
          <Chip
            label={params.value ? 'فعال' : 'غیرفعال'}
            color={params.value ? 'success' : 'error'}
            size="small"
            onClick={() => openStatusDialog(params.row)}
            sx={{ cursor: 'pointer' }}
          />
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'عملیات',
      flex: 0.6,
      renderCell: (params) => (
        <Tooltip title="حذف">
          <IconButton color="error" onClick={() => openDeleteDialog(params.row)}>
            <Icon icon="mdi:delete-outline" width="20" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 2 }}>
          لیست خدمات
        </Typography>

        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />

        {/* دیالوگ حذف */}
        <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
          <DialogTitle>حذف</DialogTitle>
          <DialogContent>
            <DialogContentText>آیا از حذف این مورد مطمئن هستید؟</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog}>انصراف</Button>
            <Button color="error" onClick={confirmDelete}>
              حذف
            </Button>
          </DialogActions>
        </Dialog>

        {/* دیالوگ تغییر وضعیت */}
        <Dialog open={statusDialog.open} onClose={closeStatusDialog}>
          <DialogTitle>تغییر وضعیت</DialogTitle>
          <DialogContent>
            <DialogContentText>
              آیا می‌خواهید این مورد را {statusDialog.row?.is_active ? 'غیرفعال' : 'فعال'} کنید؟
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeStatusDialog}>انصراف</Button>
            <Button color="primary" onClick={confirmToggleStatus}>
              تایید
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProcessDefinitionList;
