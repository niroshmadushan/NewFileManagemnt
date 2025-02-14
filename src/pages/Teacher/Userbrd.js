import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Typewriter from 'typewriter-effect'; // Install this package for typing animation
import img from './picture.png'; // Replace with a relevant image for file management

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
                'Welcome to the SyncUp Platform!',
                'Effortless File Management and Collaboration!'
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
          SyncUp is your ultimate file management solution, designed to help organizations securely store, organize, and share documents effortlessly. With this platform, you can:
        </Typography>
        <Box component="ul" sx={{ marginTop: '20px', color: theme.palette.text.secondary }}>
          <li>Organize and manage files securely across teams.</li>
          <li>Share documents with controlled access and permissions.</li>
          <li>Track file versions and maintain document integrity.</li>
          <li>Enable seamless collaboration with real-time file sharing.</li>
          <li>Ensure compliance with advanced security and audit trails.</li>
          <li>Generate reports on file usage and access analytics.</li>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            marginTop: '20px',
          }}
        >
          SyncUp empowers organizations to take full control of their digital assets, enhancing productivity, security, and efficiency in file management.
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
          src={img} // Replace with an actual relevant image URL for file management
          alt="File Management Illustration"
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