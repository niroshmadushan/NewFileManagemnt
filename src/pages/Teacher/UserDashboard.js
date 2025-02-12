import React, { useState, useContext, useEffect } from 'react';
import UserSidebar from '../../components/UserSidebar';
import ChangePassword from './ChangePassword';
import Userbrd from './Userbrd';
import { ThemeContext } from '../../context/ThemeContext';
import { IconButton, Modal, TextField, Button, Box, Typography, Snackbar, Alert, Grid, Paper } from '@mui/material';
import { Brightness4, Brightness7, VpnKey as ApiKeyIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Business as BusinessIcon, CardMembership as PlanIcon, Event as EventIcon } from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import { updateApiKey, getUserDetails, logout } from '../../services/userService'; // Import logout function
import { selectData } from '../../services/dataService';
import WarningIcon from '@mui/icons-material/Warning';
import Filemgt from './Filemgt';
import DocumentTracker from './DocumentTracker';
import CourseManagement from './CourseCreation';
import CourseContentManagement from './CourseContentManagement';
import DocumentSharingPage from './DocumentSharingPage ';

// Custom Alert Component for Subscription Expiry
const SubscriptionExpiredAlert = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px solid #ff9800', // Orange border for warning
        }}
      >
        {/* Warning Icon */}
        <WarningIcon
          sx={{
            fontSize: 60,
            color: 'orange', // Orange color for the warning icon
            mb: 2,
          }}
        />

        {/* Title */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'orange' }}>
          Subscription Expired
        </Typography>

        {/* Description */}
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Your subscription plan has expired. Please contact IT Administration or Code Works IT Service department.
        </Typography>

        {/* OK Button */}
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'orange', // Orange background for the button
            color: 'white',
            '&:hover': {
              backgroundColor: '#e65100', // Darker orange on hover
            },
          }}
          onClick={onClose}
        >
          OK
        </Button>
      </Box>
    </Modal>
  );
};



const UserDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [toastShown, setToastShown] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentuser, setCurrentuser] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [activePlan, setActivePlan] = useState('');
  const [remainingDays, setRemainingDays] = useState(0);
  const [totalValidityPeriod, setTotalValidityPeriod] = useState(0);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false); // Track subscription expiry

  // Fetch the current API key when the modal opens
  useEffect(() => {
    if (apiKeyModalOpen) {
      fetchCurrentApiKey();
    }
  }, [apiKeyModalOpen]);

  // Fetch the current API key
  const fetchCurrentApiKey = async () => {
    try {
      const userDetails = await getUserDetails();
      setCurrentuser(userDetails);
      const username = userDetails.data[0]?.email;
      const response = await selectData(`apikey?username=${username}`);
      const currentKey = response.data[0]?.apikey || '';
      setApiKey(currentKey);
    } catch (error) {
      console.error('Error fetching API key:', error);
      toast.error('Failed to fetch API key');
    }
  };

  // Fetch company and subscription details
  useEffect(() => {
    const fetchCompanyAndSubscriptionDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        const companyId = userDetails.company_id;

        // Fetch company name
         const companyResponse = await selectData('company', { id: companyId });
               console.log(companyResponse.data[0])
               setCompanyName(companyResponse.data[0].company_name || 'N/A');

        // Fetch active subscription
         const subscriptionResponse = await selectData('company_subscriptions', { company_id: companyId });
               const activeSubscription = subscriptionResponse.data.find(sub => sub.status === 'active');

        if (activeSubscription) {
          const planResponse = await selectData('subscription_plans', { id: activeSubscription.subscription_plan_id });
                    setActivePlan(planResponse.data[0]?.name || 'N/A');

          // Calculate remaining days
          const remainingDays = calculateRemainingDays(
            activeSubscription.registered_date,
            planResponse.data[0]?.validity_period
          );

          // Set total validity period in days
          const totalValidityDays = planResponse.data[0]?.validity_period * 30; // Assuming 30 days per month
          setTotalValidityPeriod(totalValidityDays);

          setRemainingDays(remainingDays);

          // Check if subscription is expired
          if (remainingDays <= 0) {
            setSubscriptionExpired(true);
          }
        } else {
          setActivePlan('No active plan');
          setRemainingDays(0);
          setTotalValidityPeriod(0);
          setSubscriptionExpired(true); // No active plan means subscription is expired
        }
      } catch (error) {
        console.error('Error fetching company or subscription details:', error);
        toast.error('Failed to fetch company or subscription details');
      }
    };

    fetchCompanyAndSubscriptionDetails();
  }, []);

  // Function to calculate remaining days
  const calculateRemainingDays = (registeredDate, validityPeriod) => {
    const registered = new Date(registeredDate);
    const expirationDate = new Date(registered);
    expirationDate.setMonth(registered.getMonth() + validityPeriod);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);

    const timeDifference = expirationDate - currentDate;
    const daysRemaining = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    return daysRemaining > 0 ? daysRemaining : 0;
  };

  // Function to determine the background color based on remaining days
  const getRemainingDaysColor = () => {
    if (totalValidityPeriod === 0) return 'grey';

    const percentage = (remainingDays / totalValidityPeriod) * 100;

    if (percentage > 50) {
      return 'green';
    } else if (percentage > 25) {
      return 'yellow';
    } else if (percentage > 10) {
      return 'orange';
    } else {
      return 'red';
    }
  };




  // Handle logout when subscription is expired
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login'; // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Show login success toast
  useEffect(() => {
    if (!toastShown) {
      toast.success('Login successful! Welcome to the User dashboard.', {
        style: {
          borderRadius: '8px',
          background: darkMode ? '#333' : '#fff',
          color: darkMode ? '#fff' : '#333',
        },
      });
      setToastShown(true);
    }
  }, [darkMode, toastShown]);

  // Handle navigation triggered by the sidebar
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Toast Notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Sidebar */}
      <UserSidebar onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, padding: '20px', position: 'relative' }}>
        {/* Theme Toggle Button */}
        <IconButton
          onClick={toggleTheme}
          sx={{ position: 'absolute', top: 10, right: 60 }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {/* Company and Subscription Details */}
        <Box sx={{ mb: 2, ml: '15%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none', outline: 'none' }}>
                <BusinessIcon fontSize="small" />
                <Box>
                  <Typography variant="h6" sx={{fontSize:13}} >Company : {companyName}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none', outline: 'none' }}>
                <PlanIcon fontSize="small" />
                <Box>
                  <Typography variant="h6" sx={{fontSize:13}}>Active Plan : {activePlan}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper
                sx={{
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: 'none',
                  color:'white',
                  outline: 'none',
                  backgroundColor: getRemainingDaysColor(),
                }}
              >
                <EventIcon fontSize="small" />
                <Box>
                  <Typography variant="h6" sx={{fontSize:13}}>Remaining {remainingDays} days</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

      

        {/* Confirmation Dialog */}
       

        {/* Success Snackbar */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
            API key updated successfully!
          </Alert>
        </Snackbar>

        {/* Subscription Expired Alert */}
        <SubscriptionExpiredAlert
          open={subscriptionExpired}
          onClose={handleLogout}
        />

        {/* Content Rendering */}
        {currentPage === 'dashboard' && <Userbrd />}
        {currentPage === 'file' && <Filemgt />}
        {currentPage === 'doctrack' && <DocumentTracker />}
        {currentPage === 'courseadd' && <CourseManagement />}
        {currentPage === 'coursecnt' && <CourseContentManagement />}
        {currentPage === 'group' && <DocumentSharingPage />}
       
      </div>
    </div>
  );
};

export default UserDashboard;