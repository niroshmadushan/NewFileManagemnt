import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    TextField,
    Grid,
    Paper,
} from '@mui/material';
import { selectData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { toast } from 'react-hot-toast';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Place, Event, Schedule, AccessTime } from '@mui/icons-material';

const PlaceAvailability = () => {
    const [places, setPlaces] = useState([]); // State to store all places
    const [filteredPlaces, setFilteredPlaces] = useState([]); // State to store filtered places based on availability
    const [selectedPlace, setSelectedPlace] = useState(null); // State to store the selected place
    const [companyId, setCompanyId] = useState(null); // State to store the company ID
    const [bookings, setBookings] = useState([]); // State to store bookings for the selected place and date
    const [freeSlots, setFreeSlots] = useState([]); // State to store free time slots
    const [selectedDate, setSelectedDate] = useState(new Date()); // State to store the selected date
    const { darkMode } = useContext(ThemeContext); // Access dark mode theme

    // Fetch the company ID from user details
    useEffect(() => {
        const fetchCompanyId = async () => {
            try {
                const userDetails = await getUserDetails();
                setCompanyId(userDetails.company_id); // Set the company ID
            } catch (error) {
                console.error('Failed to fetch user details:', error);
                toast.error('Failed to fetch user details. Please check the console for details.');
            }
        };

        fetchCompanyId();
    }, []);

    // Fetch places related to the company
    useEffect(() => {
        const fetchPlaces = async () => {
            if (companyId) {
                try {
                    const response = await selectData('places', { is_deleted: false, company_id: companyId });
                    if (response && response.data) {
                        setPlaces(response.data); // Set the list of places
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
            const dayName = selectedDate.toLocaleString('en-US', { weekday: 'long' }); // Get the day name for the selected date
            const filtered = places.filter((place) => {
                const availableDays = JSON.parse(place.available_days);
                return availableDays[dayName]; // Only include places available on the selected day
            });
            setFilteredPlaces(filtered); // Set the filtered places
        }
    }, [selectedDate, places]);

    // Fetch bookings for the selected place and date
    useEffect(() => {
        const fetchBookings = async () => {
            if (selectedPlace && selectedDate) {
                try {
                    const formattedDate = selectedDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
                    const response = await selectData('invitations', {
                        place_id: selectedPlace.place_id,
                        date: formattedDate, // Filter bookings by date
                    });
                    if (response && response.data) {
                        setBookings(response.data); // Set the list of bookings
                    }
                } catch (error) {
                    console.error('Failed to fetch bookings:', error);
                    toast.error('Failed to fetch bookings. Please check the console for details.');
                }
            }
        };

        fetchBookings();
    }, [selectedPlace, selectedDate]);

    // Calculate free time slots
    useEffect(() => {
        if (selectedPlace) {
            const availableStart = selectedPlace.available_time_start; // e.g., "08:00"
            const availableEnd = selectedPlace.available_time_end; // e.g., "17:00"

            // Convert time strings to minutes since midnight
            const toMinutes = (time) => {
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
            };

            // Convert minutes since midnight to time string
            const toTimeString = (minutes) => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            };

            // If no bookings, the entire time range is free
            if (bookings.length === 0) {
                setFreeSlots([{ start: availableStart, end: availableEnd }]);
                return;
            }

            // Sort bookings by start time
            const sortedBookings = [...bookings].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

            // Calculate free slots
            const slots = [];
            let previousEnd = toMinutes(availableStart);

            sortedBookings.forEach((booking) => {
                const bookingStart = toMinutes(booking.start_time);
                const bookingEnd = toMinutes(booking.end_time);

                if (bookingStart > previousEnd) {
                    // There's a gap between the previous booking and the current one
                    slots.push({
                        start: toTimeString(previousEnd),
                        end: toTimeString(bookingStart),
                    });
                }

                previousEnd = Math.max(previousEnd, bookingEnd);
            });

            // Check for a gap after the last booking
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

    // Handle place selection from the dropdown
    const handlePlaceChange = (event) => {
        const placeId = event.target.value;
        const selected = filteredPlaces.find((place) => place.place_id === placeId);
        setSelectedPlace(selected); // Set the selected place
    };

    // Handle date selection
    const handleDateChange = (date) => {
        setSelectedDate(date); // Set the selected date
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ padding: 2 }}>
                {/* Page Title */}
                <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>
                    Place Availability
                </Typography>

                {/* Select Place and Date in One Line */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    {/* Select Place Dropdown */}
                    <FormControl sx={{ width: '300px' }}>
                        <InputLabel>Select Place</InputLabel>
                        <Select
                            value={selectedPlace ? selectedPlace.place_id : ''}
                            onChange={handlePlaceChange}
                            label="Select Place"
                        >
                            {filteredPlaces.map((place) => (
                                <MenuItem key={place.place_id} value={place.place_id}>
                                    {place.place_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Date Picker */}
                    <DatePicker
                        label="Select Date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </Box>

                {/* Three-Column Layout */}
                {selectedPlace && (
                    <Grid container spacing={3}>
                        {/* Place Details */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Place sx={{ mr: 1 }} />
                                        {selectedPlace.place_name}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                        <Schedule sx={{ mr: 1 }} />
                                        Available Days: {Object.keys(JSON.parse(selectedPlace.available_days))
                                            .filter((day) => JSON.parse(selectedPlace.available_days)[day])
                                            .join(', ')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                        <AccessTime sx={{ mr: 1 }} />
                                        Available Time: {selectedPlace.available_time_start} - {selectedPlace.available_time_end}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Existing Bookings */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Event sx={{ mr: 1 }} />
                                        Existing Bookings
                                    </Typography>
                                    {bookings.length > 0 ? (
                                        <List
                                            sx={{
                                                maxHeight: '300px',
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
                                            {bookings.map((booking, index) => (
                                                <ListItem key={booking.invitation_id}>
                                                    <ListItemText
                                                        primary={`${index + 1}. ${booking.start_time} - ${booking.end_time}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body1">No bookings found for this place on the selected date.</Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Free Time Slots */}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <AccessTime sx={{ mr: 1 }} />
                                        Free Time Slots
                                    </Typography>
                                    {freeSlots.length > 0 ? (
                                        <List
                                            sx={{
                                                maxHeight: '300px',
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
                                            {freeSlots.map((slot, index) => (
                                                <ListItem key={index}>
                                                    <ListItemText
                                                        primary={`${index + 1}. ${slot.start} - ${slot.end}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body1">No free slots available.</Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default PlaceAvailability;