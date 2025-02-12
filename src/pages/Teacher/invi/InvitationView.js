import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Event,
    Person,
    Place,
    AccessTime,
    Description,
    Restaurant,
    Email,
} from '@mui/icons-material';
import { selectData } from '../../../services/dataService';
import QRCode from 'qrcode.react'; // Import QRCode library

const InvitationView = ({ invitation, internalMembers, externalMembers }) => {
    const [placeName, setPlaceName] = useState('');
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

    // Handle send email action
    const handleSendEmail = () => {
        try {
            // Combine internal and external members' emails
            const allParticipants = [
                ...internalMembers.map((member) => member.email),
                ...externalMembers.map((member) => member.email),
            ];
    
            // Generate Google Calendar and Microsoft Calendar links
            const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(invitation.name)}&dates=${new Date(invitation.date).toISOString().replace(/-|:|\.\d+/g, '')}/${new Date(invitation.date).toISOString().replace(/-|:|\.\d+/g, '')}&details=${encodeURIComponent(`Event Name: ${invitation.name}\nDate: ${new Date(invitation.date).toLocaleDateString()}\nTime: ${invitation.start_time} - ${invitation.end_time}\nPlace: ${placeName}`)}&location=${encodeURIComponent(placeName)}`;
            const microsoftCalendarLink = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(invitation.name)}&startdt=${new Date(invitation.date).toISOString()}&enddt=${new Date(invitation.date).toISOString()}&body=${encodeURIComponent(`Event Name: ${invitation.name}\nDate: ${new Date(invitation.date).toLocaleDateString()}\nTime: ${invitation.start_time} - ${invitation.end_time}\nPlace: ${placeName}`)}&location=${encodeURIComponent(placeName)}`;
    
            // Construct the email subject and body
            const subject = `Invitation for ${invitation.name} (ID: ${invitation.id})`;
            const body = `
    Dear Participant,
    
    You have been invited to the following event:
    
    Event Name: ${invitation.name}
    Event Type: ${invitation.type}
    Invitation ID: ${invitation.id}
    Date: ${new Date(invitation.date).toLocaleDateString()}
    Time: ${invitation.start_time} - ${invitation.end_time}
    Place: ${placeName}
    Participants: ${allParticipants.join(', ')}
    
  
    
    Add to Calendar:
    - [Add to Google Calendar](${googleCalendarLink})
    - [Add to Microsoft Calendar](${microsoftCalendarLink})
    
    Please let us know if you can attend.
    
    Best regards,
    Your Event Organizer
    `;
    
            // Encode the email body
            const encodedBody = encodeURIComponent(body);
    
            // Open the default email client
            window.location.href = `mailto:${allParticipants.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodedBody}`;
    
            // Set email sent status to true
            setIsEmailSent(true);
        } catch (error) {
            console.error('Failed to open email client:', error);
            setEmailError(true); // Show error message
        }
    };

    return (
        <Box
            sx={{
                maxHeight: '80vh', // Set a maximum height for the container
                overflowY: 'auto', // Enable vertical scrolling
                '&::-webkit-scrollbar': {
                    width: '8px', // Width of the scrollbar
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent', // Transparent track
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? '#555' : '#ccc', // Dark or light thumb
                    borderRadius: '4px', // Rounded corners for the thumb
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? '#888' : '#aaa', // Dark or light thumb on hover
                },
            }}
        >
            {/* Send Email Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <IconButton
                    onClick={handleSendEmail}
                    color="primary"
                    sx={{ backgroundColor: 'primary.main',borderRadius:2, color: 'white', '&:hover': { backgroundColor: 'primary.dark' } }}
                >
                    <Email />
                    <Typography variant="body1" sx={{ ml: 1 }}>
                        Send Email
                    </Typography>
                </IconButton>
            </Box>

            <Typography variant="h4" sx={{ mb: 2 }}>
                {invitation.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person sx={{ color: 'text.secondary' }} />
                <Typography variant="body1">
                    <strong>Response Person:</strong> {invitation.response_person}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Place sx={{ color: 'text.secondary' }} />
                <Typography variant="body1">
                    <strong>Place:</strong> {placeName}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccessTime sx={{ color: 'text.secondary' }} />
                <Typography variant="body1">
                    <strong>Date & Time:</strong> {new Date(invitation.date).toLocaleDateString()} {/* Date */}
                    {new Date(`1970-01-01T${invitation.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} {/* Start Time */}
                    {' - '}
                    {new Date(`1970-01-01T${invitation.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} {/* End Time */}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Description sx={{ color: 'text.secondary' }} />
                <Typography variant="body1">
                    <strong>Description:</strong> {invitation.description}
                </Typography>
            </Box>

            {invitation.is_refreshment && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Restaurant sx={{ color: 'text.secondary' }} />
                    <Typography variant="body1">
                        <strong>Refreshment Description:</strong> {invitation.refreshment_description}
                    </Typography>
                </Box>
            )}

            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                Internal Members
            </Typography>
            <List>
                {internalMembers.map((member, index) => (
                    <ListItem key={index}>
                        <ListItemText
                            primary={member.full_name}
                            secondary={`${member.email} | ${member.phone_number}`}
                        />
                    </ListItem>
                ))}
            </List>

            <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
                External Members
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone Number</TableCell>
                            <TableCell>Company Name</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {externalMembers.map((member, index) => (
                            <TableRow key={index}>
                                <TableCell>{member.full_name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{member.phone_number}</TableCell>
                                <TableCell>{member.company_name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
        </Box>
    );
};

export default InvitationView;