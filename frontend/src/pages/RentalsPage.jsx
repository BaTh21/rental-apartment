// src/pages/RentalsPage.jsx
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
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import {
  createRental,
  deleteRental,
  getApartments,
  getRentals,
  getTenants,
  updateRental,
} from '../api';
import { useAuth } from '../auth/AuthProvider';

const rentalSchema = Yup.object({
  apartment_id: Yup.number().required('Apartment is required'),
  tenant_id: Yup.number().required('Tenant is required'),
  start_date: Yup.date().required('Start date is required'),
  end_date: Yup.date()
    .required('End date is required')
    .min(Yup.ref('start_date'), 'End date cannot be before start date'),
  status: Yup.string()
    .oneOf(['active', 'ended', 'cancelled'])
    .required('Status is required'),
  total_amount: Yup.number().positive('Must be positive').required('Total amount is required'),
});

const RentalsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [tenantIdForUser, setTenantIdForUser] = useState('');

  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ['rentals'],
    queryFn: getRentals,
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments'],
    queryFn: getApartments,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  });

  useEffect(() => {
    if (user.role.name === 'Tenant') {
      const tenant = tenants.find((t) => t.user_id === user.id);
      if (tenant) setTenantIdForUser(tenant.id);
    }
  }, [tenants, user]);

  const createMutation = useMutation({
    mutationFn: createRental,
    onSuccess: () => {
      queryClient.invalidateQueries(['rentals']);
      setOpen(false);
      toast.success('Rental created');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error creating rental'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRental(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rentals']);
      setOpen(false);
      setEditingRental(null);
      toast.success('Rental updated');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error updating rental'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRental,
    onSuccess: () => {
      queryClient.invalidateQueries(['rentals']);
      toast.success('Rental deleted');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error deleting rental'),
  });

  const formik = useFormik({
    initialValues: editingRental
      ? {
          apartment_id: editingRental.apartment?.id || '',
          tenant_id: editingRental.tenant?.id || '',
          start_date: editingRental.start_date || '',
          end_date: editingRental.end_date || '',
          status: editingRental.status || 'active',
          total_amount: editingRental.total_amount || '',
        }
      : {
          apartment_id: '',
          tenant_id: user.role.name === 'Tenant' ? tenantIdForUser : '',
          start_date: '',
          end_date: '',
          status: 'active',
          total_amount: '',
        },
    enableReinitialize: true,
    validationSchema: rentalSchema,
    onSubmit: (values) => {
      if (editingRental) {
        updateMutation.mutate({ id: editingRental.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'apartment',
      headerName: 'Apartment',
      width: 150,
      renderCell: (params) => params.row.apartment?.name,
    },
    {
      field: 'tenant',
      headerName: 'Tenant',
      width: 150,
      renderCell: (params) =>
        params.row.tenant?.user?.username || `Tenant ${params.row.tenant_id}`,
    },
    { field: 'start_date', headerName: 'Start Date', width: 130 },
    { field: 'end_date', headerName: 'End Date', width: 130 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      width: 130,
      renderCell: (params) => `$${params.value.toFixed(2)}`,
    },
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
                setEditingRental({
                  ...params.row,
                  apartment_id: params.row.apartment?.id || '',
                  tenant_id: params.row.tenant?.id || '',
                });
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
                if (window.confirm('Delete this rental?')) {
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
        <Typography variant="h4">Rentals</Typography>
        {user.role.name !== 'Tenant' && (
          <Button
            variant="contained"
            onClick={() => {
              setEditingRental(null);
              formik.resetForm();
              setOpen(true);
            }}
          >
            Add Rental
          </Button>
        )}
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={rentals}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={rentalsLoading}
          autoHeight
          getRowId={(row) => row.id}
        />
      </Box>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingRental(null);
          formik.resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingRental ? 'Edit Rental' : 'Create Rental'}</DialogTitle>
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
              disabled={!!editingRental} 
              error={formik.touched.apartment_id && !!formik.errors.apartment_id}
              helperText={formik.touched.apartment_id && formik.errors.apartment_id}
            >
              {apartments.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} ({a.status})
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
                disabled={!!editingRental}
                error={formik.touched.tenant_id && !!formik.errors.tenant_id}
                helperText={formik.touched.tenant_id && formik.errors.tenant_id}
              >
                {tenants.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.user?.username || t.user?.name || `Tenant ${t.id}`}
                  </MenuItem>
                ))}
              </TextField>

            <TextField
              label="Start Date"
              name="start_date"
              type="date"
              value={formik.values.start_date}
              onChange={formik.handleChange}
              error={formik.touched.start_date && !!formik.errors.start_date}
              helperText={formik.touched.start_date && formik.errors.start_date}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="End Date"
              name="end_date"
              type="date"
              value={formik.values.end_date}
              onChange={formik.handleChange}
              error={formik.touched.end_date && !!formik.errors.end_date}
              helperText={formik.touched.end_date && formik.errors.end_date}
              InputLabelProps={{ shrink: true }}
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
              {['active', 'ended', 'cancelled'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Total Amount"
              name="total_amount"
              type="number"
              value={formik.values.total_amount}
              onChange={formik.handleChange}
              error={formik.touched.total_amount && !!formik.errors.total_amount}
              helperText={formik.touched.total_amount && formik.errors.total_amount}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingRental ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default RentalsPage;
