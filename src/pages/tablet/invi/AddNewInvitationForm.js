import React, { useState, useContext } from 'react';
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    Event,
    Person,
    Description,
    Restaurant,
    Place,
    AccessTime,
    Delete,
    Add,
    Warning,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeContext } from '../../../context/ThemeContext';

const AddNewInvitationForm = ({
    formData,
    setFormData,
    selectedDate,
    handleDateChange,
    filteredPlaces,
    handlePlaceChange,
    freeSlots,
    selectedFreeSlot,
    handleFreeSlotSelect,
    startTimeOptions,
    endTimeOptions,
    users,
    handleInternalMemberChange,
    handleAddExternalMember,
    handleRemoveExternalMember,
    openExternalMemberDialog,
    setOpenExternalMemberDialog,
    newExternalMember,
    setNewExternalMember,
    selectedPlace,
    handleSubmit,
}) => {
    const { darkMode } = useContext(ThemeContext);
    const [openWarningModal, setOpenWarningModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // Handle Response Person selection
    const handleResponsePersonChange = (event) => {
        const selectedUserId = event.target.value;
        const selectedUser = users.find((user) => user.id === selectedUserId);
        if (selectedUser) {
            setFormData({
                ...formData,
                response_person: selectedUser.email, // Set the email as the response person
            });
        }
    };

    // Handle form submission with validation
    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!validateInternalMembers()) {
            setModalMessage('Please select at least one internal member.');
            setOpenWarningModal(true);
            return;
        }

        if (!validateExternalMembers()) {
            setModalMessage('Please add at least one external member.');
            setOpenWarningModal(true);
            return;
        }

        setModalMessage(e);
        setOpenConfirmationModal(true);
    };

    // Handle confirmed submission
    const handleConfirmedSubmit = () => {
        setOpenConfirmationModal(false);
        handleSubmit(modalMessage);
    };

    // Close the warning modal
    const handleCloseWarningModal = () => {
        setOpenWarningModal(false);
    };

    // Close the confirmation modal
    const handleCloseConfirmationModal = () => {
        setOpenConfirmationModal(false);
    };

    // Validation function to check if at least one internal member is selected
    const validateInternalMembers = () => {
        return formData.internal_members.length > 0;
    };

    // Validation function to check if at least one external member is added
    const validateExternalMembers = () => {
        return formData.external_members.length > 0;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            {/* Warning Modal */}
            <Dialog open={openWarningModal} onClose={handleCloseWarningModal}>
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <Warning sx={{ color: 'warning.main', mr: 1 }} />
                        <Typography variant="h6">Warning</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{modalMessage}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseWarningModal} color="primary">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Modal */}
            <Dialog open={openConfirmationModal} onClose={handleCloseConfirmationModal}>
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <Warning sx={{ color: 'warning.main', mr: 1 }} />
                        <Typography variant="h6">Confirmation</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to submit this invitation?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmationModal} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmedSubmit} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Custom Scrollbar Styling for Dark Theme */}
            <style>
                {`
                    body::-webkit-scrollbar {
                        width: 10px;
                    }
                    body::-webkit-scrollbar-track {
                        background: ${darkMode ? '#333' : '#f5f5f5'};
                    }
                    body::-webkit-scrollbar-thumb {
                        background: ${darkMode ? '#666' : '#888'};
                        border-radius: 5px;
                    }
                    body::-webkit-scrollbar-thumb:hover {
                        background: ${darkMode ? '#888' : '#555'};
                    }
                `}
            </style>

            <form onSubmit={handleFormSubmit}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Left Column */}
                    <Grid item xs={6}>
                        {/* Name */}
                        <TextField
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Event sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* Response Person Dropdown */}
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Response Person</InputLabel>
                            <Select
                                value={users.find((user) => user.email === formData.response_person)?.id || ''}
                                onChange={handleResponsePersonChange}
                                label="Response Person"
                                required
                                startAdornment={
                                    <InputAdornment position="start">
                                        <Person sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                }
                            >
                                {users.map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.full_name} ({user.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Type */}
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                label="Type"
                                required
                                startAdornment={
                                    <InputAdornment position="start">
                                        <Description sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value="meeting">Meeting</MenuItem>
                                <MenuItem value="session">Session</MenuItem>
                                <MenuItem value="interview">Interview</MenuItem>
                                <MenuItem value="service">Service</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Is Refreshment */}
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Is Refreshment</InputLabel>
                            <Select
                                value={formData.is_refreshment}
                                onChange={(e) => setFormData({ ...formData, is_refreshment: e.target.value })}
                                label="Is Refreshment"
                                required
                                startAdornment={
                                    <InputAdornment position="start">
                                        <Restaurant sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value={true}>Yes</MenuItem>
                                <MenuItem value={false}>No</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Refreshment Description */}
                        {formData.is_refreshment && (
                            <TextField
                                label="Refreshment Description"
                                value={formData.refreshment_description}
                                onChange={(e) => setFormData({ ...formData, refreshment_description: e.target.value })}
                                fullWidth
                                multiline
                                rows={4}
                                required
                                sx={{ mt: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Restaurant sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={6}>
                        {/* Description */}
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={4}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Description sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* Date */}
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    required
                                    sx={{ mt: 2 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Event sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            )}
                        />

                        {/* Place */}
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Select Place</InputLabel>
                            <Select
                                value={formData.place_id}
                                onChange={handlePlaceChange}
                                label="Select Place"
                                required
                                startAdornment={
                                    <InputAdornment position="start">
                                        <Place sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                }
                            >
                                {filteredPlaces.map((place) => (
                                    <MenuItem key={place.place_id} value={place.place_id}>
                                        {place.place_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Free Time Slots */}
                        {selectedPlace && freeSlots.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Free Time Slots:
                                </Typography>
                                <List>
                                    {freeSlots.map((slot, index) => (
                                        <ListItem
                                            key={index}
                                            button
                                            selected={selectedFreeSlot === slot}
                                            onClick={() => handleFreeSlotSelect(slot)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: darkMode ? '#333' : '#f5f5f5',
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={`${slot.start} - ${slot.end}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* Start Time */}
                        {selectedFreeSlot && (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Start Time</InputLabel>
                                <Select
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    label="Start Time"
                                    required
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <AccessTime sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    }
                                >
                                    {startTimeOptions.map((time) => (
                                        <MenuItem key={time} value={time}>
                                            {time}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* End Time */}
                        {selectedFreeSlot && (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>End Time</InputLabel>
                                <Select
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    label="End Time"
                                    required
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <AccessTime sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    }
                                >
                                    {endTimeOptions.map((time) => (
                                        <MenuItem key={time} value={time}>
                                            {time}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Grid>
                </Grid>

                {/* Internal Members */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">Internal Members</Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Add Internal Member</InputLabel>
                        <Select
                            value=""
                            onChange={handleInternalMemberChange}
                            label="Add Internal Member"
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.full_name} ({user.email})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ mt: 2 }}>
                        {formData.internal_members.map((member, index) => (
                            <Chip
                                key={index}
                                label={`${member.full_name} (${member.email})`}
                                onDelete={() => {
                                    const updatedMembers = formData.internal_members.filter((_, i) => i !== index);
                                    setFormData({ ...formData, internal_members: updatedMembers });
                                }}
                                sx={{ mr: 1, mb: 1 }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* External Members */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">External Members</Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setOpenExternalMemberDialog(true)}
                        sx={{ mt: 2 }}
                    >
                        Add External Member
                    </Button>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone Number</TableCell>
                                    <TableCell>Company Name</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.external_members.map((member, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{member.full_name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.phone_no}</TableCell>
                                        <TableCell>{member.company_name}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => handleRemoveExternalMember(index)}
                                                color="error"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Submit Button */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" color="primary">
                        Book Invitation
                    </Button>
                </Box>
            </form>
        </LocalizationProvider>
    );
};

export default AddNewInvitationForm;