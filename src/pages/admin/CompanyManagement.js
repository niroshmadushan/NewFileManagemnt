import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  useTheme,
  CircularProgress,
  InputAdornment,
} from '@mui/material';

import { Add, Edit, Business, Person, Email, Phone, LocationOn, Search } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { insertData, updateData, selectData } from '../../services/dataService';

const CompanyManagement = () => {
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(''); // Single state for search

  // Fetch all companies
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await selectData('company');
      setCompanies(response.data);
      setFilteredCompanies(response.data); // Initialize filtered companies
      toast.success('Company Data fetched successfully!', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    } catch (error) {
      toast.error('Failed to fetch companies.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.error.main,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Handle search input changes
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query); // Update the search state
    const filtered = companies.filter((company) =>
      company.company_name.toLowerCase().includes(query) // Filter by company name
    );
    setFilteredCompanies(filtered);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Open dialog for adding/editing a company
  const handleOpenDialog = (company = null) => {
    if (company) {
      setFormData(company);
      setCurrentCompany(company);
    } else {
      setFormData({
        company_name: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        address: '',
      });
      setCurrentCompany(null);
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCompany(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (currentCompany) {
        // Update existing company
        const updates = {
          company_name: formData.company_name,
          contact_person_name: formData.contact_person_name,
          contact_person_email: formData.contact_person_email,
          contact_person_phone: formData.contact_person_phone,
          address: formData.address,
        };
        const where = { id: currentCompany.id };
        await updateData('company', updates, where);

        toast.success('Company updated successfully!', {
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          },
        });
      } else {
        // Add new company
        const data = {
          company_name: formData.company_name,
          contact_person_name: formData.contact_person_name,
          contact_person_email: formData.contact_person_email,
          contact_person_phone: formData.contact_person_phone,
          address: formData.address,
        };
        await insertData('company', data);

        toast.success('Company added successfully!', {
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          },
        });
      }

      fetchCompanies(); // Refresh the company list
      handleCloseDialog(); // Close the dialog
    } catch (error) {
      toast.error('Failed to save company.', {
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.error.main,
          border: `1px solid ${theme.palette.divider}`,
        },
      });
      console.error('Error:', error);
    }
  };

  return (
    <Box sx={{ padding: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business sx={{ fontSize: 32, color: 'primary.main' }} />
          Company Management
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '500px', width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1px' }}>
            <TextField
              label="Search by Company Name"
              variant="outlined"
              size="small"
              value={search}
              onChange={handleSearch} // Bind to handleSearch
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton>
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ width: '300px' }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              padding: '10px 20px',
            }}
          >
            Add Company
          </Button>
        </Box>
      </Box>

      {/* Loading Spinner */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Scrollable Grid Area */}
      <Box sx={{ overflowX: 'auto', maxHeight: '70vh', paddingBottom: 2 }}>
        <Grid container spacing={3} sx={{ width: '100%', minWidth: '1200px' }}>
          {filteredCompanies.slice(0, 12).map((company) => (
            <Grid item xs={12} sm={6} md={3} key={company.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  outline: 'none',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business sx={{ color: 'primary.main' }} />
                    {company.company_name}
                  </Typography>
                  <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ color: 'text.secondary' }} />
                    {company.contact_person_name}
                  </Typography>
                  <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ color: 'text.secondary' }} />
                    {company.contact_person_email}
                  </Typography>
                  <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ color: 'text.secondary' }} />
                    {company.contact_person_phone}
                  </Typography>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ color: 'text.secondary' }} />
                    {company.address}
                  </Typography>
                </CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                  <IconButton onClick={() => handleOpenDialog(company)}>
                    <Edit sx={{ color: 'primary.main' }} />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Add/Edit Company Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ color: 'primary.main' }} />
            {currentCompany ? 'Edit Company' : 'Add Company'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Company Name Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Contact Person Name Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Person Name"
                name="contact_person_name"
                value={formData.contact_person_name}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Contact Person Email Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Person Email"
                name="contact_person_email"
                value={formData.contact_person_email}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Contact Person Phone Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Person Phone"
                name="contact_person_phone"
                value={formData.contact_person_phone}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Address Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentCompany ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyManagement;