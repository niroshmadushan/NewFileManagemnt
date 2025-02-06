import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Typewriter from 'typewriter-effect'; // Install this package for typing animation
import img from './informationliteracy-scaled-removebg-preview.png'
const Adminbrd = () => {
  const theme = useTheme(); // Access the current theme

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px',
        height: '90vh',
      
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
              strings: ['Welcome, Admin!', 'Manage Your Portal Seamlessly!'],
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
          This application is a powerful admin portal that helps you manage your users and control
          their access to critical modules. With this tool, you can:
        </Typography>
        <Box component="ul" sx={{ marginTop: '20px', color: theme.palette.text.secondary }}>
          <li>Create and manage new users.</li>
          <li>Enable or disable user access.</li>
          <li>Manage module permissions effortlessly.</li>
          <li>Monitor and manage network device information.</li>
          <li>Analyze and access network usage metrics.</li>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            marginTop: '20px',
          }}
        >
          This tool is designed to provide detailed insights into network device usage and help
          manage your organization's IT infrastructure effectively.
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
          src={img} // Replace with an actual relevant image URL
          alt="Admin Portal Illustration"
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
