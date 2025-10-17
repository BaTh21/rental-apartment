// src/pages/Dashboard.jsx
import ApartmentIcon from '@mui/icons-material/Apartment';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../auth/AuthProvider';

const glassCardStyle = {
  borderRadius: 2,
  background: 'rgba(17, 57, 152, 0.45)',
  backdropFilter: 'blur(14px) saturate(180%)',
  WebkitBackdropFilter: 'blur(14px) saturate(180%)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: '#f1f1f1',
  transition: 'all 0.25s ease',
  '&:hover': {
    transform: 'translateY(-5px) scale(1.01)',
    background: 'rgba(46, 49, 56, 0.55)',
    boxShadow: '0 16px 50px rgba(0, 0, 0, 0.45)',
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down('sm'));
  const downMd = useMediaQuery(theme.breakpoints.down('md'));

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const [apartments, rentals, payments, maintenance] = await Promise.all([
        api.get('/apartments').then((res) => res.data),
        api.get('/rentals').then((res) => res.data),
        api.get('/payments').then((res) => res.data),
        api.get('/maintenance').then((res) => res.data),
      ]);
      return {
        apartments: apartments?.length ?? 0,
        rentals: rentals?.length ?? 0,
        payments: payments?.length ?? 0,
        maintenance: maintenance?.length ?? 0,
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast.error(error?.response?.data?.detail || 'Error loading dashboard data');
    }
  }, [error]);

  const roleName = user?.role?.name ?? 'User';

  // Responsive avatar sizes and typography
  const avatarSize = downSm ? 36 : downMd ? 44 : 52;
  const subtitleSize = downSm ? '0.75rem' : '0.85rem';
  const valueSize = downSm ? '1.25rem' : '1.5rem';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        sx={{
          borderRadius: 2,
          p: { xs: 1, sm: 2, md: 3 },
          background: 'linear-gradient(145deg, #565658ff 0%, #54555aff 100%)',
          color: '#f3f3f3',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.5rem' },
          }}
        >
          Welcome back{user?.username ? `, ${user.username}` : ''}
        </Typography>

        {isLoading ? (
          <Typography>Loading dashboard...</Typography>
        ) : error ? (
          <Typography color="error">Failed to load data</Typography>
        ) : (
          <Grid container spacing={2}>
            {/* Account Summary */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...glassCardStyle, height: '100%' }}>
                <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={2}
                    >
                      <Avatar
                        sx={{
                          width: avatarSize,
                          height: avatarSize,
                          bgcolor: theme.palette.info.main,
                        }}
                      >
                        <PersonIcon />
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: 'rgba(255,255,255,0.75)', fontSize: subtitleSize }}
                        >
                          Your Account
                        </Typography>
                        <Typography
                          sx={{ fontWeight: 700, fontSize: valueSize, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {user?.username ?? '—'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
                          Role: <strong>{roleName}</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem' }}>
                          Last Login: <strong>Today</strong>
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', mt: 1 }}>
                      {roleName === 'Tenant'
                        ? 'Check your payment history and maintenance requests.'
                        : roleName === 'Landlord'
                        ? 'Monitor rental occupancy and pending maintenance.'
                        : 'Manage users, roles, and system-wide data.'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Apartments (Admin / Landlord) */}
            {(roleName === 'Admin' || roleName === 'Landlord') && (
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ ...glassCardStyle, height: '100%' }}>
                  <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ width: avatarSize, height: avatarSize, bgcolor: theme.palette.primary.main }}>
                        <ApartmentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: subtitleSize }}>
                          Apartments
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: valueSize }}>
                          {stats?.apartments ?? 0}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Rentals */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...glassCardStyle, height: '100%' }}>
                <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ width: avatarSize, height: avatarSize, bgcolor: theme.palette.success.main }}>
                        <HomeWorkIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: subtitleSize }}>
                          Rentals
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: valueSize }}>{stats?.rentals ?? 0}</Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Occupancy Rate: <strong>92%</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Avg. Rent: <strong>$250/month</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Turnover Rate: <strong>18%</strong>
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Payments */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...glassCardStyle, height: '100%' }}>
                <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: avatarSize, height: avatarSize, bgcolor: theme.palette.warning.main }}>
                      <PaymentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: subtitleSize }}>
                        Payments
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: valueSize }}>{stats?.payments ?? 0}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Maintenance */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ ...glassCardStyle, height: '100%' }}>
                <CardContent sx={{ p: { xs: 1.25, sm: 2 } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: avatarSize, height: avatarSize, bgcolor: theme.palette.error.main }}>
                      <BuildCircleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: subtitleSize }}>
                        Maintenance Requests
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: valueSize }}>{stats?.maintenance ?? 0}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Promotional / Wide Card — spans two columns on md and up */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #3a3b40 0%, #57585e 100%)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 10px 36px rgba(0,0,0,0.45)',
                  transition: 'transform 0.25s ease',
                  '&:hover': { transform: 'translateY(-6px) scale(1.01)' },
                  minHeight: 120,
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Quick Actions
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.72)', mt: 0.5 }}>
                        Access commonly used features like add apartment, review maintenance, or generate reports.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: { xs: 1, sm: 0 } }}>
                      {/* Placeholder for quick action buttons (add links/buttons as needed) */}
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.06)',
                          fontSize: '0.9rem',
                        }}
                      >
                        New Apartment
                      </Box>
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.06)',
                          fontSize: '0.9rem',
                        }}
                      >
                        Maintenance
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;
