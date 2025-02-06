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
    TextField,
    IconButton,
    useTheme,
    CircularProgress,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Add,
    Business,
    MonetizationOn,
    Search,
    AccessTime,
    AttachMoney,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { insertData, updateData, selectData } from '../../services/dataService';

const CompanySubscriptionManagement = () => {
    const theme = useTheme();
    const [companies, setCompanies] = useState([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [companySubscriptions, setCompanySubscriptions] = useState([]);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState([]); // New state for filtered subscriptions
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [renewDialogOpen, setRenewDialogOpen] = useState(false);
    const [subscriptionToRenew, setSubscriptionToRenew] = useState(null);

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

    // Fetch all subscription plans
    const fetchSubscriptionPlans = async () => {
        setLoading(true);
        try {
            const response = await selectData('subscription_plans');
            // Filter out inactive plans (is_active = 0 or false)
            const activePlans = response.data.filter((plan) => plan.is_active === 1 || plan.is_active === true);
            setSubscriptionPlans(activePlans); // Set only active plans
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

    // Fetch all company subscriptions
    const fetchCompanySubscriptions = async () => {
        setLoading(true);
        try {
            const response = await selectData('company_subscriptions');
            setCompanySubscriptions(response.data);
            setFilteredSubscriptions(response.data); // Initialize filtered subscriptions
            toast.success('Company subscriptions fetched successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } catch (error) {
            toast.error('Failed to fetch company subscriptions.', {
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
        fetchCompanies();
        fetchSubscriptionPlans();
        fetchCompanySubscriptions();
    }, []);

    // Handle search input changes
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (query === '') {
            // If the search query is empty, reset to the full list
            setFilteredSubscriptions(companySubscriptions);
        } else {
            // Filter subscriptions based on the company name
            const filtered = companySubscriptions.filter((subscription) => {
                const company = companies.find((c) => c.id === subscription.company_id);
                return company?.company_name.toLowerCase().includes(query);
            });
            setFilteredSubscriptions(filtered);
        }
    };

    // Open dialog for activating a subscription
    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    // Close dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedCompany(null);
        setSelectedPlan(null);
    };

    // Handle form submission (activate subscription)
    const handleActivateSubscription = async () => {
        if (!selectedCompany || !selectedPlan) {
            toast.error('Please select a company and a subscription plan.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            return;
        }

        try {
            // Check if the company already has an active subscription
            const activeSubscription = companySubscriptions.find(
                (sub) => sub.company_id === selectedCompany && sub.status === 'active'
            );

            if (activeSubscription) {
                toast.error('This company already has an active subscription.', {
                    style: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                    },
                });
                return;
            }

            // Insert new subscription
            const data = {
                company_id: selectedCompany,
                subscription_plan_id: selectedPlan,
                status: 'active',
            };
            await insertData('company_subscriptions', data);
            toast.success('Subscription activated successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            fetchCompanySubscriptions(); // Refresh the list
            handleCloseDialog(); // Close the dialog
        } catch (error) {
            toast.error('Failed to activate subscription.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            console.error('Error:', error);
        }
    };

    // Deactivate a subscription
    const handleDeactivateSubscription = async (id) => {
        try {
            const updates = { status: 'inactive' };
            const where = { id };
            await updateData('company_subscriptions', updates, where);
            toast.success('Subscription deactivated successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            fetchCompanySubscriptions(); // Refresh the list
        } catch (error) {
            toast.error('Failed to deactivate subscription.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            console.error('Error:', error);
        }
    };

    // Calculate expiration date for a subscription
    const calculateExpirationDate = (registeredDate, validityPeriod) => {
        const registered = new Date(registeredDate);
        const expirationDate = new Date(registered);
        expirationDate.setMonth(registered.getMonth() + validityPeriod); // Add validity period in months
        return expirationDate.toLocaleDateString(); // Format as a readable date string
    };

    // Calculate remaining days for a subscription
    const calculateRemainingDays = (registeredDate, validityPeriod) => {
        const registered = new Date(registeredDate); // Convert registered date to a Date object
        const expirationDate = new Date(registered);
        expirationDate.setMonth(registered.getMonth() + validityPeriod); // Add validity period in months

        // Set both dates to the start of the day (midnight) to avoid time zone issues
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        expirationDate.setHours(0, 0, 0, 0);

        const timeDifference = expirationDate - currentDate; // Calculate the difference in milliseconds
        const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

        return daysRemaining > 0 ? daysRemaining : 0; // Return 0 if the subscription has expired
    };

    // Open renew dialog
    const handleOpenRenewDialog = (subscription) => {
        setSubscriptionToRenew(subscription);
        setRenewDialogOpen(true);
    };

    // Close renew dialog
    const handleCloseRenewDialog = () => {
        setRenewDialogOpen(false);
        setSubscriptionToRenew(null);
    };

    // Handle subscription renewal
    const handleRenewSubscription = async () => {
        if (!subscriptionToRenew) return;

        try {
            const updates = { registered_date: new Date().toISOString() }; // Update registered date to current date
            const where = { id: subscriptionToRenew.id };
            await updateData('company_subscriptions', updates, where);
            toast.success('Subscription renewed successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            fetchCompanySubscriptions(); // Refresh the list
            handleCloseRenewDialog(); // Close the dialog
        } catch (error) {
            toast.error('Failed to renew subscription.', {
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
        <Box sx={{ padding: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business sx={{ fontSize: 32, color: 'primary.main' }} />
                    Company Subscription
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '600px', width: '100%' }}>
                    <TextField
                        label="Search by Company Name"
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
                        onClick={handleOpenDialog}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            padding: '10px 20px',
                        }}
                    >
                        Activate Subscription
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
                    {filteredSubscriptions.map((subscription) => {
                        const company = companies.find((c) => c.id === subscription.company_id);
                        const plan = subscriptionPlans.find((p) => p.id === subscription.subscription_plan_id);
                        const expirationDate = calculateExpirationDate(subscription.registered_date, plan?.validity_period || 0);
                        const daysRemaining = calculateRemainingDays(subscription.registered_date, plan?.validity_period || 0);

                        return (
                            <Grid item xs={12} sm={6} md={3} key={subscription.id}>
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
                                            {company?.company_name || 'Unknown Company'}
                                        </Typography>
                                        <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MonetizationOn sx={{ color: 'text.secondary' }} />
                                            {plan?.name || 'Unknown Plan'}
                                        </Typography>
                                        <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AttachMoney sx={{ color: 'text.secondary' }} />
                                            Price: ${plan?.price || 'N/A'}
                                        </Typography>
                                        <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTime sx={{ color: 'text.secondary' }} />
                                            Registered: {new Date(subscription.registered_date).toLocaleDateString()}
                                        </Typography>
                                        <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTime sx={{ color: 'text.secondary' }} />
                                            Expiration Date: {expirationDate}
                                        </Typography>
                                        <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccessTime sx={{ color: 'text.secondary' }} />
                                            Days Remaining: {daysRemaining}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography
                                                sx={{
                                                    color: subscription.status === 'active' ? theme.palette.success.main : theme.palette.error.main,
                                                }}
                                            >
                                                {subscription.status === 'active' ? 'Active' : 'Inactive'}
                                            </Typography>
                                            {subscription.status === 'active' && daysRemaining > 0 && (
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => handleDeactivateSubscription(subscription.id)}
                                                >
                                                    Deactivate
                                                </Button>
                                            )}
                                            {subscription.status === 'active' && daysRemaining <= 0 && (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleOpenRenewDialog(subscription)}
                                                >
                                                    Renew
                                                </Button>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            {/* Activate Subscription Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ color: 'primary.main' }} />
                        Activate Subscription
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Select Company</InputLabel>
                                <Select
                                    value={selectedCompany || ''}
                                    onChange={(e) => setSelectedCompany(e.target.value)}
                                    label="Select Company"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <Business />
                                        </InputAdornment>
                                    }
                                >
                                    {companies.map((company) => (
                                        <MenuItem key={company.id} value={company.id}>
                                            {company.company_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Select Subscription Plan</InputLabel>
                                <Select
                                    value={selectedPlan || ''}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    label="Select Subscription Plan"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <MonetizationOn />
                                        </InputAdornment>
                                    }
                                >
                                    {subscriptionPlans.map((plan) => (
                                        <MenuItem key={plan.id} value={plan.id}>
                                            {plan.name} (${plan.price})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleActivateSubscription} variant="contained" color="primary">
                        Activate
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Renew Subscription Dialog */}
            <Dialog open={renewDialogOpen} onClose={handleCloseRenewDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ color: 'primary.main' }} />
                        Renew Subscription
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to renew this subscription? The registered date will be updated to today.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRenewDialog} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleRenewSubscription} variant="contained" color="primary">
                        Renew
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanySubscriptionManagement;