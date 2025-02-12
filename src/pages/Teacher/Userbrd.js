import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Typewriter from 'typewriter-effect'; // Install this package for typing animation
import img from './homepic.png'; // Replace with a relevant image for visitor management

const Adminbrd = () => {
  const theme = useTheme(); // Access the current theme

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px',
        height: '80vh',
      }}
    >
      {/* Left Section: Welcome Message */}
      <Box sx={{ flex: 1, padding: '20px' }}>
        <Typography
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          <Typewriter
            options={{
              strings: [
                'Welcome to the SmartV Platform!',
                'Streamline Visitor Check-ins and Security!',
              ],
              autoStart: true,
              loop: true,
            }}
          />
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            lineHeight: '1.8',
          }}
        >
          This platform is designed to help you manage visitors efficiently, enhance security, and streamline the check-in process. With this tool, you can:
        </Typography>
        <Box component="ul" sx={{ marginTop: '20px', color: theme.palette.text.secondary }}>
          <li>Register and track visitors in real-time.</li>
          <li>Issue visitor badges for secure access.</li>
          <li>Notify hosts about visitor arrivals instantly.</li>
          <li>Maintain a digital log of all visitor entries and exits.</li>
          <li>Enhance security with pre-registration and approval workflows.</li>
          <li>Generate detailed visitor reports for audits and analysis.</li>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            marginTop: '20px',
          }}
        >
          This platform empowers you to create a seamless and secure visitor management experience, ensuring safety and efficiency for your organization.
        </Typography>
      </Box>

      {/* Right Section: Image */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        <img
          src={img} // Replace with an actual relevant image URL for visitor management
          alt="Visitor Management Illustration"
          style={{
            maxWidth: '100%',
            borderRadius: '8px',
          }}
        />
      </Box>
    </Box>
  );
};

export default Adminbrd;