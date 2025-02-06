import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Typewriter from 'typewriter-effect'; // Install this package for typing animation
import img from './informationliteracy-scaled-removebg-preview.png';

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
                'Welcome to the Team Portal!',
                'Collaborate, Plan, and Succeed!',
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
          This platform is designed to help your team collaborate effectively, manage tasks, and track progress seamlessly. With this tool, you can:
        </Typography>
        <Box component="ul" sx={{ marginTop: '20px', color: theme.palette.text.secondary }}>
          <li>Create and manage team plans for the month.</li>
          <li>Assign tasks to team members and track their progress.</li>
          <li>Communicate with all team members in real-time.</li>
          <li>Set personal tasks and manage your daily workflow.</li>
          <li>Analyze personal and team performance with detailed analytics.</li>
          <li>Monitor task completion and deadlines effortlessly.</li>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            marginTop: '20px',
          }}
        >
          This platform empowers you to stay organized, collaborate efficiently, and achieve your team goals with ease.
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
          alt="Team Collaboration Illustration"
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