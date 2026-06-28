import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ padding: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h3" gutterBottom>
              HSW Dashboard
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Incident Management Portal
            </Typography>
          </Box>

          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || localError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              disabled={loading}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, py: 1.5 }}
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/forgot-password" underline="hover">
              Forgot Password?
            </Link>
          </Box>

          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Demo credentials:
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Email: admin@hsw-dashboard.local
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Password: admin123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
