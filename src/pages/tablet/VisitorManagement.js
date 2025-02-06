import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    InputAdornment,
    IconButton,
    Grid,
} from '@mui/material';
import { Search, Close, Check, Cancel, Person, Email, Phone, Business, Schedule, History, People, Warning } from '@mui/icons-material';
import { selectData, updateData,selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { toast } from 'react-hot-toast';
import { ThemeContext } from '../../context/ThemeContext';

const VisitorManagement = () => {
    const [visitors, setVisitors] = useState([]);
    const [companyId, setCompanyId] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [openApproveDialog, setOpenApproveDialog] = useState(false);
    const [openDischargeDialog, setOpenDischargeDialog] = useState(false);
    const [openApproveConfirmation, setOpenApproveConfirmation] = useState(false);
    const [openDischargeConfirmation, setOpenDischargeConfirmation] = useState(false);
    const [passId, setPassId] = useState('');
    const [nic, setNic] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const { darkMode } = useContext(ThemeContext);

    // Add state for discharge reason and comments
    const [dischargeReason, setDischargeReason] = useState('');
    const [comments, setComments] = useState('');

    // Fetch company ID
    useEffect(() => {
        const fetchCompanyId = async () => {
            try {
                const userDetails = await getUserDetails();
                setCompanyId(userDetails.company_id);
            } catch (error) {
                console.error('Failed to fetch user details:', error);
                toast.error('Failed to fetch user details.');
            }
        };
        fetchCompanyId();
    }, []);

    // Fetch visitors based on company ID
    useEffect(() => {
        const fetchVisitors = async () => {
            if (companyId) {
                setLoading(true);
                try {
                    const response = await selectData('external_participants', { company_id: companyId });
                    setVisitors(response.data);
                } catch (error) {
                    console.error('Failed to fetch visitors:', error);
                    toast.error('Failed to fetch visitors.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchVisitors();
    }, [companyId]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const fetchResponsePersonPhoneNumber = async (invitationId) => {
        try {
            // Fetch the invitation details to get the response person's email
            const invitationResponse = await selectData('invitations', { id: invitationId });
            if (invitationResponse && invitationResponse.data && invitationResponse.data.length > 0) {
                const responsePersonEmail = invitationResponse.data[0].response_person;

                // Fetch the response person's profile using their email
                const profileResponse = await selectDataProfiles({ email: responsePersonEmail });
                if (profileResponse && profileResponse.data && profileResponse.data.length > 0) {
                    return profileResponse.data[0].phone_number; // Return the phone number
                }
            }
            return null; // Return null if no phone number is found
        } catch (error) {
            console.error('Failed to fetch response person details:', error);
            toast.error('Failed to fetch response person details.');
            return null;
        }
    };


    const handleSendAlert = async (visitor) => {
        try {
            // Fetch the response person's phone number
            const phoneNumber = await fetchResponsePersonPhoneNumber(visitor.invitation_id);
            if (!phoneNumber) {
                toast.error('Response person phone number not found.');
                return;
            }
    
            // Fetch the invitation details
            const invitationResponse = await selectData('invitations', { id: visitor.invitation_id });
            if (invitationResponse && invitationResponse.data && invitationResponse.data.length > 0) {
                const invitation = invitationResponse.data[0];
    
                // Construct the WhatsApp message
                const message = `Hello, this is a reminder for the meeting:
    - Name: ${invitation.name}
    - Date: ${new Date(invitation.date).toLocaleDateString()}
    - Time: ${invitation.start_time} to ${invitation.end_time}7/
    - Members: ${visitor.full_name} (${visitor.company_name}) is waiting for the meeting.`;
    
                // Encode the message for the WhatsApp URL
                const encodedMessage = encodeURIComponent(message);
    
                // Construct the WhatsApp URL
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
                // Open WhatsApp in a new tab/window
                window.open(whatsappUrl, '_blank');
            } else {
                toast.error('Invitation details not found.');
            }
        } catch (error) {
            console.error('Failed to send alert:', error);
            toast.error('Failed to send alert.');
        }
    };

    // Handle approve visitor
    const handleApproveVisitor = (visitor) => {
        setSelectedVisitor(visitor);
        setOpenApproveDialog(true);
    };

    // Handle discharge visitor
    const handleDischargeVisitor = (visitor) => {
        setSelectedVisitor(visitor);
        setOpenDischargeDialog(true);
    };

    // Confirm approve
    const confirmApprove = async () => {
        try {
            await updateData('external_participants', {
                is_approved: true,
                pass_id: passId,
                nic: nic,
                visitor_status: 'admit',
                admit_time: new Date().toISOString(),
            }, { id: selectedVisitor.id });
            toast.success('Visitor approved successfully!');
            setOpenApproveDialog(false);
            setOpenApproveConfirmation(false);
            setPassId('');
            setNic('');
            // Refresh visitors list
            const response = await selectData('external_participants', { company_id: companyId });
            setVisitors(response.data);
        } catch (error) {
            console.error('Failed to approve visitor:', error);
            toast.error('Failed to approve visitor.');
        }
    };

    // Confirm discharge
    const confirmDischarge = async () => {
        try {
            await updateData('external_participants', {
                visitor_status: 'discharged',
                discharged_time: new Date().toISOString(),
                discharge_reason: dischargeReason, // Add discharge reason
                comments: comments, // Add comments
            }, { id: selectedVisitor.id });
            toast.success('Visitor discharged successfully!');
            setOpenDischargeDialog(false);
            setOpenDischargeConfirmation(false);
            // Reset discharge reason and comments
            setDischargeReason('');
            setComments('');
            // Refresh visitors list
            const response = await selectData('external_participants', { company_id: companyId });
            setVisitors(response.data);
        } catch (error) {
            console.error('Failed to discharge visitor:', error);
            toast.error('Failed to discharge visitor.');
        }
    };

    // Filter visitors based on tab value and search query
    const filteredVisitors = visitors.filter((visitor) => {
        const matchesSearch = visitor.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        if (tabValue === 0) {
            return matchesSearch && visitor.visitor_status === 'admit' && !visitor.is_approved;
        } else if (tabValue === 1) {
            return matchesSearch && visitor.visitor_status === 'admit' && visitor.is_approved;
        } else if (tabValue === 2) {
            return matchesSearch && visitor.visitor_status === 'discharged';
        }
        return matchesSearch;
    });

    // Calculate total time spent (admit to discharge)
    const calculateTotalTime = (admitTime, dischargedTime) => {
        const admit = new Date(admitTime);
        const discharge = new Date(dischargedTime);
        const diff = discharge - admit; // Difference in milliseconds
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <Box sx={{ padding: 2, backgroundColor: darkMode ? '#121212' : '#f5f5f5', minHeight: '80vh' }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 32, color: darkMode ? '#fff' : '#000' }} />
                    <Typography variant="h4" sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Visitor Management
                    </Typography>
                </Box>
                <TextField
                    label="Search Visitors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: '300px' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: darkMode ? '#fff' : '#000' }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                            <IconButton onClick={() => setSearchQuery('')}>
                                <Close sx={{ color: darkMode ? '#fff' : '#000' }} />
                            </IconButton>
                        ),
                    }}
                />
            </Box>

            {/* Tabs */}
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="New Admission" icon={<Person />} />
                <Tab label="Admitted Visitors" icon={<Check />} />
                <Tab label="History" icon={<History />} />
            </Tabs>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Visitor Cards for New Admission and Admitted Visitors */}
            {!loading && tabValue !== 2 && (
                <Box
                    sx={{
                        mt: 2,
                        display: 'grid',
                        p: 1,
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 2,
                        maxHeight: 'calc(80vh - 200px)',
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: darkMode ? '#333' : '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: darkMode ? '#666' : '#888',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: darkMode ? '#999' : '#555',
                        },
                    }}
                >
                    {filteredVisitors.map((visitor) => (
                        <Card key={visitor.id} sx={{ backgroundColor: darkMode ? '#1e1e1e' : '#fff', boxShadow: 'none' }}>
                            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', boxShadow: 'none' }}>
                                <Box sx={{ flexGrow: 1, boxShadow: 'none' }}>
                                    <Typography variant="h6" sx={{ color: darkMode ? '#fff' : '#000' }}>
                                        <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        {visitor.full_name}
                                    </Typography>
                                    <Typography sx={{ color: darkMode ? '#ccc' : '#666' }}>
                                        <Email sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        {visitor.email}
                                    </Typography>
                                    <Typography sx={{ color: darkMode ? '#ccc' : '#666' }}>
                                        <Phone sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        {visitor.phone_number}
                                    </Typography>
                                    <Typography sx={{ color: darkMode ? '#ccc' : '#666' }}>
                                        <Business sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        {visitor.company_name}
                                    </Typography>
                                    {/* Display status for New Admissions */}
                                    {tabValue === 0 && (
                                        <Typography sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                                            <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
                                            Status: Pending Approval
                                        </Typography>
                                    )}
                                    {/* Display Pass ID for approved visitors */}
                                    {visitor.is_approved && (
                                        <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            <Check sx={{ verticalAlign: 'middle', mr: 1 }} />
                                            Pass ID: {visitor.pass_id}
                                        </Typography>
                                    )}
                                </Box>
                                {/* Approve button for New Admissions */}
                                {tabValue === 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<Check />}
                                            onClick={() => handleApproveVisitor(visitor)}
                                        >
                                            Approve
                                        </Button>
                                    </Box>
                                )}
                                {/* Discharge button for Admitted Visitors */}
                                {tabValue === 1 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={() => handleDischargeVisitor(visitor)}
                                        >
                                            Discharge
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Email />}
                                            onClick={() => handleSendAlert(visitor)}
                                        >
                                            Send Alert
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* History Table */}
            {!loading && tabValue === 2 && (
                <TableContainer
                    component={Paper}
                    sx={{
                        mt: 2,
                        boxShadow: 'none',
                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                        maxHeight: '400px', // Set a fixed height for the table
                        overflowY: 'auto', // Enable vertical scrolling
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: darkMode ? '#333' : '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: darkMode ? '#666' : '#888',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: darkMode ? '#999' : '#555',
                        },
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1, // Ensure the header is above the body
                                    }}
                                >
                                    INV ID
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Full Name
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Email
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Phone
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Company
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Pass ID
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    NIC
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Admit Time
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Discharged Time
                                </TableCell>
                                <TableCell
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                                        color: darkMode ? '#fff' : '#000',
                                        zIndex: 1,
                                    }}
                                >
                                    Total Time Spent
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVisitors.slice(0, 8).map((visitor) => ( // Limit to 8 rows
                                <TableRow key={visitor.id}>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.invitation_id}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.full_name}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.email}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.phone_number}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.company_name}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.pass_id}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>{visitor.nic}</TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                                        {new Date(visitor.admit_time).toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                                        {new Date(visitor.discharged_time).toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ color: darkMode ? '#fff' : '#000' }}>
                                        {calculateTotalTime(visitor.admit_time, visitor.discharged_time)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Approve Dialog */}
            <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
                <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>Approve Visitor</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Pass ID"
                        value={passId}
                        onChange={(e) => setPassId(e.target.value)}
                        fullWidth
                        sx={{ mt: 2 }}
                        required
                        error={!passId}
                        helperText={!passId ? "Pass ID is required" : ""}
                    />
                    <TextField
                        label="NIC"
                        value={nic}
                        onChange={(e) => setNic(e.target.value)}
                        fullWidth
                        sx={{ mt: 2 }}
                        required
                        error={!nic}
                        helperText={!nic ? "NIC is required" : ""}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (!passId || !nic) {
                                // Show error if fields are not filled
                                alert("Please fill all required fields.");
                            } else {
                                // Proceed to confirmation if fields are filled
                                setOpenApproveConfirmation(true);
                            }
                        }}
                        variant="contained"
                        color="primary"
                        disabled={!passId || !nic} // Disable button if fields are empty
                    >
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Approve Confirmation Modal */}
            <Dialog open={openApproveConfirmation} onClose={() => setOpenApproveConfirmation(false)}>
                <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <Warning sx={{ color: 'warning.main', mr: 1 }} />
                    Confirm Approval
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Are you sure you want to approve this visitor?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenApproveConfirmation(false)}>Cancel</Button>
                    <Button onClick={confirmApprove} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Discharge Dialog */}
            <Dialog open={openDischargeDialog} onClose={() => setOpenDischargeDialog(false)}>
                <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>Discharge Visitor</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: darkMode ? '#fff' : '#000', mb: 2 }}>
                        Are you sure you want to discharge this visitor?
                    </Typography>
                    <Typography sx={{ color: darkMode ? '#fff' : '#000', mb: 2 }}>
                        Pass ID: {selectedVisitor?.pass_id}
                    </Typography>
                    <Typography sx={{ color: darkMode ? '#fff' : '#000', mb: 2 }}>
                        NIC: {selectedVisitor?.nic}
                    </Typography>

                    {/* Required Field 1: Discharge Reason */}
                    <TextField
                        fullWidth
                        label="Discharge Reason"
                        variant="outlined"
                        required
                        value={dischargeReason}
                        onChange={(e) => setDischargeReason(e.target.value)}
                        sx={{ mb: 2 }}
                        error={!dischargeReason}
                        helperText={!dischargeReason ? "Discharge Reason is required" : ""}
                    />

                    {/* Required Field 2: Comments */}
                    <TextField
                        fullWidth
                        label="Comments"
                        variant="outlined"
                        required
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        sx={{ mb: 2 }}
                        error={!comments}
                        helperText={!comments ? "Comments are required" : ""}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDischargeDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (!dischargeReason || !comments) {
                                // Show error if fields are not filled
                                alert("Please fill all required fields.");
                            } else {
                                // Proceed to confirmation if fields are filled
                                setOpenDischargeConfirmation(true);
                            }
                        }}
                        variant="contained"
                        color="error"
                    >
                        Discharge
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Discharge Confirmation Modal */}
            <Dialog open={openDischargeConfirmation} onClose={() => setOpenDischargeConfirmation(false)}>
                <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
                    <Warning sx={{ color: 'warning.main', mr: 1 }} />
                    Confirm Discharge
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: darkMode ? '#fff' : '#000' }}>
                        Are you sure you want to discharge this visitor?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDischargeConfirmation(false)}>Cancel</Button>
                    <Button onClick={confirmDischarge} variant="contained" color="error">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VisitorManagement;