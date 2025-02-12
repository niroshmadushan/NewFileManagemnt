import React, { useState, useContext, useEffect } from 'react';
import { Box, TextField, Button, InputAdornment, IconButton, Typography, Grid } from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person, Email, Phone } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../context/AuthContext';
import { logout, updateUserProfile, getUserDetails, updatePassword, updateEmail } from '../../services/userService';
import { toast } from 'react-hot-toast';

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
    id: '',
    full_name: '',
    email: '',
    phone_number: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Fetch current user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = await getUserDetails();
        setUserInfo({
          id: userData.id || '',
          full_name: userData.full_name || '',
          email: userData.email || '',
          phone_number: userData.phone_number || '',
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

    // Validate new password length
    if (form.newPassword.length < 7) {
      toast.error('New password must be at least 7 characters long!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      return;
    }

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
      const userData = await getUserDetails();
      await updatePassword(userData.id, form.oldPassword, form.newPassword);

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

  const handleUpdateProfile = async () => {
    try {
      // Fetch the original user details
      const originalUserData = await getUserDetails();

      // Create an object to hold only the changed fields
      const updatedFields = {};

      if (userInfo.full_name !== originalUserData.full_name) {
        updatedFields.full_name = userInfo.full_name;
      }

      if (userInfo.phone_number !== originalUserData.phone_number) {
        updatedFields.phone_number = userInfo.phone_number;
      }

      if (userInfo.email !== originalUserData.email) {
        updatedFields.email = userInfo.email;
      }

      // If no fields have been changed, show a message and return
      if (Object.keys(updatedFields).length === 0) {
        toast.info('No changes detected!', {
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          },
        });
        return;
      }

      // Update profile information (only changed fields)
      if (updatedFields.full_name || updatedFields.phone_number) {
        await updateUserProfile(userInfo.id, {
          full_name: updatedFields.full_name || originalUserData.full_name,
          phone_number: updatedFields.phone_number || originalUserData.phone_number,
        });
      }

      // Update email (if changed)
      if (updatedFields.email) {
        await updateEmail(userInfo.id, updatedFields.email);
      }

      // Success toast message
      toast.success('Profile updated successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });

      // Logout and reload the page
      window.location.reload(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error?.error || 'Failed to update profile. Please try again.', {
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
        padding: 6,
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
          width: '100%',
          backgroundColor: theme.palette.background.default,
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
                  justifyContent: 'flex-end',
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
                  onClick={handleUpdateProfile}
                >
                  Update Profile
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
                    justifyContent: 'flex-end',
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