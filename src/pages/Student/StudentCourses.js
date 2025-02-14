import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import {
    Box,
    Typography,
    Button,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { selectData, insertData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { toast } from 'react-hot-toast';

const StudentCourses = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [pin, setPin] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const { darkMode } = useContext(ThemeContext);

    // Fetch the current user details and courses
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                const userId = userDetails.id;

                // Fetch all courses
                const allCourses = await selectData('courses', { is_deleted: 0, is_active: 1 });

                // Fetch courses the student has already attended
                const attendedCourses = await selectData('student_course', { user_id: userId, is_deleted: 0 });

                // Filter out courses the student has already attended
                const availableCourses = allCourses.data.filter(course => 
                    !attendedCourses.data.some(attended => attended.course_id === course.id)
                );

                setCourses(availableCourses);
                setFilteredCourses(availableCourses);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to fetch data. Please check the console for details.');
            }
        };

        fetchData();
    }, []);

    // Handle course card click
    const handleCourseClick = (course) => {
        setSelectedCourse(course);
        setOpenDialog(true);
    };

    // Handle PIN input change
    const handlePinChange = (e) => {
        setPin(e.target.value);
    };

    // Handle course attendance
    const handleAttendCourse = async () => {
        if (pin !== selectedCourse.pin) {
            toast.error('Invalid PIN. Please try again.');
            return;
        }

        try {
            const userDetails = await getUserDetails();
            const userId = userDetails.id;

            // Insert record into student_course table
            await insertData('student_course', {
                course_id: selectedCourse.id,
                user_id: userId,
                is_active: 1,
                is_deleted: 0,
                full_name: userDetails.full_name,
                email: userDetails.email,
            });

            // Show success popup
            setOpenSuccessDialog(true);
            setOpenDialog(false);

            // Remove the attended course from the list
            setFilteredCourses(filteredCourses.filter(course => course.id !== selectedCourse.id));
        } catch (error) {
            console.error('Failed to attend course:', error);
            toast.error('Failed to attend course. Please check the console for details.');
        }
    };

    return (
        <Box sx={{ padding: 2 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Available Courses
                </Typography>
            </Box>

            {/* Course Cards */}
            <Box
                sx={{
                    p: 2,
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
                    {filteredCourses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Box
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: darkMode ? '#424242' : '#e0e0e0',
                                    borderRadius: '8px',
                                    backgroundColor: darkMode ? '#333' : '#fff',
                                    color: darkMode ? '#fff' : '#000',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        boxShadow: 3,
                                    },
                                }}
                                onClick={() => handleCourseClick(course)}
                            >
                                <Typography variant="h6">{course.name}</Typography>
                                <Typography variant="body2">{course.description}</Typography>
                                <Button variant="contained" sx={{ mt: 2 }}>
                                    Attend Now
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* PIN Verification Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Enter PIN to Attend Course</DialogTitle>
                <DialogContent>
                    <TextField
                        label="PIN"
                        type="password"
                        value={pin}
                        onChange={handlePinChange}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAttendCourse} variant="contained" color="primary">
                        Attend
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={openSuccessDialog} onClose={() => setOpenSuccessDialog(false)}>
                <DialogTitle>Success!</DialogTitle>
                <DialogContent>
                    <Typography>You have successfully attended the course.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSuccessDialog(false)} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudentCourses;