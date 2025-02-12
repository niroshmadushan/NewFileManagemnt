import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Event,
    Person,
    Place,
    AccessTime,
    Delete,
    Warning,
    Email,
} from '@mui/icons-material';
import { selectData } from '../../../services/dataService'; // Import the selectData function
import QRCode from 'qrcode.react'; // Import QRCode library

const InvitationCard = ({ invitation, darkMode, onCardClick, onDelete }) => {
    const [placeName, setPlaceName] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete modal
    const [isEmailSent, setIsEmailSent] = useState(false); // State for email sending status
    const [emailError, setEmailError] = useState(false); // State for email sending error

    // Fetch place name when the component mounts or when the invitation prop changes
    useEffect(() => {
        const fetchPlaceName = async () => {
            try {
                // Fetch place details using the invitation's place_id
                const response = await selectData('places', { place_id: invitation.place_id });
                if (response && response.data && response.data.length > 0) {
                    setPlaceName(response.data[0].place_name); // Set the place name
                }
            } catch (error) {
                console.error('Failed to fetch place details:', error);
                setPlaceName('Unknown Place'); // Fallback in case of an error
            }
        };

        fetchPlaceName();
    }, [invitation.place_id]); // Re-run effect if place_id changes

    // Handle delete confirmation
    const handleDeleteConfirmation = () => {
        setIsDeleteModalOpen(true); // Open the confirmation modal
    };

    // Handle delete action
    const handleDelete = () => {
        onDelete(invitation.id); // Call the onDelete function
        setIsDeleteModalOpen(false); // Close the modal
    };

    // Handle send email action
   

    return (
        <>
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                    boxShadow: 'none',
                    outline: 'none',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        cursor: 'pointer',
                    },
                }}
                onClick={onCardClick}
            >
                <CardContent>
                    {/* Event Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Event sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">{invitation.id}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Event sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">{invitation.name}</Typography>
                    </Box>

                    {/* Response Person */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="textSecondary">
                            {invitation.response_person}
                        </Typography>
                    </Box>

                    {/* Place */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Place sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="textSecondary">
                            Place: {placeName || 'Loading...'} {/* Display the fetched place name */}
                        </Typography>
                    </Box>

                    {/* Date and Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccessTime sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="textSecondary">
                            {new Date(invitation.date).toLocaleDateString()} {invitation.start_time} - {invitation.end_time}
                        </Typography>
                    </Box>

                    {/* Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>

                        {/* Delete Button */}
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card click event
                                handleDeleteConfirmation(); // Open the confirmation modal
                            }}
                            color="error"
                        >
                            <Delete />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal with Warning Style */}
            <Dialog
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#000',
                        borderRadius: 2,
                        border: darkMode ? '1px solid #ff4444' : '1px solid #ff4444', // Red border for warning
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ color: 'error.main' }} /> {/* Warning icon */}
                    <Typography variant="h6" sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Delete Invitation
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Are you sure you want to delete this invitation? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setIsDeleteModalOpen(false)}
                        sx={{ color: darkMode ? '#fff' : '#000' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        sx={{ color: 'error.main' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for Email Sending Feedback */}
            <Snackbar
                open={isEmailSent || emailError}
                autoHideDuration={6000}
                onClose={() => {
                    setIsEmailSent(false);
                    setEmailError(false);
                }}
            >
                <Alert
                    severity={emailError ? 'error' : 'success'}
                    sx={{ width: '100%' }}
                >
                    {emailError
                        ? 'Failed to open email client. Please send the email manually.'
                        : 'Email client opened successfully.'}
                </Alert>
            </Snackbar>
        </>
    );
};

export default InvitationCard;