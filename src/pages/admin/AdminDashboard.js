import React, { useState, useContext, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import UserCreate from './UserCreate'; // Import UserCreate
import ChangePassword from './ChangePassword'; // Import ChangePassword
import CompanyManagement from './CompanyManagement';
import Adminbrd from './Adminbrd';
import { ThemeContext } from '../../context/ThemeContext'; // Import ThemeContext
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import SubscriptionPlanManagement from './SubscriptionPlanManagement';
import CompanySubscriptionManagement from './CompanySubscriptionManagement';
import { Business as BusinessIcon, CardMembership as PlanIcon} from '@mui/icons-material'; // Import icons
import { updateApiKey, getUserDetails } from '../../services/userService'; // Import the updateApiKey function
import { selectData } from '../../services/dataService';
import { IconButton, Modal, TextField, Button, Box, Typography, Snackbar, Alert, Grid, Paper } from '@mui/material';
const AdminDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard'); // Tracks the current page
  const { darkMode, toggleTheme } = useContext(ThemeContext); // Access ThemeContext
  const [toastShown, setToastShown] = useState(false); // Tracks if the toast has been shown
  const [companyName, setCompanyName] = useState('');
  const [activePlan, setActivePlan] = useState('');
  useEffect(() => {
    if (!toastShown) {
      // Show the toast and mark it as shown
      toast.success('Login successful! Welcome to the admin dashboard.', {
        style: {
          borderRadius: '8px',
          background: darkMode ? '#333' : '#fff',
          color: darkMode ? '#fff' : '#333',
        },
      });
      setToastShown(true); // Update state to prevent duplicate toasts
    }
  }, [darkMode, toastShown]);
  // useEffect(() => {
  //   const fetchCompanyAndSubscriptionDetails = async () => {
  //     try {
       
  //       const response = await getUserDetails();
       
    
  //       const companyId = response.company_id;
        
    
  //       // Fetch company name
  //       const companyResponse = await selectData('company', { id: companyId });
  //       console.log(companyResponse.data[0])
  //       setCompanyName(companyResponse.data[0].company_name || 'N/A');
    
  //       // Fetch active subscription
  //       const subscriptionResponse = await selectData('company_subscriptions', { company_id: companyId });
  //       const activeSubscription = subscriptionResponse.data.find(sub => sub.status === 'active');
    
  //       if (activeSubscription) {
  //         // Fetch subscription plan details
  //         const planResponse = await selectData('subscription_plans', { id: activeSubscription.subscription_plan_id });
  //         setActivePlan(planResponse.data[0]?.name || 'N/A');
    
  //         // Calculate remaining days using the new function (if needed)
  //         // Example: const remainingDays = calculateRemainingDays(activeSubscription.end_date);
  //       } else {
  //         setActivePlan('No active plan');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching company or subscription details:', {
  //         message: error.message,
  //         stack: error.stack,
  //       });
  //       toast.error('Failed to fetch company or subscription details');
  //     }
  //   };

  //   fetchCompanyAndSubscriptionDetails();
  // }, []);

  // Handle navigation triggered by the sidebar
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Toast Notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Sidebar */}
      <AdminSidebar onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, padding: '20px', position: 'relative' }}>
        {/* Theme Toggle Button */}
        <IconButton
          onClick={toggleTheme}
          sx={{ position: 'absolute', top: 10, right: 10 }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        <Box sx={{ mb: 2, ml: '15%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none', outline: 'none' }}>
                <BusinessIcon fontSize="large" />
                <Box>
                  <Typography variant="h6">Company : CodeWorks PVT LTD</Typography>
                  <Typography variant="body1"></Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none', outline: 'none',width:'300px' }}>
                <PlanIcon fontSize="large" />
                <Box>
                  <Typography variant="h6">Administartion Account</Typography>
                  <Typography variant="body1"></Typography>
                </Box>
              </Paper>
            </Grid>
         
          </Grid>
        </Box>

        {/* Content Rendering */}
        {currentPage === 'dashboard' && <Adminbrd />}
        {currentPage === 'create' && <UserCreate />}
        {currentPage === 'settings' && <ChangePassword />}
        {currentPage === 'Company' && <CompanyManagement />}
        {currentPage === 'Plans' && <SubscriptionPlanManagement />}
        {currentPage === 'Subscription' && <CompanySubscriptionManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;
