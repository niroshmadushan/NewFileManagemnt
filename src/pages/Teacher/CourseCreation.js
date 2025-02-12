import React, { useState, useEffect, useContext } from "react";
import {
    Box,
    Typography,
    Button,
    Grid,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    MenuItem,
} from "@mui/material";
import { Search, Add } from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { selectData } from "../../services/dataService";
import { getUserDetails } from "../../services/userService";
import { ThemeContext } from "../../context/ThemeContext";
import CourseCard from "../../components/CourseCard";
import AddEditCourseDialog from "../../components/AddEditCourseDialog";
import AssignUserDialog from "../../components/AssignUserDialog";

const CourseManagement = () => {
    const { darkMode } = useContext(ThemeContext);
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [assignRole, setAssignRole] = useState(""); // "teacher" or "student"
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [uniqueYears, setUniqueYears] = useState([]); // Stores available years for filtering

    // Fetch company ID & courses
    useEffect(() => {
        const fetchCompanyId = async () => {
            try {
                const userDetails = await getUserDetails();
                if (userDetails?.company_id) {
                    setCompanyId(userDetails.company_id);
                    refreshCourses(userDetails.company_id);
                } else {
                    toast.error("Company ID not found.");
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                toast.error("Failed to fetch user details.");
            }
        };
        fetchCompanyId();
    }, []);

    // Fetch courses and extract unique years
    const refreshCourses = async (companyId) => {
        if (!companyId) return;
        try {
            const response = await selectData("courses", { company_id: companyId });
            const coursesData = response?.data || [];

            setCourses(coursesData);

            // Extract unique years for filtering
            const years = [...new Set(coursesData.map(course => course.year))].sort();
            setUniqueYears(years);
        } catch (error) {
            console.error("Error fetching courses:", error);
            toast.error("Failed to fetch courses.");
        }
    };

    // Handle Search & Filtering
    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesYear = filterYear ? course.year === filterYear : true;
        const matchesStatus = activeTab === 0 ? course.is_active : !course.is_active;
        return matchesSearch && matchesYear && matchesStatus;
    });

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">📚 Course Management</Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                        label="Search Course"
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
                    />
                    {/* Year Filter */}
                    <TextField
                        select
                        label="Filter by Year"
                        size="small"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        sx={{ width: 150 }}
                    >
                        <MenuItem value="">All Years</MenuItem>
                        {uniqueYears.map((year) => (
                            <MenuItem key={year} value={year}>
                                {year}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="Active" />
                        <Tab label="Inactive" />
                    </Tabs>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedCourse(null);
                            setOpenDialog(true);
                        }}
                    >
                        Add Course
                    </Button>
                </Box>
            </Box>

            {/* Course List */}
            <Box sx={{
                maxHeight: "70vh",
                overflowY: "auto",
                p:2,
                "&::-webkit-scrollbar": { width: "8px" },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: darkMode ? "#757575" : "#888",
                    borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: darkMode ? "#999" : "#555",
                },
            }}>
                <Grid container spacing={2}>
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                            <Grid item xs={12} sm={6} md={4} key={course.id}>
                                <CourseCard
                                    course={course}
                                    setSelectedCourse={setSelectedCourse}
                                    setOpenDialog={setOpenDialog}
                                    refreshCourses={() => refreshCourses(companyId)}
                                    setAssignRole={setAssignRole} // ✅ Enables role selection
                                    setOpenAssignDialog={setOpenAssignDialog} // ✅ Opens the assign dialog
                                />
                            </Grid>
                        ))
                    ) : (
                        <Typography variant="h6" sx={{ textAlign: "center", width: "100%", mt: 3, color: "gray" }}>
                            No courses found.
                        </Typography>
                    )}
                </Grid>
            </Box>

            {/* Add/Edit Course Dialog */}
            <AddEditCourseDialog
                open={openDialog}
                setOpen={setOpenDialog}
                selectedCourse={selectedCourse}
                refreshCourses={() => refreshCourses(companyId)} // ✅ Ensures real-time updates
            />

            {/* Assign Teachers/Students Dialog */}
            {selectedCourse && (
                <AssignUserDialog
                    open={openAssignDialog}
                    setOpen={setOpenAssignDialog}
                    courseId={selectedCourse.id}
                    role={assignRole}
                    refreshCourses={() => refreshCourses(companyId)} // ✅ Updates course list
                />
            )}
        </Box>
    );
};

export default CourseManagement;
