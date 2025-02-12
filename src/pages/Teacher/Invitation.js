import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import {
    Box,
    Typography,
    Button,
    Grid,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Event,
    Search,
    Add,
    Schedule,
    Person,
    History,
} from '@mui/icons-material';
import { selectData, insertData, updateData, selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { toast } from 'react-hot-toast';
import AddNewInvitationForm from './invi/AddNewInvitationForm';
import InvitationView from './invi/InvitationView';
import InvitationCard from './invi/InvitationCard';

const InvitationBooking = () => {
    const [places, setPlaces] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [freeSlots, setFreeSlots] = useState([]);
    const [selectedFreeSlot, setSelectedFreeSlot] = useState(null);
    const [startTimeOptions, setStartTimeOptions] = useState([]);
    const [endTimeOptions, setEndTimeOptions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [formData, setFormData] = useState({
        name: '',
        response_person: '',
        type: '',
        is_refreshment: false,
        refreshment_description: '',
        description: '',
        date: '',
        place_id: '',
        start_time: '',
        end_time: '',
        internal_members: [],
        external_members: [],
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [openExternalMemberDialog, setOpenExternalMemberDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [invitations, setInvitations] = useState([]);
    const [selectedInvitation, setSelectedInvitation] = useState(null);
    const [users, setUsers] = useState([]);
    const [newExternalMember, setNewExternalMember] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        company_name: '',
    });
    const { darkMode } = useContext(ThemeContext);

    // Fetch the company ID from user details
    useEffect(() => {
        const fetchCompanyId = async () => {
            try {
                const userDetails = await getUserDetails();
                setCompanyId(userDetails.company_id);
            } catch (error) {
                console.error('Failed to fetch user details:', error);
                toast.error('Failed to fetch user details. Please check the console for details.');
            }
        };

        fetchCompanyId();
    }, []);

    // Fetch internal users data
    useEffect(() => {
        const fetchUsers = async () => {
            if (companyId) {
                try {
                    const usersData = await selectDataProfiles({ company_id: companyId });
                    setUsers(usersData.data);
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                    toast.error('Failed to fetch users. Please check the console for details.');
                }
            }
        };

        fetchUsers();
    }, [companyId]);

    // Fetch places related to the company
    useEffect(() => {
        const fetchPlaces = async () => {
            if (companyId) {
                try {
                    const response = await selectData('places', { is_deleted: false, company_id: companyId });
                    if (response && response.data) {
                        setPlaces(response.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch places:', error);
                    toast.error('Failed to fetch places. Please check the console for details.');
                }
            }
        };

        fetchPlaces();
    }, [companyId]);

    // Filter places based on availability for the selected date
    useEffect(() => {
        if (selectedDate) {
            const dayName = selectedDate.toLocaleString('en-US', { weekday: 'long' });
            const filtered = places.filter((place) => {
                const availableDays = JSON.parse(place.available_days);
                return availableDays[dayName];
            });
            setFilteredPlaces(filtered);
        }
    }, [selectedDate, places]);

    const fetchBookings = async () => {
        if (selectedPlace && selectedDate) {
            try {
                const formattedDate = selectedDate.toISOString().split('T')[0];
                const response = await selectData('invitations', {
                    place_id: selectedPlace.place_id,
                    date: formattedDate,
                });
                if (response && response.data) {
                    setBookings(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch bookings:', error);
                toast.error('Failed to fetch bookings. Please check the console for details.');
            }
        }
    };

    // Fetch bookings for the selected place and date
    useEffect(() => {
        fetchBookings();
    }, [selectedPlace, selectedDate]);

    // Calculate free time slots
    useEffect(() => {
        if (selectedPlace && bookings.length >= 0) {
            const availableStart = selectedPlace.available_time_start;
            const availableEnd = selectedPlace.available_time_end;

            const toMinutes = (time) => {
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
            };

            const toTimeString = (minutes) => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            };

            const sortedBookings = [...bookings].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

            const slots = [];
            let previousEnd = toMinutes(availableStart);

            sortedBookings.forEach((booking) => {
                const bookingStart = toMinutes(booking.start_time);
                const bookingEnd = toMinutes(booking.end_time);

                if (bookingStart > previousEnd) {
                    slots.push({
                        start: toTimeString(previousEnd),
                        end: toTimeString(bookingStart),
                    });
                }

                previousEnd = Math.max(previousEnd, bookingEnd);
            });

            if (previousEnd < toMinutes(availableEnd)) {
                slots.push({
                    start: toTimeString(previousEnd),
                    end: availableEnd,
                });
            }

            setFreeSlots(slots);
        } else {
            setFreeSlots([]);
        }
    }, [selectedPlace, bookings]);

    // Fetch all invitations
    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const response = await selectData('invitations', { company_id: companyId, is_deleted: false });
                setInvitations(response.data);
            } catch (error) {
                console.error('Failed to fetch invitations:', error);
                toast.error('Failed to fetch invitations. Please check the console for details.');
            }
        };

        fetchInvitations();
    }, [companyId]);

    // Handle place selection from the dropdown
    const handlePlaceChange = (event) => {
        const placeId = event.target.value;
        const selected = filteredPlaces.find((place) => place.place_id === placeId);
        setSelectedPlace(selected);
        setFormData({ ...formData, place_id: placeId });
        setSelectedFreeSlot(null);
    };

    // Handle date selection
    const handleDateChange = (date) => {
        const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        setSelectedDate(date);
        setFormData({ ...formData, date: formattedDate });
        setSelectedFreeSlot(null);
    };

    // Handle free slot selection
    const handleFreeSlotSelect = (slot) => {
        setSelectedFreeSlot(slot);

        const toMinutes = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const toTimeString = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        };

        const startOptions = [];
        const endOptions = [];
        let currentTime = toMinutes(slot.start);
        const endTime = toMinutes(slot.end);

        while (currentTime < endTime) {
            startOptions.push(toTimeString(currentTime));
            currentTime += 30;
        }

        currentTime = toMinutes(slot.start) + 30;
        while (currentTime <= endTime) {
            endOptions.push(toTimeString(currentTime));
            currentTime += 30;
        }

        setStartTimeOptions(startOptions);
        setEndTimeOptions(endOptions);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        try {
            // Ensure the date is in the correct format
            const formattedDate = selectedDate.toISOString().split('T')[0];

            // Step 1: Insert data into the invitations table
            const invitationResponse = await insertData('invitations', {
                company_id: companyId,
                name: formData.name,
                response_person: formData.response_person,
                type: formData.type,
                description: formData.description,
                refreshment_description: formData.refreshment_description,
                is_refreshment: formData.is_refreshment,
                place_id: formData.place_id,
                date: formattedDate, // Use the formatted date
                start_time: formData.start_time,
                end_time: formData.end_time,
            });

            const invitationId = invitationResponse.id;
            toast.success('Invitation created successfully!');

            // Step 2: Insert data into the external_participants table
            for (const externalMember of formData.external_members) {
                await insertData('external_participants', {
                    company_id: companyId,
                    invitation_id: invitationId,
                    full_name: externalMember.full_name,
                    email: externalMember.email,
                    phone_number: externalMember.phone_no,
                    company_name: externalMember.company_name,
                });
            }

            // Step 3: Insert data into the internal_participants table
            for (const internalMember of formData.internal_members) {
                await insertData('internal_participants', {
                    company_id: companyId,
                    invitation_id: invitationId,
                    user_id: internalMember.id,
                    full_name: internalMember.full_name,
                    email: internalMember.email,
                    phone_number: internalMember.phone_number,
                });
            }

            toast.success('Participants added successfully!');

            // Reset form and fetch updated invitations
            setFormData({
                name: '',
                response_person: '',
                type: '',
                is_refreshment: false,
                refreshment_description: '',
                description: '',
                date: '',
                place_id: '',
                start_time: '',
                end_time: '',
                internal_members: [],
                external_members: [],
            });
            setSelectedFreeSlot(null);
            setOpenDialog(false);
            setSelectedInvitation(null);

            const fetchResponse = await selectData('invitations', { company_id: companyId });
            if (fetchResponse && fetchResponse.data) {
                setInvitations(fetchResponse.data);
            }
        } catch (error) {
            console.error('Failed to book/update invitation:', error);
            toast.error('Failed to book/update invitation. Please check the console for details.');
        }
    };

    // Handle search input changes
    const handleSearch = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Filter invitations based on search query and tab value
    const filteredInvitations = invitations.filter((invitation) => {
        const matchesSearch = 
            invitation.name.toLowerCase().includes(searchQuery) || 
            invitation.id.toString().includes(searchQuery); // Add search by invitation_id
    
        if (tabValue === 0) {
            // Ongoing: Check if the status is "ongoing"
            return matchesSearch && invitation.status === 'ongoing';
        } else if (tabValue === 1) {
            // Upcoming: Check if the status is "upcoming"
            return matchesSearch && invitation.status === 'upcoming';
        } else if (tabValue === 2) {
            // Past: Check if the status is "passed"
            return matchesSearch && invitation.status === 'passed';
        }
        return matchesSearch;
    });

    // Handle card click to view/update invitation
    const handleCardClick = async (invitation) => {
        try {
            // Fetch internal participants
            const internalParticipantsResponse = await selectData('internal_participants', {
                invitation_id: invitation.id,
            });
            const internalParticipants = internalParticipantsResponse.data || [];

            // Fetch external participants
            const externalParticipantsResponse = await selectData('external_participants', {
                invitation_id: invitation.id,
            });
            const externalParticipants = externalParticipantsResponse.data || [];

            // Set the form data with the fetched details
            setFormData({
                name: invitation.name,
                response_person: invitation.response_person,
                type: invitation.type,
                is_refreshment: invitation.is_refreshment,
                refreshment_description: invitation.refreshment_description,
                description: invitation.description,
                date: invitation.date, // Already in YYYY-MM-DD format
                place_id: invitation.place_id,
                start_time: invitation.start_time,
                end_time: invitation.end_time,
                internal_members: internalParticipants,
                external_members: externalParticipants,
            });

            // Open the dialog
            setOpenDialog(true);
            setSelectedInvitation(invitation);
        } catch (error) {
            console.error('Failed to fetch participation details:', error);
            toast.error('Failed to fetch participation details. Please check the console for details.');
        }
    };

    // Handle delete invitation
    const handleDeleteInvitation = async (invitationId) => {
        try {
            await updateData('invitations', { is_deleted: true }, { id: invitationId });
            toast.success('Invitation deleted successfully!');

            // Fetch the updated list of invitations
            const fetchResponse = await selectData('invitations', { company_id: companyId, is_deleted: false });
            if (fetchResponse && fetchResponse.data) {
                setInvitations(fetchResponse.data); // Update the state with the new list of invitations
            }
        } catch (error) {
            console.error('Failed to delete invitation:', error);
            toast.error('Failed to delete invitation. Please check the console for details.');
        }
    };

    // Handle internal member selection
    const handleInternalMemberChange = (event) => {
        const selectedUserId = event.target.value;
        const selectedUser = users.find((user) => user.id === selectedUserId);
        if (selectedUser && !formData.internal_members.some((member) => member.id === selectedUser.id)) {
            setFormData({
                ...formData,
                internal_members: [...formData.internal_members, selectedUser],
            });
        }
    };

    // Handle external member addition
    const handleAddExternalMember = () => {
        setFormData({
            ...formData,
            external_members: [...formData.external_members, newExternalMember],
        });
        setNewExternalMember({
            full_name: '',
            email: '',
            phone_no: '',
            company_name: '',
        });
        setOpenExternalMemberDialog(false);
    };

    // Handle external member removal
    const handleRemoveExternalMember = (index) => {
        const updatedExternalMembers = formData.external_members.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            external_members: updatedExternalMembers,
        });
    };

    return (
        <Box sx={{ padding: 2 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Event sx={{ fontSize: 32, color: 'primary.main' }} />
                Invitation Booking
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                    label="Search Invitations"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: '300px' }}
                />
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Ongoing" icon={<Schedule />} />
                    <Tab label="Upcoming" icon={<Event />} />
                    <Tab label="Past" icon={<History />} />
                </Tabs>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setFormData({
                            name: '',
                            response_person: '',
                            type: '',
                            is_refreshment: false,
                            refreshment_description: '',
                            description: '',
                            date: '',
                            place_id: '',
                            start_time: '',
                            end_time: '',
                            internal_members: [],
                            external_members: [],
                        });
                        setSelectedDate(new Date());
                        setSelectedPlace(null);
                        setSelectedFreeSlot(null);
                        setStartTimeOptions([]);
                        setEndTimeOptions([]);
                        setOpenDialog(true);
                        setSelectedInvitation(null);
                    }}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        padding: '10px 20px',
                    }}
                >
                    Create New Invitation
                </Button>
            </Box>
        </Box>
    
        {/* Invitation Cards */}
        <Box
            sx={{
                p:2,
                maxHeight: 'calc(100vh - 200px)', // Adjust height as needed
                overflowY: 'auto', // Enable vertical scrolling
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: darkMode ? '#424242' : '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: darkMode ? '#757575' : '#888',
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: darkMode ? '#999' : '#555',
                },
            }}
        >
            <Grid container spacing={3}>
                {filteredInvitations.map((invitation) => ( // Removed .slice(0, 6)
                    <Grid item xs={12} sm={6} md={4} key={invitation.id}>
                        <InvitationCard
                            invitation={invitation}
                            darkMode={darkMode}
                            onCardClick={() => handleCardClick(invitation)}
                            onDelete={handleDeleteInvitation}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    
        {/* Create/Update Invitation Dialog */}
        <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event sx={{ color: 'primary.main' }} />
                    {selectedInvitation ? 'View Invitation' : 'Create New Invitation'}
                </Box>
            </DialogTitle>
            <DialogContent>
                {selectedInvitation ? (
                    <InvitationView
                        invitation={selectedInvitation}
                        internalMembers={formData.internal_members}
                        externalMembers={formData.external_members}
                    />
                ) : (
                    <AddNewInvitationForm
                        formData={formData}
                        setFormData={setFormData}
                        selectedDate={selectedDate}
                        handleDateChange={handleDateChange}
                        filteredPlaces={filteredPlaces}
                        handlePlaceChange={handlePlaceChange}
                        freeSlots={freeSlots}
                        selectedFreeSlot={selectedFreeSlot}
                        handleFreeSlotSelect={handleFreeSlotSelect}
                        startTimeOptions={startTimeOptions}
                        endTimeOptions={endTimeOptions}
                        users={users}
                        handleInternalMemberChange={handleInternalMemberChange}
                        handleAddExternalMember={handleAddExternalMember}
                        handleRemoveExternalMember={handleRemoveExternalMember}
                        openExternalMemberDialog={openExternalMemberDialog}
                        setOpenExternalMemberDialog={setOpenExternalMemberDialog}
                        newExternalMember={newExternalMember}
                        setNewExternalMember={setNewExternalMember}
                        handleSubmit={handleSubmit}
                        selectedPlace={selectedPlace}
                    />
                )}
            </DialogContent>
        </Dialog>
    
        {/* Add External Member Dialog */}
        <Dialog
            open={openExternalMemberDialog}
            onClose={() => setOpenExternalMemberDialog(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ color: 'primary.main' }} />
                    Add External Member
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Full Name"
                            value={newExternalMember.full_name}
                            onChange={(e) => setNewExternalMember({ ...newExternalMember, full_name: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Email"
                            value={newExternalMember.email}
                            onChange={(e) => setNewExternalMember({ ...newExternalMember, email: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Phone Number"
                            value={newExternalMember.phone_no}
                            onChange={(e) => setNewExternalMember({ ...newExternalMember, phone_no: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Company Name"
                            value={newExternalMember.company_name}
                            onChange={(e) => setNewExternalMember({ ...newExternalMember, company_name: e.target.value })}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenExternalMemberDialog(false)}>Cancel</Button>
                <Button onClick={handleAddExternalMember} variant="contained" color="primary">
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
    );
};

export default InvitationBooking;