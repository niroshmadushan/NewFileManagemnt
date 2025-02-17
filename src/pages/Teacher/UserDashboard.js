
import React, { useState, useContext, useEffect } from 'react';
import UserSidebar from '../../components/Studentsidebar';
import ChangePassword from './ChangePassword';
import Userbrd from './Userbrd';
import { ThemeContext } from '../../context/ThemeContext';
import { IconButton, Modal, TextField, Button, Box, Typography, Snackbar, Alert, Grid, Paper ,Badge} from '@mui/material';
import { Brightness4, Brightness7, VpnKey as ApiKeyIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Notifications as NotificationsIcon, Business as BusinessIcon, CardMembership as PlanIcon, Event as EventIcon } from '@mui/icons-material';
import { toast, Toaster } from 'react-hot-toast';
import { updateApiKey, getUserDetails, logout } from '../../services/userService'; // Import logout function
import { selectData } from '../../services/dataService';
import WarningIcon from '@mui/icons-material/Warning';
import Filemgt from './Filemgt';
import DocumentTracker from './DocumentTracker';
import CourseManagement from './CourseCreation';
import CourseContentManagement from './CourseContentManagement';
import DocumentSharingPage from './DocumentSharingPage ';
import CommunityPage from './CommunityPage';

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
          border: '2px solid #ff9800',
        }}
      >
        <WarningIcon sx={{ fontSize: 60, color: 'orange', mb: 2 }} />
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'orange' }}>
          Subscription Expired
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Your subscription plan has expired. Please contact IT Administration or Code Works IT Service department.
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'orange',
            color: 'white',
            '&:hover': { backgroundColor: '#e65100' },
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
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAlertIcon, setShowAlertIcon] = useState(false); // State to control alert icon visibility
  const apiUrl = process.env.REACT_APP_MAIN_API; // ✅ Correct
  // Fetch company and subscription details
  useEffect(() => {
    const fetchCompanyAndSubscriptionDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        const companyId = userDetails.company_id;

        // Fetch company name
        const companyResponse = await selectData('company', { id: companyId });
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
         
        } else {
          setActivePlan('No active plan');
          setRemainingDays(0);
          setTotalValidityPeriod(0);
          
        }
      } catch (error) {
        console.error('Error fetching company or subscription details:', error);
        toast.error('Failed to fetch company or subscription details');
      }
    };

    fetchCompanyAndSubscriptionDetails();
  }, []);

  const setAuthHeaders = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
  
    return {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-refresh-token': refreshToken,
      },
      withCredentials: true,
    };
  };
  // Listen for new messages using SSE
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        const userId = userDetails.id;

        // Create EventSource with credentials
        const eventSource = new EventSource(`${apiUrl}:5000/updates?userId=${userId}`, {
          withCredentials: true,
      },setAuthHeaders());

        // Handle incoming messages
        eventSource.onmessage = (event) => {
          const newMessage = JSON.parse(event.data);

          // Show notification for new messages
          if (newMessage.receiver_id === userId && newMessage.status !== 'viewed') {
            setUnreadMessages((prev) => prev + 1); // Increment unread message count
            setShowAlertIcon(true); // Show the alert icon

            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification('New Message', {
                body: `You have a new message`,
                icon: 'path/to/icon.png', // Optional: Add an icon
              });
            }

            // Show in-app toast notification
            toast.success(`Please check Community`, {
              position: 'bottom-right',
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }
        };

        // Handle errors
        eventSource.onerror = (error) => {
          console.error('EventSource failed:', error);
          eventSource.close(); // Close the connection on error
        };

        // Cleanup on component unmount
        return () => {
          eventSource.close();
        };
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
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

  // Handle click on the alert icon
  const handleAlertIconClick = () => {
    setShowAlertIcon(false); // Hide the alert icon
    setUnreadMessages(0); // Reset unread message count
    setCurrentPage('com'); // Redirect to the Community page
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Toast Notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Sidebar */}
      <UserSidebar onNavigate={handleNavigate} unreadMessages={unreadMessages} />

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, padding: '20px', position: 'relative' }}>
        {/* Alert Icon for New Messages */}
        {showAlertIcon && (
          <IconButton
            sx={{ position: 'absolute', top: 20, right: 150, zIndex: 1000 }}
            onClick={handleAlertIconClick}
          >
            <Badge badgeContent={unreadMessages} color="error">
              <NotificationsIcon sx={{ fontSize: 30, color: 'primary.main' }} />
            </Badge>
          </IconButton>
        )}

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
                <BusinessIcon fontSize="medium" />
                <Box>
                  <Typography sx={{ fontSize: 13 }} variant="h6">Company : {companyName}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none', outline: 'none' }}>
                <PlanIcon fontSize="medium" />
                <Box>
                  <Typography sx={{ fontSize: 13 }} variant="h6">Active Plan : {activePlan}</Typography>
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
                  outline: 'none',
                  color: 'white',
                  backgroundColor: getRemainingDaysColor(),
                }}
              >
                <EventIcon fontSize="medium" />
                <Box>
                  <Typography sx={{ fontSize: 13 }} variant="h6">Remaining {remainingDays} days</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Add the footer code here */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,

            color: darkMode ? '#fff' : '#000',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end', // Align content to the right

            zIndex: 1000,
            marginLeft: '240px', // Adjust this value to match the width of your sidebar
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '12px' }}>
              © 2025 University of Sri jayewardenepura S@IT. All rights reserved.
            </Typography>
         
          </Box>
        </Box>

        {/* Subscription Expired Alert */}
        <SubscriptionExpiredAlert
          open={subscriptionExpired}
          onClose={handleLogout}
        />

        {/* Content Rendering */}
         {/* Content Rendering */}
         {currentPage === 'dashboard' && <Userbrd />}
        {currentPage === 'file' && <Filemgt />}
        {currentPage === 'doctrack' && <DocumentTracker />}
        {currentPage === 'courseadd' && <CourseManagement />}
        {currentPage === 'coursecnt' && <CourseContentManagement />}
        {currentPage === 'group' && <DocumentSharingPage />}
        {currentPage === 'com' && <CommunityPage />}
        {currentPage === 'ChangePassword' && <ChangePassword />}
      </div>
    </div>
  );
};

export default UserDashboard;
       

     
  