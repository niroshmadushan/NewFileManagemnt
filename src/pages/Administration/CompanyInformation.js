import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    useTheme,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import { Business, Email, Phone, LocationOn, Edit, Save, CheckCircle, Cancel } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';

const CompanyInformation = () => {
    const theme = useTheme();
    const [companyDetails, setCompanyDetails] = useState(null);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [updatedCompanyDetails, setUpdatedCompanyDetails] = useState({
        company_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        address: '',
    });

    const fetchCompanyDetails = async () => {
        setLoading(true);
        try {
            const userDetails = await getUserDetails();
            const companyId = userDetails.company_id;

            // Fetch company details
            const companyResponse = await selectData('company', { id: companyId });
            const companyData = companyResponse.data[0];
            setCompanyDetails(companyData);
            setUpdatedCompanyDetails({
                company_name: companyData.company_name,
                contact_person_email: companyData.contact_person_email,
                contact_person_phone: companyData.contact_person_phone,
                address: companyData.address,
            });

            // Fetch subscription details
            const subscriptionResponse = await selectData('company_subscriptions', { company_id: companyId });
            const subscriptionData = subscriptionResponse.data[0];

            if (subscriptionData) {
                const planResponse = await selectData('subscription_plans', { id: subscriptionData.subscription_plan_id });
                const planData = planResponse.data[0];

                // Determine subscription status
                const isSubscriptionActive = planData.is_active && subscriptionData.status === 'active';
                const subscriptionStatus = isSubscriptionActive ? 'Active' : 'Inactive';

                setSubscriptionDetails({
                    ...subscriptionData,
                    name: planData.name,
                    validity_period: planData.validity_period,
                    price: planData.price,
                    is_active: planData.is_active,
                    status: subscriptionStatus,
                });
            }

            toast.success('Data fetched successfully!');
        } catch (error) {
            toast.error('Failed to fetch data.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyDetails();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatedCompanyDetails({ ...updatedCompanyDetails, [name]: value });
    };

    const handleSaveChanges = async () => {
        try {
            const userDetails = await getUserDetails();
            const companyId = userDetails.company_id;

            await updateData('company', updatedCompanyDetails, { id: companyId });
            setCompanyDetails(updatedCompanyDetails);
            setEditMode(false);
            toast.success('Company information updated successfully!');
        } catch (error) {
            toast.error('Failed to update company information.');
            console.error('Error:', error);
        }
    };

    return (
        <Box sx={{ padding: 6, backgroundColor: theme.palette.background.default }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.primary }}>
                    <Business sx={{ fontSize: 32, color: 'primary.main' }} />
                    Organization Information
                </Typography>
            </Box>

            {/* Loading Spinner */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Company Details Card */}
            {companyDetails && (
                <Card sx={{ mb: 4, boxShadow: 'none', backgroundColor: theme.palette.background.paper, position: 'relative', width:'50%' }}>
                    <CardContent>
                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => setEditMode(!editMode)}
                                sx={{ boxShadow:'none',backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                            >
                                {editMode ? 'Cancel Edit' : 'Edit Information'}
                            </Button>
                        </Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                            ORG Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="ORG Name"
                                    name="company_name"
                                    value={updatedCompanyDetails.company_name}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Business sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Person Email"
                                    name="contact_person_email"
                                    value={updatedCompanyDetails.contact_person_email}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Person Phone"
                                    name="contact_person_phone"
                                    value={updatedCompanyDetails.contact_person_phone}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    name="address"
                                    value={updatedCompanyDetails.address}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOn sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                        </Grid>
                        {editMode && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSaveChanges}
                                    sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                                >
                                    Save Changes
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Subscription Details Card */}
            {subscriptionDetails && (
                <Card sx={{ boxShadow: 'none', backgroundColor: theme.palette.background.paper, width:'50%' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                            Subscription Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Plan Name"
                                    value={subscriptionDetails.name}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Business sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Validity Period (Month)"
                                    value={'Month '+subscriptionDetails.validity_period}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Business sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Price"
                                    value={`$${subscriptionDetails.price}`}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Business sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ backgroundColor: theme.palette.background.paper }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Status"
                                    value={subscriptionDetails.status}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {subscriptionDetails.status === 'Active' ? (
                                                    <CheckCircle sx={{ color: 'success.main' }} />
                                                ) : (
                                                    <Cancel sx={{ color: 'error.main' }} />
                                                )}
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        backgroundColor: theme.palette.background.paper,
                                        '& .MuiInputBase-input': {
                                            color: subscriptionDetails.status === 'Active' ? 'success.main' : 'error.main',
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default CompanyInformation;