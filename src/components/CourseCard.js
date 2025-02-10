import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Edit, Visibility, CalendarToday, Event, Lock, LockOpen, CheckCircle, Cancel, VpnKey, Description, People, School } from "@mui/icons-material";

// Helper function to format date properly
const formatDate = (isoDate) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const CourseCard = ({ course, setSelectedCourse, setOpenDialog, refreshCourses, setAssignRole, setOpenAssignDialog }) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          position: "relative",
          p: 3,
          borderRadius: 2,
          boxShadow: "none",
          
        }}
      >
        <CardContent>
          {/* Course Name */}
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Event color="primary" />
            {course.name}
          </Typography>

          {/* Course Description */}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {course.description}
          </Typography>

          {/* Course Year */}
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="body2">Year: {course.year}</Typography>
          </Box>

          {/* Expiration Date (Formatted) */}
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Event fontSize="small" color="action" />
            <Typography variant="body2">Expires on: {formatDate(course.expired_date)}</Typography>
          </Box>

          {/* Status & Privacy Chips */}
          <Box display="flex" gap={1} mt={2}>
            <Chip
              icon={course.is_active ? <CheckCircle /> : <Cancel />}
              label={course.is_active ? "Active" : "Inactive"}
              color={course.is_active ? "success" : "error"}
            />
            <Chip
              icon={course.is_private ? <Lock /> : <LockOpen />}
              label={course.is_private ? "Private" : "Public"}
              color={course.is_private ? "warning" : "primary"}
            />
          </Box>
        </CardContent>

        {/* Actions: Edit & View */}
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <Tooltip title="Edit Course">
            <IconButton
              onClick={() => {
                setSelectedCourse(course);
                setOpenDialog(true);
              }}
            >
              <Edit color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Course Details">
            <IconButton onClick={() => setViewDialogOpen(true)}>
              <Visibility color="secondary" />
            </IconButton>
          </Tooltip>
        </Box>
      </Card>

      {/* View Course Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Visibility color="primary" />
          Course Details
        </DialogTitle>
        <DialogContent>
          {/* Course Name */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Event color="action" />
            <Typography variant="body1"><strong>Name:</strong> {course.name}</Typography>
          </Box>

          {/* Description */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Description color="action" />
            <Typography variant="body1"><strong>Description:</strong> {course.description}</Typography>
          </Box>

          {/* Year */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CalendarToday color="action" />
            <Typography variant="body1"><strong>Year:</strong> {course.year}</Typography>
          </Box>

          {/* Expiration Date */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Event color="action" />
            <Typography variant="body1"><strong>Expires on:</strong> {formatDate(course.expired_date)}</Typography>
          </Box>

          {/* PIN */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <VpnKey color="action" />
            <Typography variant="body1"><strong>PIN:</strong> {course.pin}</Typography>
          </Box>

          {/* Status & Privacy */}
          <Box display="flex" gap={2} mt={2}>
            <Chip
              icon={course.is_active ? <CheckCircle /> : <Cancel />}
              label={course.is_active ? "Active" : "Inactive"}
              color={course.is_active ? "success" : "error"}
            />
            <Chip
              icon={course.is_private ? <Lock /> : <LockOpen />}
              label={course.is_private ? "Private" : "Public"}
              color={course.is_private ? "warning" : "primary"}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          {/* Add Teacher Button */}
          <Button
            variant="contained"
            startIcon={<People />}
            onClick={() => {
              setSelectedCourse(course);
              setAssignRole("teacher");
              setOpenAssignDialog(true);
              setViewDialogOpen(false); // Close the view dialog
            }}
          >
            Add Teacher
          </Button>

          {/* Add Student Button */}
          <Button
            variant="contained"
            startIcon={<School />}
            color="secondary"
            onClick={() => {
              setSelectedCourse(course);
              setAssignRole("student");
              setOpenAssignDialog(true);
              setViewDialogOpen(false); // Close the view dialog
            }}
          >
            Add Student
          </Button>

          <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CourseCard;
