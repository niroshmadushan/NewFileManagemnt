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
  Dashboard as DashboardIcon,
  Folder as FolderIcon, // For File MGT
  Description as DescriptionIcon, // For Doc Track
  School as SchoolIcon, // For Course CNT
  FolderShared as FolderSharedIcon, // For Doc Group
  Groups as GroupsIcon, // For Community
  Lock as LockIcon, // For User Info (Change Password)
  ExitToApp as ExitToAppIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material'; // Updated icons
import { useTheme } from '@mui/material/styles'; // Access theme
import { getUserDetails, logout } from '../services/userService'; // Import service methods

const AdminSidebar = ({ onNavigate }) => {
  const theme = useTheme(); // Get the current theme (light/dark)
  const [user, setUser] = useState({}); // State for user details
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for logout confirmation dialog
  const [allowedNavItems, setAllowedNavItems] = useState([]); // State for allowed navigation items

  // Fetch user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await getUserDetails();
        setUser(response); // Update user details

        // Define navigation items and their corresponding permission keys
        const navItems = [
          { text: 'Dashboard', icon: <DashboardIcon />, action: 'dashboard', permissionKey: null },
          { text: 'File Mangement', icon: <FolderIcon />, action: 'file', permissionKey: null },
          { text: 'Document Flow', icon: <DescriptionIcon />, action: 'doctrack', permissionKey: null },
          { text: 'Course Content', icon: <SchoolIcon />, action: 'coursecnt', permissionKey: null },
          { text: 'Document Group', icon: <FolderSharedIcon />, action: 'group', permissionKey: null },
          { text: 'Document Request', icon: <FolderSharedIcon />, action: 'docreq', permissionKey: null },
          { text: 'Community', icon: <GroupsIcon />, action: 'com', permissionKey: null },
          { text: 'User Info', icon: <LockIcon />, action: 'ChangePassword', permissionKey: null },
        ];

        // Filter navigation items based on user permissions
        const allowedItems = navItems.filter((item) => {
          if (item.permissionKey === null) return true; // Always allow items with no permission key
          return response.data[0][item.permissionKey] === 1; // Check if permission is allowed
        });

        setAllowedNavItems(allowedItems); // Set allowed navigation items
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
      window.location.href = '/app/'; // Redirect to login page
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
        {allowedNavItems.map((item, index) => (
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
          startIcon={<ExitToAppIcon />}
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
          <WarningAmberIcon color="warning" /> Confirm Logout
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