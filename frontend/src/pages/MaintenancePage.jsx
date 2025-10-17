// src/pages/MaintenancePage.jsx
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useState } from 'react';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import {
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  getApartments,
  getMaintenanceRequests,
  getTenants,
  updateMaintenanceRequest,
} from '../api';
import { useAuth } from '../auth/AuthProvider';

// ✅ Validation schema
const maintenanceSchema = Yup.object({
  apartment_id: Yup.number().required('Apartment is required'),
  tenant_id: Yup.number().required('Tenant is required'),
  description: Yup.string().required('Description is required'),
  request_date: Yup.date().required('Request date is required'),
  status: Yup.string()
    .oneOf(['pending', 'in_progress', 'resolved', 'cancelled'])
    .required('Status is required'),
});

const MaintenancePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ✅ Queries
  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['maintenances'],
    queryFn: getMaintenanceRequests,
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments'],
    queryFn: getApartments,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  });

  // ✅ Mutations
  const createMutation = useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenances']);
      toast.success('Maintenance record created');
      setOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.detail || 'Error creating maintenance'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMaintenanceRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenances']);
      toast.success('Maintenance record updated');
      setOpen(false);
      setEditingItem(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.detail || 'Error updating maintenance'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenances']);
      toast.success('Maintenance deleted');
    },
    onError: (err) =>
      toast.error(err.response?.data?.detail || 'Error deleting maintenance'),
  });

  // ✅ Formik setup
  const formik = useFormik({
    initialValues: {
      apartment_id:
        editingItem?.apartment?.id || '',
      tenant_id:
        editingItem?.tenant?.id ||
        (user.role.name === 'Tenant'
          ? tenants.find((t) => t.user_id === user.id)?.id || ''
          : ''),
      description: editingItem?.description || '',
      request_date: editingItem?.request_date || '',
      status: editingItem?.status || 'pending',
    },
    enableReinitialize: true,
    validationSchema: maintenanceSchema,
    onSubmit: (values) => {
      // Ensure tenant_id is correct for tenant users
      const payload = {
        ...values,
        tenant_id:
          user.role.name === 'Tenant'
            ? tenants.find((t) => t.user_id === user.id)?.id
            : values.tenant_id,
      };

      if (!payload.tenant_id) {
        toast.error('Tenant not found');
        return;
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  // ✅ DataGrid Columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'apartment',
      headerName: 'Apartment',
      width: 150,
      renderCell: (params) => params.row.apartment?.name || '-',
    },
    {
      field: 'tenant',
      headerName: 'Tenant',
      width: 150,
      renderCell: (params) =>
        params.row.tenant?.user?.username || `Tenant ${params.row.tenant_id}`,
    },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'request_date', headerName: 'Request Date', width: 150 },
    { field: 'status', headerName: 'Status', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) =>
        user.role.name !== 'Tenant' ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                setEditingItem(params.row);
                setOpen(true);
              }}
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, padding: '8px' }}
            >
              <EditIcon fontSize="small" />
            </Button>
            <Button
              color="error"
              onClick={() => {
                if (window.confirm('Delete this record?')) {
                  deleteMutation.mutate(params.row.id);
                }
              }}
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, padding: '8px' }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        ) : null,
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 2,
          gap: 2,
        }}
      >
        <Typography variant="h4">Maintenance</Typography>
        {user.role.name !== 'Tenant' && (
          <Button
            variant="contained"
            onClick={() => {
              setEditingItem(null);
              formik.resetForm();
              setOpen(true);
            }}
          >
            Add Maintenance
          </Button>
        )}
      </Box>

      {/* DataGrid */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={maintenances}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          autoHeight
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Dialog Form */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingItem(null);
          formik.resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingItem ? 'Edit Maintenance' : 'Create Maintenance'}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              select
              label="Apartment"
              name="apartment_id"
              value={formik.values.apartment_id}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.apartment_id && !!formik.errors.apartment_id}
              helperText={formik.touched.apartment_id && formik.errors.apartment_id}
            >
              {apartments.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tenant"
              name="tenant_id"
              value={formik.values.tenant_id}
              onChange={formik.handleChange}
              fullWidth
              disabled={user.role.name === 'Tenant'}
              error={formik.touched.tenant_id && !!formik.errors.tenant_id}
              helperText={formik.touched.tenant_id && formik.errors.tenant_id}
            >
              {tenants.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.user?.username || `Tenant ${t.id}`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && !!formik.errors.description}
              helperText={formik.touched.description && formik.errors.description}
              fullWidth
            />

            <TextField
              label="Request Date"
              name="request_date"
              type="date"
              value={formik.values.request_date}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              error={formik.touched.request_date && !!formik.errors.request_date}
              helperText={formik.touched.request_date && formik.errors.request_date}
              fullWidth
            />

            <TextField
              select
              label="Status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              fullWidth
            >
              {['pending', 'in_progress', 'resolved', 'cancelled'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MaintenancePage;
