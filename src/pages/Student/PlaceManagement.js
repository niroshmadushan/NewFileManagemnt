import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import {
    Box,
    Typography,
    Button,
    TextField,
    Grid,
    Card,
    CardContent,
    CardActions,
    Checkbox,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    useTheme,
    Switch,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Add,
    Save,
    Delete,
    Edit,
    Search,
    Place,
    MeetingRoom,
    EventAvailable,
    EventBusy,
    AccessTime,
    CalendarToday,
    Info,
    Block,
    Warning,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import CountUp from 'react-countup'; // For animated counting

const PlaceManagement = () => {
    const [places, setPlaces] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const { darkMode } = useContext(ThemeContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState(null);
    const [currentPlace, setCurrentPlace] = useState(null);
    const [placeName, setPlaceName] = useState('');
    const [description, setDescription] = useState('');
    const [availableTimeStart, setAvailableTimeStart] = useState('08:00');
    const [availableTimeEnd, setAvailableTimeEnd] = useState('17:00');
    const [availableDays, setAvailableDays] = useState({
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: false,
        Sunday: false,
    });
    const [isActive, setIsActive] = useState(true);
    const [deactivationReason, setDeactivationReason] = useState('');
    const [isDeactivationReasonRequired, setIsDeactivationReasonRequired] = useState(false); // New state for validation
    const [companyId, setCompanyId] = useState(null); // State to store company_id
    const theme = useTheme(); // Get the current theme

    // Fetch places from the database on component mount
    useEffect(() => {
        fetchPlaces();
        fetchCompanyId();
    }, []);

    // Fetch company_id from user details
    const fetchCompanyId = async () => {
        try {
            const userDetails = await getUserDetails();
            setCompanyId(userDetails.company_id);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            toast.error('Failed to fetch user details. Please check the console for details.');
        }
    };

    // Update filtered places when search query or places change
    useEffect(() => {
        const filtered = places.filter((place) => {
            const matchesSearch = place.place_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && place.is_active) ||
                (statusFilter === 'inactive' && !place.is_active);
            return matchesSearch && matchesStatus;
        });
        setFilteredPlaces(filtered);
    }, [searchQuery, places, statusFilter]);

    // Function to fetch places from the database (excluding deleted places)
    const fetchPlaces = async () => {
        try {
            const userDetails = await getUserDetails();
            setCompanyId(userDetails.company_id);
            const response = await selectData('places', { is_deleted: false,company_id:userDetails.company_id}); // Fetch only non-deleted places
            if (response && response.data) {
                setPlaces(response.data);
                setFilteredPlaces(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch places:', error);
            toast.error('Failed to fetch places. Please check the console for details.');
        }
    };

    // Function to handle adding or editing a place
    const handleSavePlace = async () => {
        // Validate deactivation reason if the place is inactive
        if (!isActive && !deactivationReason.trim()) {
            toast.error('Deactivation reason is required for inactive places.');
            return;
        }

        const placeData = {
            place_name: placeName,
            description,
            available_time_start: availableTimeStart,
            available_time_end: availableTimeEnd,
            available_days: JSON.stringify(availableDays), // Convert days object to JSON string
            is_active: isActive,
            deactivation_reason: deactivationReason,
            company_id: companyId, // Include company_id in the place data
        };

        try {
            if (currentPlace) {
                // Update existing place
                await updateData('places', placeData, { place_id: currentPlace.place_id });
                toast.success('Place updated successfully!', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            } else {
                // Insert new place
                await insertData('places', placeData);
                toast.success('Place added successfully!', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            }
            fetchPlaces(); // Refresh the list of places
        } catch (error) {
            console.error('Failed to save place:', error);
            toast.error('Failed to save place. Please check the console for details.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        }

        setOpenDialog(false);
    };

    // Function to handle editing a place
    const handleEditPlace = (place) => {
        setCurrentPlace(place);
        setPlaceName(place.place_name);
        setDescription(place.description);
        setAvailableTimeStart(place.available_time_start);
        setAvailableTimeEnd(place.available_time_end);
        setAvailableDays(JSON.parse(place.available_days)); // Parse JSON string back to object
        setIsActive(place.is_active);
        setDeactivationReason(place.deactivation_reason || '');
        setIsDeactivationReasonRequired(!place.is_active); // Set required state based on active status
        setOpenDialog(true);
    };

    // Function to handle soft deleting a place
    const handleDeletePlace = async (id) => {
        try {
            await updateData('places', { is_deleted: true }, { place_id: id }); // Mark place as deleted
            toast.success('Place deleted successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            fetchPlaces(); // Refresh the list of places
        } catch (error) {
            console.error('Failed to delete place:', error);
            toast.error('Failed to delete place. Please check the console for details.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        }
    };

    // Function to reset the form and open the dialog for adding a new place
    const handleAddPlace = () => {
        setCurrentPlace(null);
        setPlaceName('');
        setDescription('');
        setAvailableTimeStart('08:00');
        setAvailableTimeEnd('17:00');
        setAvailableDays({
            Monday: true,
            Tuesday: true,
            Wednesday: true,
            Thursday: true,
            Friday: true,
            Saturday: false,
            Sunday: false,
        });
        setIsActive(true);
        setDeactivationReason('');
        setIsDeactivationReasonRequired(false); // Reset required state
        setOpenDialog(true);
    };

    // Function to handle confirmation for critical actions
    const handleConfirmation = (action) => {
        setConfirmationAction(action);
        setOpenConfirmationDialog(true);
    };

    // Function to execute the confirmed action
    const executeConfirmedAction = async () => {
        setOpenConfirmationDialog(false);
        if (confirmationAction === 'save') {
            handleSavePlace();
        } else if (confirmationAction === 'delete') {
            handleDeletePlace(currentPlace.place_id);
        }
    };

    // Function to handle active status toggle
    const handleToggleActive = () => {
        const newActiveStatus = !isActive;
        setIsActive(newActiveStatus);
        setIsDeactivationReasonRequired(!newActiveStatus); // Set required state based on new active status
        if (newActiveStatus) {
            setDeactivationReason(''); // Clear deactivation reason if toggling back to active
        }
    };

    // Statistics data
    const totalPlaces = places.length;
    const totalActivePlaces = places.filter((place) => place.is_active).length;
    const totalInactivePlaces = places.filter((place) => !place.is_active).length;

    return (
        <Box sx={{ padding: 1 }}>
            {/* Title, Search Bar, and Add Button in One Line */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Place fontSize="large" /> Place Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        placeholder="Search places..."
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: '300px' }}
                    />
                    <FormControl variant="outlined" size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Status"
                            sx={{ width: '150px' }}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Add />} onClick={handleAddPlace}>
                        Add New Place
                    </Button>
                </Box>
            </Box>

            {/* Centered Statistics Cards with Small Width (200px) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
                <Card sx={{ width: 200, textAlign: 'center', p: 2, boxShadow: 'none', cursor: 'pointer', '&:hover': { outline: `2px solid #1976d2` } }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <MeetingRoom />Places : <CountUp end={totalPlaces} duration={2} />
                    </Typography>
                </Card>
                <Card sx={{ width: 200, textAlign: 'center', p: 2, boxShadow: 'none', cursor: 'pointer', '&:hover': { outline: `2px solid #4caf50` } }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <EventAvailable /> Active : <CountUp end={totalActivePlaces} duration={2} />
                    </Typography>
                </Card>
                <Card sx={{ width: 200, textAlign: 'center', boxShadow: 'none', p: 2, cursor: 'pointer', '&:hover': { outline: `2px solid #f44336` } }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <EventBusy /> Inactive : <CountUp end={totalInactivePlaces} duration={2} />
                    </Typography>
                </Card>
            </Box>

            {/* Scrollable Place Card Area */}
            <Box
                sx={{
                    height: 'calc(100vh - 240px)', // Adjust height based on your layout
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#757575' : '#888',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#999' : '#555',
                    },
                }}
            >
                <Grid container spacing={3} sx={{ p: 2 }}>
                    {filteredPlaces.map((place) => (
                        <Grid item xs={12} sm={6} md={4} key={place.place_id}>
                            <Card sx={{ cursor: 'pointer', boxShadow: 'none', '&:hover': { outline: `2px solid #1976d2` } }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <MeetingRoom /> {place.place_name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Info /> {place.description}
                                    </Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AccessTime /> Available: {place.available_time_start} - {place.available_time_end}
                                    </Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CalendarToday /> Days: {Object.keys(JSON.parse(place.available_days)).filter((day) => JSON.parse(place.available_days)[day]).join(', ')}
                                    </Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: place.is_active ? 'green' : 'red' }}>
                                        {place.is_active ? <EventAvailable /> : <EventBusy />} Status: {place.is_active ? 'Active' : 'Inactive'}
                                    </Typography>
                                    {!place.is_active && (
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Block /> Reason: {place.deactivation_reason}
                                        </Typography>
                                    )}
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<Edit />}
                                        onClick={() => handleEditPlace(place)}
                                        sx={{
                                            color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2',
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)',
                                            },
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Delete />}
                                        onClick={() => handleConfirmation('delete')}
                                        sx={{
                                            color: theme.palette.mode === 'dark' ? '#ef9a9a' : '#f44336',
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 154, 154, 0.08)' : 'rgba(244, 67, 54, 0.08)',
                                            },
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Add/Edit Place Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{currentPlace ? 'Edit Place' : 'Add New Place'}</DialogTitle>
                <DialogContent >
                    <TextField
                        label="Place Name"
                        fullWidth
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        sx={{ mb: 2, mt: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Place />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Info />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="Available Time Start"
                            type="time"
                            fullWidth
                            value={availableTimeStart}
                            onChange={(e) => setAvailableTimeStart(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTime />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Available Time End"
                            type="time"
                            fullWidth
                            value={availableTimeEnd}
                            onChange={(e) => setAvailableTimeEnd(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTime />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Available Days:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {Object.keys(availableDays).map((day) => (
                            <FormControlLabel
                                key={day}
                                control={
                                    <Checkbox
                                        checked={availableDays[day]}
                                        onChange={(e) =>
                                            setAvailableDays((prev) => ({
                                                ...prev,
                                                [day]: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label={day}
                            />
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <EventAvailable />
                        <Typography variant="body1">Active Status:</Typography>
                        <Switch
                            checked={isActive}
                            onChange={handleToggleActive} // Use the new toggle handler
                            color="primary"
                        />
                    </Box>
                    {!isActive && (
                        <TextField
                            label="Deactivation Reason"
                            fullWidth
                            multiline
                            rows={2}
                            value={deactivationReason}
                            onChange={(e) => setDeactivationReason(e.target.value)}
                            sx={{ mb: 2 }}
                            required={isDeactivationReasonRequired} // Make the field required
                            error={isDeactivationReasonRequired && !deactivationReason.trim()} // Show error if required and empty
                            helperText={isDeactivationReasonRequired && !deactivationReason.trim() ? 'Deactivation reason is required' : ''}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Block />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={() => handleConfirmation('save')} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={openConfirmationDialog} onClose={() => setOpenConfirmationDialog(false)}>
                <DialogTitle>
                    <Warning fontSize="large" color="warning" /> Confirmation
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to {confirmationAction === 'delete' ? 'delete this place' : 'save changes'}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmationDialog(false)}>Cancel</Button>
                    <Button onClick={executeConfirmedAction} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlaceManagement;