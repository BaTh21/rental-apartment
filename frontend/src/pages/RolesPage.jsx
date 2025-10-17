// src/pages/RolePage.jsx
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { getRoles } from '../api';

const RolePage = () => {
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const data = await getRoles();
      return Array.isArray(data) ? data : data.roles || [];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(error?.response?.data?.detail || 'Error loading roles');
    }
  }, [error]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 90, flex: 0.5 },
    { field: 'name', headerName: 'Role Name', width: 200, flex: 1 },
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Box>
        {/* Header Section */}
        <Stack
          direction={downSm ? 'column' : 'row'}
          spacing={2}
          justifyContent="space-between"
          alignItems={downSm ? 'stretch' : 'center'}
          sx={{ mb: 2 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
              textAlign: downSm ? 'center' : 'left',
            }}
          >
            Roles
          </Typography>

          {/* (Optional) Add Role Button for future */}
          <Button
            variant="contained"
            color="primary"
            fullWidth={downSm}
            sx={{
              display: 'none', // hide for now, can enable when adding form
            }}
          >
            Add Role
          </Button>
        </Stack>

        {/* Data Grid Section */}
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Box
            sx={{
              width: '100%',
              overflowX: { xs: 'auto', sm: 'visible' },
            }}
          >
            <DataGrid
              rows={roles?.map((r) => ({ ...r, id: r.id || r._id })) || []}
              columns={columns}
              autoHeight
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-root': { border: 'none' },
                '& .MuiDataGrid-cell': {
                  py: { xs: 0.5, sm: 1 },
                },
                '& .MuiDataGrid-columnHeader': {
                  py: { xs: 0.5, sm: 1 },
                },
                minWidth: { xs: 350, sm: '100%' },
              }}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default RolePage;
