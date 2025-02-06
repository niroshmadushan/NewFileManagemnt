import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  useTheme,
  CircularProgress,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Business, Person, Email, Phone, Edit, Add, Save, Close, Password } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, updateData, insertData,selectDataProfiles } from '../../services/dataService';
import {changeUsername, updateUserStatus,createUser } from '../../services/authService';
import { logout, updateUserProfile, getUserDetails, resetPassword } from '../../services/userService';
const UserManagement = () => {
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openAddUserForm, setOpenAddUserForm] = useState(false);
  const [openEditUserForm, setOpenEditUserForm] = useState(false);

  // State for new user form
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'admin',
    modelAccess: [false, false, false, false, false], // Model access permissions
  });

  // State for edit user form
  const [editUserForm, setEditUserForm] = useState({
    id: '',
    fullName: '',
    email: '',
    originalEmail: '', // Store the original email for comparison
    phoneNumber: '',
    role: 'admin',
    modelAccess: [false, false, false, false, false], // Model access permissions
  });

  const modelNames = [
    'List Hosts',
    'Get Host by ID',
    'List Sites',
    'List Devices',
    'Get ISP Metrics',
  ];

  // Fetch all companies
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await selectData('company');
      setCompanies(response.data);
    } catch (error) {
      toast.error('Failed to fetch companies.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for a specific company
  const fetchUsers = async (companyId) => {
    setLoading(true);
    const role = 'admin_com'; // Define the role to filter by

    try {
        // Fetch users with company_id and role filters
        const response = await selectDataProfiles({ 
            company_id: companyId, 
            role: role // Add role to the filter criteria
        });

        // Set the filtered users in the state
        setUsers(response.data);
    } catch (error) {
        toast.error('Failed to fetch users.', {
            style: {
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
            },
        });
    } finally {
        setLoading(false);
    }
};

  // Handle company card click
  const handleCompanyClick = async (company) => {
    setSelectedCompany(company);
    fetchUsers(company.id);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCompany(null);
    setUsers([]); // Clear users when dialog is closed
    setOpenAddUserForm(false);
    setOpenEditUserForm(false);
    setNewUserForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      role: 'user',
      modelAccess: [false, false, false, false, false],
    });
  };

  // Toggle user active status
  const handleToggleStatus = async (userId, isActive) => {
    try {
      const newStatus = !isActive; // Calculate the new status
  
      // Update the user's is_active status in the database
      await updateData('user_accounts', { is_active: newStatus ? 1 : 0 }, { id: userId });
  
      // Update the local state to reflect the change
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, is_active: newStatus } : user
        )
      );
  
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`, {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    } catch (error) {
      toast.error('Failed to toggle user status.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      console.error('Error:', error);
    }
  };

  // Handle new user form input changes
  const handleNewUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserForm({ ...newUserForm, [name]: value });
  };

  // Handle new user form submission
  const handleAddUser = async () => {
    if (!newUserForm.fullName || !newUserForm.email || !newUserForm.phoneNumber) {
      toast.error('Please fill all required fields.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      return;
    }

    // Check if the company has reached the maximum number of user accounts (50)
    if (users.length >= 50) {
      toast.error('Maximum number of user accounts (50) reached for this company.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      return;
    }

    try {

      // Insert into user_accounts table
      const newUser = {
        company_id: selectedCompany.id, // Ensure the user is associated with the selected company
        full_name: newUserForm.fullName,
        email: newUserForm.email,
        phone_number: newUserForm.phoneNumber,
        role: newUserForm.role,
        is_active: true,
        password_hashed:'@SmartVistor12345',
        model_list_hosts: newUserForm.modelAccess[0],
        model_get_host_by_id: newUserForm.modelAccess[1],
        model_list_sites: newUserForm.modelAccess[2],
        model_list_devices: newUserForm.modelAccess[3],
        model_get_isp_metrics: newUserForm.modelAccess[4],
      };

      await createUser(newUser);

      toast.success('User added successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      fetchUsers(selectedCompany.id); // Refresh the user list
      setOpenAddUserForm(false); // Close the add user form
      setNewUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'user',
        modelAccess: [false, false, false, false, false], // Reset model access
      }); // Reset form
    } catch (error) {
      toast.error('Failed to add user.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      console.error('Error:', error);
    }
  };

  // Handle edit user form input changes
  const handleEditUserInputChange = (e) => {
    const { name, value } = e.target;
    setEditUserForm({ ...editUserForm, [name]: value });
  };

  // Handle edit user form submission
  const handleEditUser = async () => {
    try {
      // Check if the email is being updated
      const isEmailUpdated = editUserForm.email !== editUserForm.originalEmail;

      if (isEmailUpdated) {
        // Update the username (email) in the authentication system
        await changeUsername(editUserForm.email, editUserForm.originalEmail);
      }

      // Prepare updates for the user_accounts table
      const updates = {
        full_name: editUserForm.fullName,
        email: editUserForm.email,
        phone_number: editUserForm.phoneNumber,
        role: editUserForm.role,
        model_list_hosts: editUserForm.modelAccess[0],
        model_get_host_by_id: editUserForm.modelAccess[1],
        model_list_sites: editUserForm.modelAccess[2],
        model_list_devices: editUserForm.modelAccess[3],
        model_get_isp_metrics: editUserForm.modelAccess[4],
      };

      const where = { id: editUserForm.id };

      // Update the user in the user_accounts table
      await updateData('user_accounts', updates, where);

      toast.success('User updated successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });

      // Refresh the user list
      fetchUsers(selectedCompany.id);

      // Close the edit form
      setOpenEditUserForm(false);
    } catch (error) {
      toast.error('Failed to update user.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      console.error('Error:', error);
    }
  };

  // Open edit user form
  const handleOpenEditUserForm = (user) => {
    setEditUserForm({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      originalEmail: user.email, // Store the original email
      phoneNumber: user.phone_number,
      role: user.role,
      modelAccess: [
        user.model_list_hosts || false,
        user.model_get_host_by_id || false,
        user.model_list_sites || false,
        user.model_list_devices || false,
        user.model_get_isp_metrics || false,
      ],
    });
    setOpenEditUserForm(true);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <Box sx={{ padding: 6 }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Business sx={{ fontSize: 32, color: 'primary.main' }} />
        User Management
      </Typography>

      {/* Loading Spinner */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Company Cards */}
      <Grid container spacing={3}>
        {companies.map((company) => (
          <Grid item xs={12} sm={6} md={4} key={company.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxShadow: 'none',
                outline: 'none',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
              onClick={() => handleCompanyClick(company)}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ color: 'primary.main' }} />
                  {company.company_name}
                </Typography>
                <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: 'text.secondary' }} />
                  Contact: {company.contact_person_name}
                </Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ color: 'text.secondary' }} />
                  {company.contact_person_email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Management Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ color: 'primary.main' }} />
            {selectedCompany?.company_name} - User Accounts
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Add New User Button */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddUserForm(true)}
            sx={{ mb: 2 }}
          >
            Add New User
          </Button>

          {/* Add New User Form */}
          {openAddUserForm && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Add New User
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={newUserForm.fullName}
                    onChange={handleNewUserInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={newUserForm.email}
                    onChange={handleNewUserInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={newUserForm.phoneNumber}
                    onChange={handleNewUserInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={newUserForm.role}
                      onChange={handleNewUserInputChange}
                      label="Role"
                    >
                      
                      <MenuItem value="admin_com">Compnay Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Model Access Permissions (Only for User Role) */}
                {newUserForm.role === 'user' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Model Access:
                    </Typography>
                    <Grid container spacing={2}>
                      {modelNames.map((name, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={newUserForm.modelAccess[index]}
                                onChange={(e) => {
                                  const newModelAccess = [...newUserForm.modelAccess];
                                  newModelAccess[index] = e.target.checked;
                                  setNewUserForm({ ...newUserForm, modelAccess: newModelAccess });
                                }}
                              />
                            }
                            label={name}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
              </Grid>
              <Button
                variant="contained"
                onClick={handleAddUser}
                sx={{ mt: 2 }}
              >
                Save User
              </Button>
            </Box>
          )}

          {/* User Accounts Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', outline: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone No</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEditUserForm(user)}>
                        <Edit sx={{ color: 'primary.main' }} />
                      </IconButton>
                      {/* <Switch
                        checked={user.is_active}
                        onChange={() => handleToggleStatus(user.id, user.is_active)}
                        color="success"
                      /> */}
               
                                      <Switch
                                        checked={user.is_active}
                                        onChange={(e) =>
                                          handleToggleStatus(user.id,{is_active: e.target.checked})
                                        }
                                        color="primary"
                                        sx={{ ml: 1 }}
                                      />
                                    
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditUserForm} onClose={() => setOpenEditUserForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit sx={{ color: 'primary.main' }} />
            Edit User
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={editUserForm.fullName}
                onChange={handleEditUserInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={editUserForm.email}
                onChange={handleEditUserInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={editUserForm.phoneNumber}
                onChange={handleEditUserInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={editUserForm.role}
                  onChange={handleEditUserInputChange}
                  label="Role"
                >
                  <MenuItem value="admin_com">Compnay Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Model Access Permissions (Only for User Role) */}
            {editUserForm.role === 'user' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Model Access:
                </Typography>
                <Grid container spacing={2}>
                  {modelNames.map((name, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editUserForm.modelAccess[index]}
                            onChange={(e) => {
                              const newModelAccess = [...editUserForm.modelAccess];
                              newModelAccess[index] = e.target.checked;
                              setEditUserForm({ ...editUserForm, modelAccess: newModelAccess });
                            }}
                          />
                        }
                        label={name}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditUserForm(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleEditUser} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;