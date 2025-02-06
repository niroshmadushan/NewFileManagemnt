import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  IconButton,
  
  Tooltip,
} from '@mui/material';
import {
  Edit,
  Save,
  LockReset,
  Person,
  Email as EmailIcon,
  Phone,
  AssignmentInd,
  CheckCircle,
  Cancel,
  VpnKey,
  ManageAccounts,
  Add,
  Search,
  People, // Icon for total users
  PersonAdd, // Icon for active users
  PersonOff, // Icon for inact
  // ive users
  Send, // Icon for send email
} from '@mui/icons-material';
import { selectDataProfiles } from '../../services/dataService';
import { logout, updateUserProfile, getUserDetails, resetPassword } from '../../services/userService';
import { createUser } from '../../services/authService';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const AdminUserManagement = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [openUpdateConfirmationDialog, setOpenUpdateConfirmationDialog] = useState(false);
  const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'user',
    is_active: true,
    password_hashed: '@#UserVMS12345@#', // Default password (string)
    pass: false, // Default to false (boolean)
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users in the company
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await getUserDetails();
        const usersData = await selectDataProfiles({ company_id: userData.company_id });
        setUsers(usersData.data);
        setFilteredUsers(usersData.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to fetch users. Please check the console for details.');
      }
    };

    fetchUsers();
  }, []);

  // Handle search by name
  useEffect(() => {
    const filtered = users.filter((user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Calculate total users, active, and inactive counts
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;

  // Handle opening the create user dialog
  const handleOpenCreateUserDialog = () => {
    setOpenCreateUserDialog(true);
  };

  // Handle closing the create user dialog
  const handleCloseCreateUserDialog = () => {
    setOpenCreateUserDialog(false);
    setNewUser({
      full_name: '',
      email: '',
      phone_number: '',
      role: 'user',
      is_active: true,
      password_hashed: '@#UserVMS12345@#', // Reset to default password
      pass: false, // Reset to false
    });
  };

  // Handle creating a new user
  const handleCreateUser = async () => {
    try {
      const userData = await getUserDetails();
      const userToCreate = {
        ...newUser,
        company_id: userData.company_id,
      };

      const response = await createUser(userToCreate);
      toast.success('User created successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });

      // Refresh the user list
      const usersData = await selectDataProfiles({ company_id: userData.company_id });
      setUsers(usersData.data);
      setFilteredUsers(usersData.data);

      handleCloseCreateUserDialog();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user. Please try again.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    }
  };

  // Handle opening the edit dialog
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  // Handle closing the edit dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  // Handle opening the reset password confirmation dialog
  const handleOpenResetPasswordDialog = () => {
    setOpenResetPasswordDialog(true);
  };

  // Handle closing the reset password confirmation dialog
  const handleCloseResetPasswordDialog = () => {
    setOpenResetPasswordDialog(false);
  };

  // Handle resetting the password
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      await resetPassword(selectedUser.id);

      toast.success('Password reset successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });

      handleCloseResetPasswordDialog();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    }
  };

  // Handle opening the update confirmation dialog
  const handleOpenUpdateConfirmationDialog = () => {
    setOpenUpdateConfirmationDialog(true);
  };

  // Handle closing the update confirmation dialog
  const handleCloseUpdateConfirmationDialog = () => {
    setOpenUpdateConfirmationDialog(false);
  };

  // Handle updating user details
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await updateUserProfile(selectedUser.id, {
        full_name: selectedUser.full_name,
        email: selectedUser.email,
        phone_number: selectedUser.phone_number,
        role: selectedUser.role,
        is_active: selectedUser.is_active,
        password_hashed: selectedUser.password_hashed, // Update password_hashed
        pass: selectedUser.pass, // Update pass
      });

      toast.success('User updated successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });

      // Refresh the user list
      const userData = await getUserDetails();
      const usersData = await selectDataProfiles({ company_id: userData.company_id });
      setUsers(usersData.data);
      setFilteredUsers(usersData.data);

      handleCloseDialog();
      handleCloseUpdateConfirmationDialog();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please try again.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    }
  };

  // Handle sending email with user credentials
  const handleSendEmail = (user) => {
    const subject = `${user.full_name} Account Credentials for VMS`;
    const body = `
  Hello ${user.full_name},
  
  Welcome to the Visitor Management System in Your Company!
  
  Your account has been successfully created. Below are your login credentials:
  
  **Username : ${user.email}
  **Password : @#UserVMS12345@#
  
  ### What You Can Do:
  - Book meeting sessions and interviews.
  - View available places and manage your visitors.
  - Access real-time updates and notifications.
  
  ### Next Steps:
  1. Log in to the system using the credentials provided above.
  2. Change your password after your first login for security.
  3. Explore the system and start managing your visitors efficiently.
  
  If you have any questions or need assistance, feel free to contact our support team at support@yourcompany.com.
  
  Best regards,
  The Admin Team
  CodeWorks & Your Company
  `;
  
    // Open default email client
    window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
    // Update the pass field to true
    handleUpdateUserPasswordStatus(user.id);
  };

  // Update the pass field to true
  const handleUpdateUserPasswordStatus = async (userId) => {
    try {
      await updateUserProfile(userId, { pass: true });

      // Refresh the user list
      const userData = await getUserDetails();
      const usersData = await selectDataProfiles({ company_id: userData.company_id });
      setUsers(usersData.data);
      setFilteredUsers(usersData.data);

      toast.success('Password status updated successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    } catch (error) {
      console.error('Error updating password status:', error);
      toast.error('Failed to update password status. Please try again.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      {/* Header with Search Bar and Create User Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ManageAccounts sx={{ fontSize: 40, mr: 2, color: theme.palette.primary.main }} />
          <Typography variant="h4">User Management</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreateUserDialog}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {/* Animated Sticky Box for User Counts with Icons */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'sticky', top: 0, zIndex: 1, marginBottom: 16 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.background.paper,
            padding: 2,
            borderRadius: 2,
            boxShadow: 'none',
            width: 600,
            margin: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6">Total Users: {totalUsers}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd sx={{ color: 'success.main' }} />
            <Typography variant="h6" color="success.main">
              Active: {activeUsers}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOff sx={{ color: 'error.main' }} />
            <Typography variant="h6" color="error.main">
              Inactive: {inactiveUsers}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* User Table */}
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: 'calc(7 * 53px)', // 7 rows * 53px (row height)
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' ? '#757575' : '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#999' : '#555',
          },
          cursor: 'pointer',
          boxShadow: 'none',
          pb: 2,
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Phone Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone_number}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.is_active ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <Cancel sx={{ color: 'error.main' }} />
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit User">
                    <IconButton color="primary" onClick={() => handleEditUser(user)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog
        open={openCreateUserDialog}
        onClose={handleCloseCreateUserDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Add sx={{ mr: 1 }} />
            Create New User
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, color: 'action.active' }} />
            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Phone sx={{ mr: 1, color: 'action.active' }} />
            <TextField
              label="Phone Number"
              fullWidth
              margin="normal"
              value={newUser.phone_number}
              onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssignmentInd sx={{ mr: 1, color: 'action.active' }} />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="admin_com">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircle sx={{ mr: 1, color: 'action.active' }} />
            <Typography>Active:</Typography>
            <Switch
              checked={newUser.is_active}
              onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateUserDialog}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Edit sx={{ mr: 1 }} />
            Edit User
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'action.active' }} />
                <TextField
                  label="User ID"
                  fullWidth
                  margin="normal"
                  value={selectedUser.id}
                  disabled
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ mr: 1, color: 'action.active' }} />
                <TextField
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  value={selectedUser.full_name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, full_name: e.target.value })
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                <TextField
                  label="Email"
                  fullWidth
                  margin="normal"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 1, color: 'action.active' }} />
                <TextField
                  label="Phone Number"
                  fullWidth
                  margin="normal"
                  value={selectedUser.phone_number}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, phone_number: e.target.value })
                  }
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentInd sx={{ mr: 1, color: 'action.active' }} />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                    label="Role"
                  >
                    <MenuItem value="admin_com">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: 'action.active' }} />
                <Typography>Active:</Typography>
                <Switch
                  checked={selectedUser.is_active}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, is_active: e.target.checked })
                  }
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                {!selectedUser.pass && (
                  <Tooltip title="Send Email with Credentials">
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => handleSendEmail(selectedUser)}
                      sx={{ mr: 2 }}
                    >
                      Send Email
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Reset Password">
                  <Button
                    variant="contained"
                    startIcon={<VpnKey />}
                    onClick={handleOpenResetPasswordDialog}
                    sx={{ mr: 2 }}
                  >
                    Reset Password
                  </Button>
                </Tooltip>
                <Tooltip title="Save Changes">
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleOpenUpdateConfirmationDialog}
                  >
                    Save
                  </Button>
                </Tooltip>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={openResetPasswordDialog} onClose={handleCloseResetPasswordDialog}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VpnKey sx={{ mr: 1 }} />
            Reset Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to reset this user's password?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetPasswordDialog}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <Dialog open={openUpdateConfirmationDialog} onClose={handleCloseUpdateConfirmationDialog}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Save sx={{ mr: 1 }} />
            Update User
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to update this user's details?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateConfirmationDialog}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;