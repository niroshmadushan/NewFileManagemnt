import React, { useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Box, Typography, Button, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { Event, Search, Add, Schedule, Person, History, Visibility, Edit } from '@mui/icons-material';
import { getUserDetails, selectDataProfiles } from '../../services/userService';
import { selectData, insertData, updateData } from '../../services/dataService';
import { toast } from 'react-hot-toast';

const CourseCreationPage = () => {
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [openCourseDialog, setOpenCourseDialog] = useState(false);
    const [openTeacherDialog, setOpenTeacherDialog] = useState(false);
    const [openStudentDialog, setOpenStudentDialog] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        description: '',
        year: '',
        expiration_date: '',
        is_active: true,
        is_private: false,
        pin: '',
    });
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const { darkMode } = useContext(ThemeContext);

    // Fetch company ID
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

    // Fetch teachers and students
    useEffect(() => {
        const fetchUsers = async () => {
            if (companyId) {
                try {
                    const teachersResponse = await selectDataProfiles({ company_id: companyId, role: 'teacher' });
                    const studentsResponse = await selectDataProfiles({ company_id: companyId, role: 'student' });
                    setTeachers(teachersResponse.data);
                    setStudents(studentsResponse.data);
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                    toast.error('Failed to fetch users. Please check the console for details.');
                }
            }
        };
        fetchUsers();
    }, [companyId]);

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            if (companyId) {
                try {
                    const response = await selectData('courses', { company_id: companyId });
                    setCourses(response.data);
                } catch (error) {
                    console.error('Failed to fetch courses:', error);
                    toast.error('Failed to fetch courses. Please check the console for details.');
                }
            }
        };
        fetchCourses();
    }, [companyId]);

    // Handle course form submission
    const handleSubmitCourse = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await updateData('courses', formData, { id: formData.id });
                toast.success('Course updated successfully!');
            } else {
                await insertData('courses', { ...formData, company_id: companyId });
                toast.success('Course created successfully!');
            }
            setOpenCourseDialog(false);
            // Refresh courses list
            const response = await selectData('courses', { company_id: companyId });
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to save course:', error);
            toast.error('Failed to save course. Please check the console for details.');
        }
    };

    // Handle teacher addition
    const handleAddTeacher = async (teacherId) => {
        try {
            await insertData('teacher_course', { course_id: selectedCourse.id, user_id: teacherId });
            toast.success('Teacher added to course successfully!');
            // Refresh teachers list
            const response = await selectData('teacher_course', { course_id: selectedCourse.id });
            setTeachers(response.data);
        } catch (error) {
            console.error('Failed to add teacher:', error);
            toast.error('Failed to add teacher. Please check the console for details.');
        }
    };

    // Handle student addition
    const handleAddStudent = async (studentId) => {
        try {
            await insertData('student_course', { course_id: selectedCourse.id, user_id: studentId });
            toast.success('Student added to course successfully!');
            // Refresh students list
            const response = await selectData('student_course', { course_id: selectedCourse.id });
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to add student:', error);
            toast.error('Failed to add student. Please check the console for details.');
        }
    };

    return (
        <Box sx={{ padding: 2 }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event sx={{ fontSize: 32, color: 'primary.main' }} />
                    Course Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        label="Search Courses"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: '300px' }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setFormData({ id: null, name: '', description: '', year: '', expiration_date: '', is_active: true, is_private: false, pin: '' });
                            setOpenCourseDialog(true);
                        }}
                        sx={{ borderRadius: '20px', textTransform: 'none', padding: '10px 20px' }}
                    >
                        Create New Course
                    </Button>
                </Box>
            </Box>

            {/* Course Cards */}
            <Box
                sx={{
                    p: 2,
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
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
                    {courses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Box
                                sx={{
                                    border: '1px solid',
                                    borderColor: darkMode ? '#666' : '#ddd',
                                    borderRadius: 2,
                                    padding: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Typography variant="h6">{course.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {course.description}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setSelectedCourse(course);
                                            setFormData(course);
                                            setOpenCourseDialog(true);
                                        }}
                                        sx={{ color: 'primary.main', '&:hover': { backgroundColor: 'primary.main', color: 'white' } }}
                                    >
                                        <Edit /> Edit
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setSelectedCourse(course);
                                            // Open view dialog
                                        }}
                                        sx={{ color: 'primary.main', '&:hover': { backgroundColor: 'primary.main', color: 'white' } }}
                                    >
                                        <Visibility /> View
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Course Dialog */}
            <Dialog open={openCourseDialog} onClose={() => setOpenCourseDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Event sx={{ color: 'primary.main' }} />
                        {formData.id ? 'Edit Course' : 'Create New Course'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Course Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={4}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Year"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Expiration Date"
                                type="date"
                                value={formData.expiration_date}
                                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                                fullWidth
                            />
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Active Status"
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Private Course"
                                    type="checkbox"
                                    checked={formData.is_private}
                                    onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="PIN (6 digits)"
                                    value={formData.pin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d+$/.test(value) && value.length <= 6) {
                                            setFormData({ ...formData, pin: value });
                                        }
                                    }}
                                    inputProps={{ maxLength: 6 }}
                                    fullWidth
                                    helperText={
                                        formData.pin.length === 6
                                            ? 'Valid PIN'
                                            : 'Enter a 6-digit PIN'
                                    }
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCourseDialog(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmitCourse}
                            variant="contained"
                            color="primary"
                        >
                            {formData.id ? 'Update Course' : 'Create Course'}
                        </Button>
                    </DialogActions>
                </Dialog>
    
                {/* View Course Details Dialog */}
                <Dialog
                    open={selectedCourse !== null}
                    onClose={() => setSelectedCourse(null)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Event sx={{ color: 'primary.main' }} />
                            Course Details
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6">Course Information</Typography>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Name:</TableCell>
                                            <TableCell>{selectedCourse?.name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Description:</TableCell>
                                            <TableCell>{selectedCourse?.description}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Year:</TableCell>
                                            <TableCell>{selectedCourse?.year}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Expiration Date:</TableCell>
                                            <TableCell>{selectedCourse?.expiration_date}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Status:</TableCell>
                                            <TableCell>
                                                {selectedCourse?.is_active ? 'Active' : 'Inactive'}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Private:</TableCell>
                                            <TableCell>
                                                {selectedCourse?.is_private ? 'Yes' : 'No'}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>PIN:</TableCell>
                                            <TableCell>{selectedCourse?.pin}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Grid>
    
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => setOpenTeacherDialog(true)}
                                    >
                                        Add Teacher
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => setOpenStudentDialog(true)}
                                    >
                                        Add Student
                                    </Button>
                                </Box>
                            </Grid>
    
                            <Grid item xs={12}>
                                <Typography variant="h6">Attached Teachers</Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {teachers.map((teacher) => (
                                            <TableRow key={teacher.id}>
                                                <TableCell>{teacher.full_name}</TableCell>
                                                <TableCell>{teacher.email}</TableCell>
                                                <TableCell>
                                                    {teacher.is_active ? 'Active' : 'Inactive'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
    
                            <Grid item xs={12}>
                                <Typography variant="h6">Attached Students</Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {students.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell>{student.full_name}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell>
                                                    {student.is_active ? 'Active' : 'Inactive'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </Grid>
                    </DialogContent>
                </Dialog>
    
                {/* Add Teacher Dialog */}
                <Dialog
                    open={openTeacherDialog}
                    onClose={() => setOpenTeacherDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ color: 'primary.main' }} />
                            Add Teacher to Course
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Search Teachers"
                                    variant="outlined"
                                    size="small"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ width: '100%' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {teachers
                                            .filter((teacher) =>
                                                teacher.full_name
                                                    .toLowerCase()
                                                    .includes(searchQuery)
                                            )
                                            .map((teacher) => (
                                                <TableRow key={teacher.id}>
                                                    <TableCell>{teacher.full_name}</TableCell>
                                                    <TableCell>{teacher.email}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => handleAddTeacher(teacher.id)}
                                                        >
                                                            Add
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </Grid>
                    </DialogContent>
                </Dialog>
    
                {/* Add Student Dialog */}
                <Dialog
                    open={openStudentDialog}
                    onClose={() => setOpenStudentDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ color: 'primary.main' }} />
                            Add Student to Course
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Search Students"
                                    variant="outlined"
                                    size="small"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ width: '100%' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {students
                                            .filter((student) =>
                                                student.full_name
                                                    .toLowerCase()
                                                    .includes(searchQuery)
                                            )
                                            .map((student) => (
                                                <TableRow key={student.id}>
                                                    <TableCell>{student.full_name}</TableCell>
                                                    <TableCell>{student.email}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => handleAddStudent(student.id)}
                                                        >
                                                            Add
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </Grid>
                    </DialogContent>
                </Dialog>
            </Box>
        );
    };
    
    export default CourseCreationPage;