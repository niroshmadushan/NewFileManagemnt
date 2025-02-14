import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';

const SubscriptionExpiredAlert = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        textAlign: 'center',
      }}>
        <Typography variant="h6" gutterBottom>
          Subscription Expired
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your subscription plan has expired. Please contact IT Administration or Code Works IT Service department.
        </Typography>
        <Button variant="contained" color="primary" onClick={onClose}>
          OK
        </Button>
      </Box>
    </Modal>
  );
};

export default SubscriptionExpiredAlert;