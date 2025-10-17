// src/pages/TenantsPage.jsx
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
  createTenant,
  deleteTenant,
  getTenants,
  getUsers,
  updateTenant,
} from '../api';

const tenantSchema = Yup.object({
  user_id: Yup.string().required('Required'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[0-9]+$/, 'Phone must be numbers only')
    .test('unique-phone', 'Phone number already exists', function (value) {
      const { tenants } = this.options.context || {};
      return !tenants?.some((t) => t.phone === value && t.id !== this.parent.id);
    }),
  address: Yup.string().required('Required'),
});

const TenantsPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [users, setUsers] = useState([]);

  // ✅ Fetch tenants
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  });

 useEffect(() => {
    getUsers() 
      .then((res) => {
        setUsers(res.data); // the array of users
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err);
      })
  }, []);

  // ✅ Mutations
  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setOpen(false);
      toast.success('Tenant created');
    },
    onError: (err) =>
      toast.error(err?.response?.data?.detail || 'Error creating tenant'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setOpen(false);
      setEditingTenant(null);
      toast.success('Tenant updated');
    },
    onError: (err) =>
      toast.error(err?.response?.data?.detail || 'Error updating tenant'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant deleted');
    },
    onError: (err) =>
      toast.error(err?.response?.data?.detail || 'Error deleting tenant'),
  });

  // ✅ Formik for create/update
  const formik = useFormik({
    initialValues: editingTenant || {
      user_id: '',
      address: '',
      phone: '',
    },
    validationSchema: tenantSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (editingTenant) {
        updateMutation.mutate({ id: editingTenant.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  // ✅ DataGrid columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'user',
      headerName: 'User',
      width: 250,
     renderCell: (params) => {
        const user = params.row.user;
        return user?.username || user?.email || `User ${params.row.user_id}`;
      },
    },
    { field: 'phone', headerName: 'Phone', width: 250 },
    { field: 'address', headerName: 'Address', width: 250 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => {
              setEditingTenant(params.row);
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
              if (window.confirm('Delete this tenant?')) {
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
        <Typography variant="h4">Tenants</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditingTenant(null);
            formik.resetForm();
            setOpen(true);
          }}
        >
          Add Tenant
        </Button>
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={tenants || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={tenantsLoading}
          getRowId={(row) => row.id}
          pagination
        />
      </Box>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingTenant(null);
          formik.resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              select
              label="User"
              name="user_id"
              value={formik.values.user_id}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.user_id && !!formik.errors.user_id}
              helperText={formik.touched.user_id && formik.errors.user_id}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username || user.email || `User ${user.id}`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
                label="Phone"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && !!formik.errors.phone}
                helperText={formik.touched.phone && formik.errors.phone}
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} // numeric keyboard + digits only
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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingTenant ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default TenantsPage;
