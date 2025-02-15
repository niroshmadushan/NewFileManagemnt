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
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  Payment,
  Forum,
  AccountCircle,
  ExpandLess,
  ExpandMore,
  Logout,
  WarningAmber,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getUserDetails, logout } from '../services/userService';

const AdminSidebar = ({ onNavigate }) => {
  const theme = useTheme();
  const [user, setUser] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allowedNavItems, setAllowedNavItems] = useState([]);
  const [openPlanMenu, setOpenPlanMenu] = useState(false);
  const [openTaskMenu, setOpenTaskMenu] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await getUserDetails();
        setUser(response);

        const navItems = [
          { text: 'Dashboard', icon: <Dashboard />, action: 'dashboard', permissionKey: null },
          { text: 'Employee Management', icon: <People />, action: 'usermgt', permissionKey: null },
          { text: 'Organization Info', icon: <Business />, action: 'cominfo', permissionKey: null },
          { text: 'Course MGT', icon: <Business />, action: 'courseadd', permissionKey: null },
          { text: 'Payment', icon: <Payment />, action: 'payment', permissionKey: null },
          { text: 'Community', icon: <Forum />, action: 'com', permissionKey: null },
          { text: 'User Info', icon: <AccountCircle />, action: 'ChangePassword', permissionKey: null },
        ];

        const allowedItems = navItems.filter((item) => {
          if (item.permissionKey === null) return true;
          return response.data[0][item.permissionKey] === 1;
        });

        setAllowedNavItems(allowedItems);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.clear();
      window.location.href = '/login';
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

  const togglePlanMenu = () => {
    setOpenPlanMenu(!openPlanMenu);
  };

  const toggleTaskMenu = () => {
    setOpenTaskMenu(!openTaskMenu);
  };

  return (
    <Box
      sx={{
        width: '250px',
        p: 2,
        height: '100vh',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
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

      <List sx={{ flexGrow: 1 }}>
        {allowedNavItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.subItems ? (
              <>
                <ListItem
                  button
                  onClick={item.text === 'Plan' ? togglePlanMenu : toggleTaskMenu}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: theme.palette.text.primary }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ mr: -2 }} />
                  {item.text === 'Plan' ? (
                    openPlanMenu ? <ExpandLess /> : <ExpandMore />
                  ) : (
                    openTaskMenu ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItem>
                <Collapse in={item.text === 'Plan' ? openPlanMenu : openTaskMenu} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem, subIndex) => (
                      <ListItem
                        key={subIndex}
                        button
                        onClick={() => onNavigate(subItem.action)}
                        sx={{
                          pl: 4,
                          cursor: 'pointer',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            color: theme.palette.primary.light,
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: theme.palette.text.primary }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem
                button
                onClick={() => onNavigate(item.action)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: theme.palette.primary.light,
                  },
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.text.primary }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ mr: -2 }} />
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ padding: '20px', borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          startIcon={<Logout />}
          fullWidth
          variant="contained"
          color="error"
          onClick={handleOpenDialog}
          sx={{
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Logout
        </Button>
      </Box>

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
              handleCloseDialog();
              handleLogout();
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