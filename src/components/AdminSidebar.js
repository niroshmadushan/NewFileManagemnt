import React, { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Dashboard,
  PersonAdd,
  Group,
  Settings,
  Logout,
  WarningAmber,
  Business, // Icon for "Company"
  MonetizationOn, // Icon for "Subscription"
  ListAlt, // Icon for "Plans"
  People, // Icon for "User MGT"
  AdminPanelSettings, // Icon for "Settings"
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles'; // Access theme
import { getUserDetails, logout } from '../services/userService'; // Import service methods

const AdminSidebar = ({ onNavigate }) => {
  const theme = useTheme(); // Get the current theme (light/dark)
  const [user, setUser] = useState([]); // State for user details
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for logout confirmation dialog

  // Fetch user details on component mount
useEffect(() => {
  const fetchUserDetails = async () => {
    try {
      
      const response = await getUserDetails();
    

      // Check if the response contains data
     
        setUser(response);
   
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  fetchUserDetails();
}, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout(); // Call the logout API
      localStorage.clear(); // Clear local storage
      window.location.href = '/'; // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <Box
      sx={{
        width: '200px',
        p: 2,
        height: '100vh',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Profile Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar sx={{ bgcolor: theme.palette.primary.main, marginRight: '10px' }}>
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
        </Avatar>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user.full_name || 'Loading...'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email || 'Loading...'}
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <List sx={{ flexGrow: 1 }}>
        {[
          { text: 'Dashboard', icon: <Dashboard />, action: 'dashboard' },
          { text: 'Company MGT', icon: <Business />, action: 'Company' },
          { text: 'Subscription', icon: <MonetizationOn />, action: 'Subscription' },
          { text: 'Plans', icon: <ListAlt />, action: 'Plans' },
          { text: 'User MGT', icon: <People />, action: 'create' },
          { text: 'Settings', icon: <AdminPanelSettings />, action: 'settings' },
        ].map((item, index) => (
          <ListItem
            key={index}
            button
            onClick={() => onNavigate(item.action)}
            sx={{
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              transform: 'scale(1)', // Initial scale
              '&:hover': {
                color: theme.palette.primary.light, // Optional hover color change
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: theme.palette.text.primary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ mr: -2 }} />
          </ListItem>
        ))}
      </List>

      {/* Logout Button */}
      <Box sx={{ padding: '20px', borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          startIcon={<Logout />}
          fullWidth
          variant="contained"
          color="error" // Set button color to red
          onClick={handleOpenDialog} // Open confirmation dialog
          sx={{
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Logout
        </Button>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmber color="warning" /> Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography id="logout-dialog-description">
            Are you sure you want to log out? You will need to log in again to access your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleCloseDialog(); // Close dialog
              handleLogout(); // Proceed with logout
            }}
            color="error"
            variant="contained"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSidebar;