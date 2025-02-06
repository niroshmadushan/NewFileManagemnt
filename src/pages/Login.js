import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Grid,
  Backdrop,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import img from '../pages/AdminCom/homepic.png';
import { toast, Toaster } from 'react-hot-toast';
import { getUserDetails } from '../services/userService';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Form submission loading
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Show loading animation after success
  const { handleLogin } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Perform login
      await handleLogin(credentials.username, credentials.password);

      // Set the logged-in state to trigger the loading animation
      setIsLoggedIn(true);

      // Fetch user details to determine role
      const userDetails = await getUserDetails();
      const role = userDetails.role;

      // Redirect based on role after 3 seconds
      setTimeout(() => {
        switch (role) {
          case 'admin_com':
            navigate('/admin_com');
            break;
          case 'admin':
              navigate('/admin');
              break;
          case 'user':
            navigate('/user');
            break;
          case 'tablet':
            navigate('/tablet');
            break;
          default:
            toast.error('Invalid role. Please contact support.', {
              style: {
                borderRadius: '8px',
                background: darkMode ? '#f44336' : '#e57373',
                color: '#fff',
              },
            });
            break;
        }
        setIsLoggedIn(false);
      }, 3000);
    } catch (err) {
      toast.error('Invalid username or password.', {
        style: {
          borderRadius: '8px',
          background: darkMode ? '#f44336' : '#e57373',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? 2 : 4, // Adjust padding for mobile
      }}
    >
      {/* Backdrop Loading Animation */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoggedIn}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Toaster position="top-right" reverseOrder={false} />

      <Grid container spacing={4} justifyContent="center" alignItems="center">
        {/* Left Content - Hidden on mobile */}
        {!isMobile && (
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                padding: isTablet ? 2 : 4, // Adjust padding for tablet
                borderRadius: '12px',
                background: (theme) => theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <img
                src={img}
                alt="Company Logo"
                style={{ marginBottom: 20, borderRadius:10,maxWidth: isTablet ? '0%' : '70%' }} // Adjust logo size for tablet
              />
              <Typography variant="h4" gutterBottom>
                Welcome to Smart Visitor
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Smart Visitor is your ultimate Visitor Management System. Effortlessly manage visitor check-ins,
                track visitor data, and ensure security with real-time monitoring. SmartV empowers organizations
                to streamline visitor registration, enhance security, and maintain a seamless visitor experience.
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Right Login Form */}
        <Grid item xs={12} md={isMobile ? 12 : 4}>
          <Paper
            sx={{
              padding: isMobile ? 2 : 4, // Adjust padding for mobile
              borderRadius: '12px',
              background: (theme) => theme.palette.background.paper,
              boxShadow: 'none',
              border: '1px solid',
              borderColor: (theme) => theme.palette.primary.main,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={toggleTheme}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>

            <Typography
              variant="h5"
              sx={{
                color: (theme) => theme.palette.text.primary,
                fontSize: isMobile ? '20px' : '24px', // Adjust font size for mobile
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 2,
              }}
            >
              Login to Smart Visitor
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              label="Username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              fullWidth
              variant="outlined"
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ marginBottom: 2 }}
            />
            <FormControlLabel
              control={<Checkbox color="primary" />}
              label="Remember Me"
              sx={{ color: (theme) => theme.palette.text.primary }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 3,
              }}
            >
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} color="inherit" /> : null
                }
                sx={{
                  backgroundColor: (theme) => theme.palette.primary.main,
                  color: (theme) => theme.palette.text.light,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  width: isMobile ? '100%' : '250px', // Full width on mobile
                  marginTop: 3,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.primary.dark,
                  },
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;