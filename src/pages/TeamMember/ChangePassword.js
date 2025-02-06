import React, { useState, useContext, useEffect } from 'react';
import { Box, TextField, Button, InputAdornment, IconButton, Typography, Grid } from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Email, Phone, Business, Save } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../context/AuthContext';
import { getUserDetails,logout } from '../../services/userService';
import { updateData } from '../../services/dataService';
import { changePassword,changeUsername } from '../../services/authService'; // Import user service
import { toast, Toaster } from 'react-hot-toast';
const ChangePassword = () => {
  const theme = useTheme(); // Get the current theme
  const { user } = useContext(AuthContext); // Access current user info

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [userInfo, setUserInfo] = useState({
    id:'',
    full_name: '',
    email: '',
    phone_number: '',
    company_name: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Fetch current user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = await getUserDetails();
        console.log(userData.data[0])
        setUserInfo({
          id:userData.data[0].id || '',
          full_name: userData.data[0].full_name || '',
          email: userData.data[0].email || '',
          phone_number: userData.data[0].phone_number || '',
          company_name: userData.data[0].company_name || '',
        });
      } catch (error) {
        console.error('Failed to fetch user details:', error.message);
      }
    };

    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === 'confirmPassword') {
      if (e.target.value !== form.newPassword) {
        setErrorMessage('Passwords do not match!');
      } else {
        setErrorMessage('');
      }
    }
  };

  const handleUserInfoChange = (field, value) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New password and confirmation do not match!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      return;
    }
  
    try {
      // Call the service to change the password
      await changePassword(form.oldPassword, form.newPassword);
      toast.success('Password changed successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error?.error || 'Failed to change the password. Please try again.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    }
  };
  
  const handleUserInfoUpdate = async () => {
    if (!userInfo.full_name || !userInfo.phone_number) {
      
      return;
    }
  
    try {
      // Step 1: Update the username
      // Step 2: Update the user information in the `userinfo` table
      const updates = {
        full_name: userInfo.full_name,
        phone_number: userInfo.phone_number,
      };
      const where = { id: userInfo.id }; // Use userinfo.id as the unique identifier
  
      await updateData('user_accounts', updates, where);
  
      // Success toast message
      toast.success('User information updated successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      await logout();
      window.location.reload(true)
    } catch (error) {
      console.error('Error updating user information:', error);
      toast.error(error?.error || 'Failed to update user information. Please try again.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    }
  };
  
  

  return (
    <Box
      sx={{
        padding: 6
      }}
    >
      {/* Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', mb: 5 }}>
        <Person sx={{ fontSize: '40px', color: theme.palette.primary.main, mr: 2 }} />
        <Typography
          variant="h4"
          sx={{
            textAlign: 'left',
            color: theme.palette.text.primary,
          }}
        >
          User Settings
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          width:'100%',
          backgroundColor: theme.palette.background.default, // Optional for background styling
        }}
      >

        <Grid container spacing={4}>
          {/* Left Side: User Information */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                padding: 3,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ marginBottom: 3, color: theme.palette.text.primary }}
              >
                Current User Information
              </Typography>

              <TextField
                label="Full Name"
                fullWidth
                margin="normal"
                value={userInfo.full_name}
                onChange={(e) => handleUserInfoChange('full_name', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Email"
                fullWidth
                margin="normal"
                value={userInfo.email}
                onChange={(e) => handleUserInfoChange('email', e.target.value)}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Phone Number"
                fullWidth
                margin="normal"
                value={userInfo.phone_number}
                onChange={(e) => handleUserInfoChange('phone_number', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />

              

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end', // Aligns the button to the right
                  marginTop: 3,
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                  onClick={handleUserInfoUpdate}
                >
                  Update Information
                </Button>
              </Box>

            </Box>
          </Grid>

          {/* Right Side: Change Password */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                padding: 3,
                borderRadius: 2,

                position: 'relative',
              }}
            >
              <Typography
                variant="h6"
                sx={{ marginBottom: 3, color: theme.palette.text.primary }}
              >
                Change Password
              </Typography>

              <form onSubmit={handlePasswordSubmit}>
                <TextField
                  label="Old Password"
                  name="oldPassword"
                  type={showPassword.oldPassword ? 'text' : 'password'}
                  value={form.oldPassword}
                  onChange={handleChange}
                  margin="normal"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('oldPassword')}
                        >
                          {showPassword.oldPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="New Password"
                  name="newPassword"
                  type={showPassword.newPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={handleChange}
                  margin="normal"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('newPassword')}
                        >
                          {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                        >
                          {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {errorMessage && (
                  <Typography color="error" sx={{ fontSize: '14px', marginTop: '5px' }}>
                    {errorMessage}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end', // Aligns the button to the right
                    marginTop: 3,
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    }}

                  >
                    Change Password
                  </Button>
                </Box>

              </form>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ChangePassword;
