// pages/Login.jsx
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { AnimatedBackground } from 'animated-backgrounds';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loading: authLoading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <AnimatedBackground animationName="particleNetwork" />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ color: '#fff' }}>
            Sign In
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              label="Username or Email"
              margin="normal"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={submitting}
              variant="filled"
              InputProps={{
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  color: '#fff',
                },
              }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }}
            />
            <TextField
              label="Password"
              type="password"
              margin="normal"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              variant="filled"
              InputProps={{
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  color: '#fff',
                },
              }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
