// src/pages/ApartmentsPage.jsx
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
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useState } from 'react';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { createApartment, deleteApartment, getApartments, updateApartment } from '../api';
import { useAuth } from '../auth/AuthProvider';

const apartmentSchema = Yup.object({
  name: Yup.string().required('Required'),
  address: Yup.string().required('Required'),
  rent_price: Yup.number().positive('Must be positive').required('Required'),
  description: Yup.string(),
  status: Yup.string().oneOf(['available', 'rented', 'maintenance']).required('Required'),
});

const ApartmentsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState(null);

  const { data: apartments, isLoading } = useQuery({
    queryKey: ['apartments'],
    queryFn: getApartments,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createApartment({ ...data, landlord_id: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['apartments']);
      setOpen(false);
      toast.success('Apartment created');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Error creating apartment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateApartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apartments']);
      setOpen(false);
      setEditingApartment(null);
      toast.success('Apartment updated');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Error updating apartment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['apartments']);
      toast.success('Apartment deleted');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Error deleting apartment'),
  });

  const formik = useFormik({
    initialValues: editingApartment || {
      name: '',
      address: '',
      rent_price: '',
      description: '',
      status: 'available',
    },
    validationSchema: apartmentSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      const payload = { ...values, rent_price: Number(values.rent_price) };
      if (editingApartment) {
        updateMutation.mutate({ id: editingApartment.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'address', headerName: 'Address', width: 180 },
    {
      field: 'rent_price',
      headerName: 'Rent Price',
      width: 140,
      renderCell: (params) => {
        const price = params?.value;
        if (price == null || price === '') return '—';
        const n = Number(price);
        if (Number.isNaN(n)) return '—';
        return `$${n.toFixed(2)}`;
      },
    },
    { field: 'description', headerName: 'Description', width: 220 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'landlord',
      headerName: 'Landlord',
      width: 150,
      renderCell: (params) => params?.row?.landlord?.username ?? '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => {
              setEditingApartment(params.row);
              formik.resetForm();
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
              const ok = window.confirm('Delete this apartment?');
              if (ok) deleteMutation.mutate(params.row.id);
            }}
            variant="outlined"
            size="small"
            sx={{ minWidth: 0, padding: '8px' }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      ),
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
        <Typography variant="h4">Apartments</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditingApartment(null);
            formik.resetForm();
            setOpen(true);
          }}
        >
          Add Apartment
        </Button>
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={apartments || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          getRowId={(row) => row.id}
          pagination
          autoHeight
        />
      </Box>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingApartment(null);
          formik.resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingApartment ? 'Edit Apartment' : 'Create Apartment'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && !!formik.errors.name}
              helperText={formik.touched.name && formik.errors.name}
              fullWidth
            />

            <TextField
              label="Address"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && !!formik.errors.address}
              helperText={formik.touched.address && formik.errors.address}
              fullWidth
            />

            <TextField
              label="Rent Price ($)"
              name="rent_price"
              type="number"
              value={formik.values.rent_price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.rent_price && !!formik.errors.rent_price}
              helperText={formik.touched.rent_price && formik.errors.rent_price}
              fullWidth
            />

            <TextField
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              fullWidth
              multiline
              rows={3}
            />

            <TextField
              select
              label="Status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              fullWidth
            >
              {['available', 'rented', 'maintenance'].map((s) => (
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
              {editingApartment ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ApartmentsPage;
