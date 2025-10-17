// src/pages/UsersPage.jsx
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import {
  createUser,
  deleteUser,
  getRoles,
  getUsers,
  updateUser
} from '../api';

const userSchema = Yup.object({
  username: Yup.string().min(3).max(50).required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().when('$isEditing', {
    is: false,
    then: (schema) => schema.required('Required').min(8),
    otherwise: (schema) => schema.min(8),
  }),
  role_id: Yup.number().required('Required'),
});

const UsersPage = () => {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getUsers({ skip: page * pageSize, limit: pageSize }),
    keepPreviousData: true,
  });

  const { data: roles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  useEffect(() => {
    if (usersError || rolesError) {
      toast.error(usersError?.response?.data?.detail || rolesError?.response?.data?.detail || 'Error loading data');
    }
  }, [usersError, rolesError]);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpen(false);
      setPage(0);
      toast.success('User created');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error creating user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpen(false);
      setEditingUser(null);
      toast.success('User updated');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error updating user'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error deleting user'),
  });

  const formik = useFormik({
    initialValues: {
      username: editingUser?.username || '',
      email: editingUser?.email || '',
      password: '',
      role_id: editingUser?.role_id ?? '',
    },
    validationSchema: userSchema,
    context: { isEditing: !!editingUser },
    enableReinitialize: true,
    onSubmit: (values) => {
      const { password, ...data } = values;
      if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: password ? values : data });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'username', headerName: 'Username', width: 150, flex: 1, minWidth: 120 },
    { field: 'email', headerName: 'Email', width: 200, flex: 1, minWidth: 160 },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      valueFormatter: (params) => params?.name || 'None',
      flex: 0.7,
      minWidth: 120,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => {
        // on small screens show icon buttons only
        const onEdit = () => {
          setEditingUser(params.row);
          setOpen(true);
          formik.resetForm();
        };
        const onDelete = () => {
          const ok = window.confirm('Delete this user?');
          if (ok) deleteMutation.mutate(params.row.id);
        };

        return downSm ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={onEdit} aria-label="edit">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onDelete} aria-label="delete" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={onEdit}
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, padding: '8px 10px' }}
            >
              <EditIcon fontSize="small" />
            </Button>
            <Button
              color="error"
              onClick={onDelete}
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, padding: '8px 10px' }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Box>
        {/* Header + Add Button */}
        <Stack
          direction={downSm ? 'column' : 'row'}
          spacing={2}
          justifyContent="space-between"
          alignItems={downSm ? 'stretch' : 'center'}
          sx={{ mb: 2 }}
        >
          <Typography variant="h4">Users</Typography>

          <Button
            variant="contained"
            onClick={() => {
              setEditingUser(null);
              setOpen(true);
              formik.resetForm();
            }}
            sx={{ alignSelf: downSm ? 'stretch' : 'auto' }}
            fullWidth={downSm}
          >
            Add User
          </Button>
        </Stack>

        {/* Loading state / DataGrid */}
        {(usersLoading || rolesLoading || !roles?.length) ? (
          <Typography>Loading...</Typography>
        ) : (
          <Box
            sx={{
              width: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              // small screens: allow horizontal scroll if necessary
              overflowX: { xs: 'auto', sm: 'visible' },
            }}
          >
            <DataGrid
              rows={users?.data?.map((u) => ({
                ...u,
                id: u.id || u._id,
                role_id: Number(u.role_id),
              })) || []}
              columns={columns}
              pagination
              pageSizeOptions={[10, 25, 50]}
              paginationMode="server"
              rowCount={users?.total || 0}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              loading={usersLoading || rolesLoading}
              autoHeight
              sx={{
                '& .MuiDataGrid-cell': {
                  py: { xs: 0.5, sm: 1 },
                },
                '& .MuiDataGrid-columnHeader': {
                  py: { xs: 0.5, sm: 1 },
                },
              }}
            />
          </Box>
        )}

        {/* Dialog */}
        <Dialog
          open={open}
          onClose={() => {
            setOpen(false);
            setEditingUser(null);
            formik.resetForm();
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
              <TextField
                label="Username"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                error={formik.touched.username && !!formik.errors.username}
                helperText={formik.touched.username && formik.errors.username}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && !!formik.errors.email}
                helperText={formik.touched.email && formik.errors.email}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && !!formik.errors.password}
                helperText={formik.touched.password && formik.errors.password}
                fullWidth
                margin="normal"
              />
              <TextField
                select
                label="Role"
                name="role_id"
                value={formik.values.role_id}
                onChange={formik.handleChange}
                error={formik.touched.role_id && !!formik.errors.role_id}
                helperText={formik.touched.role_id && formik.errors.role_id}
                fullWidth
                margin="normal"
                disabled={rolesLoading || !roles}
              >
                {roles?.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UsersPage;
