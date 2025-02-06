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
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Add, // Icon for the "Add Plan" button
    Edit, // Icon for the edit button
    Business, // Icon for the plan name
    AccessTime, // Icon for the validity period
    MonetizationOn, // Icon for the price
    Search, // Icon for the search bar
  } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { insertData, updateData, selectData } from '../../services/dataService'; // Import dataService functions

const SubscriptionPlanManagement = () => {
    const theme = useTheme();
    const [plans, setPlans] = useState([]);
    const [filteredPlans, setFilteredPlans] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        validity_period: 1,
        price: 0,
        is_active: true,
    });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all subscription plans
    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await selectData('subscription_plans'); // Use selectData from dataService
            setPlans(response.data);
            setFilteredPlans(response.data);
            toast.success('Subscription plans fetched successfully!', {
                    style: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                    },
                  });
        } catch (error) {
            toast.error('Failed to fetch subscription plans.', {
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

    useEffect(() => {
        fetchPlans();
    }, []);

    // Handle search input changes
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = plans.filter(
            (plan) =>
                plan.name.toLowerCase().includes(query) ||
                plan.validity_period.toString().includes(query) ||
                plan.price.toString().includes(query)
        );
        setFilteredPlans(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Open dialog for adding/editing a plan
    const handleOpenDialog = (plan = null) => {
        if (plan) {
            setFormData(plan);
            setCurrentPlan(plan);
        } else {
            setFormData({
                name: '',
                validity_period: 1,
                price: 0,
                is_active: true,
            });
            setCurrentPlan(null);
        }
        setOpenDialog(true);
    };

    // Close dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentPlan(null);
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            if (currentPlan) {
                // Update existing plan
                const updates = {
                    name: formData.name,
                    validity_period: formData.validity_period,
                    price: formData.price,
                    is_active: formData.is_active,
                };
                const where = { id: currentPlan.id };
                await updateData('subscription_plans', updates, where); // Use updateData from dataService
                toast.success('Subscription plan updated successfully!', {
                    style: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                    },
                  });
            } else {
                // Add new plan
                const data = {
                    name: formData.name,
                    validity_period: formData.validity_period,
                    price: formData.price,
                    is_active: formData.is_active,
                };
                await insertData('subscription_plans', data); // Use insertData from dataService
                toast.success('Subscription plan added successfully!', {
                    style: {
                      background: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                    },
                  });
            }
            fetchPlans(); // Refresh the plan list
            handleCloseDialog(); // Close the dialog
        } catch (error) {
            toast.error('Failed to save subscription plan.', {
                style: {
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`,
                },
              });
            console.error('Error:', error);
        }
    };

    // Toggle plan status (active/inactive)
    const handleToggleStatus = async (id, isActive) => {
        try {
            const updates = { is_active: !isActive };
            const where = { id };
            await updateData('subscription_plans', updates, where); // Use updateData from dataService
            toast.success(`Plan ${isActive ? 'deactivated' : 'activated'} successfully!`, {
                style: {
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`,
                },
              });
            fetchPlans(); // Refresh the plan list
        } catch (error) {
            toast.error('Failed to toggle plan status.', {
                style: {
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
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
                    <MonetizationOn sx={{ fontSize: 32, color: 'primary.main' }} />
                    Subscription Plan Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '500px', width: '100%' }}>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearch}
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
                        Add Plan
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
                    {filteredPlans.map((plan) => (
                        <Grid item xs={12} sm={6} md={3} key={plan.id}>
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
                                        <Business sx={{ color: 'primary.main' }} /> {/* Changed icon to Business */}
                                        {plan.name}
                                    </Typography>
                                    <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTime sx={{ color: 'text.secondary' }} />
                                        {plan.validity_period} months
                                    </Typography>
                                    <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MonetizationOn sx={{ color: 'text.secondary' }} />
                                        ${Number(plan.price).toFixed(2)} {/* Fixed: Convert price to a number */}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                                        sx={{
                                            backgroundColor: plan.is_active ? theme.palette.success.main : theme.palette.error.main,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: plan.is_active ? theme.palette.success.dark : theme.palette.error.dark,
                                            },
                                        }}
                                    >
                                        {plan.is_active ? 'Active' : 'Inactive'} {/* Toggle button text */}
                                    </Button>
                                </CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                                    <IconButton onClick={() => handleOpenDialog(plan)}>
                                        <Edit sx={{ color: 'primary.main' }} />
                                    </IconButton>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Add/Edit Plan Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonetizationOn sx={{ color: 'primary.main' }} />
                        {currentPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Plan Name"
                                name="name"
                                value={formData.name}
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
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Validity Period (Months)"
                                name="validity_period"
                                type="number"
                                value={formData.validity_period}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccessTime sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 1, max: 1000 },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Price (USD)"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MonetizationOn sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 0 },
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
                        {currentPlan ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SubscriptionPlanManagement;