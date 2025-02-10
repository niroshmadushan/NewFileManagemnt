import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Grid,
  Box,
  InputAdornment,
} from "@mui/material";
import { Description, Lock, Event, CalendarToday, CheckCircle, Cancel, Warning } from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import { insertData, updateData } from "../services/dataService";
import { getUserDetails } from "../services/userService";

const AddEditCourseDialog = ({ open, setOpen, selectedCourse }) => {
  const [courseData, setCourseData] = useState({
    name: "",
    description: "",
    year: new Date().getFullYear(),
    expired_date: "",
    pin: "",
    is_active: true,
    is_private: false,
  });

  const [companyId, setCompanyId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const userDetails = await getUserDetails();
        setCompanyId(userDetails.company_id);
      } catch (error) {
        showToast("Failed to fetch company details.", "error");
      }
    };
    fetchCompanyId();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      setCourseData(selectedCourse);
    } else {
      setCourseData({
        name: "",
        description: "",
        year: new Date().getFullYear(),
        expired_date: "",
        pin: "",
        is_active: true,
        is_private: false,
      });
    }
  }, [selectedCourse]);

  const handleSubmit = async () => {
    if (!companyId) {
      showToast("Company ID not found.", "error");
      return;
    }

    if (courseData.pin.length !== 6 || isNaN(courseData.pin)) {
      showToast("Pin must be a 6-digit number.", "error");
      return;
    }

    setConfirmDialogOpen(true); // Show confirmation dialog before saving
  };

  const handleConfirmSave = async () => {
    try {
      const data = { ...courseData, company_id: companyId };

      if (selectedCourse) {
        await updateData("courses", data, { id: selectedCourse.id });
        showToast("Course updated!", "success");
      } else {
        await insertData("courses", data);
        showToast("Course created!", "success");
      }

      setOpen(false);
      setConfirmDialogOpen(false);
    } catch (error) {
      showToast("Failed to save course.", "error");
    }
  };

  // Custom Toast Notification (Supports Dark & Light Mode)
  const showToast = (message, type) => {
    toast[type](message, {
      style: {
        background: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#333" : "#fff",
        color: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#fff" : "#333",
      },
      iconTheme: {
        primary: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#90caf9" : "#007bff",
        secondary: window.matchMedia("(prefers-color-scheme: dark)").matches ? "#333" : "#fff",
      },
    });
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Event color="primary" />
          {selectedCourse ? "Edit Course" : "Add New Course"}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Course Name */}
            <Grid item xs={12}>
              <TextField
                label="Course Name"
                fullWidth
                value={courseData.name}
                onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              />
            </Grid>

            {/* Year */}
            <Grid item xs={6}>
              <TextField
                label="Year"
                type="number"
                fullWidth
                value={courseData.year}
                onChange={(e) => setCourseData({ ...courseData, year: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Expired Date */}
            <Grid item xs={6}>
              <TextField
                label="Expired Date"
                type="date"
                fullWidth
                value={courseData.expired_date}
                onChange={(e) => setCourseData({ ...courseData, expired_date: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Event />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Pin */}
            <Grid item xs={6}>
              <TextField
                label="6-digit PIN"
                type="password"
                fullWidth
                value={courseData.pin}
                onChange={(e) => setCourseData({ ...courseData, pin: e.target.value })}
                inputProps={{ maxLength: 6 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* is_active & is_private */}
            <Grid item xs={6}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={courseData.is_active}
                      onChange={(e) => setCourseData({ ...courseData, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={courseData.is_private}
                      onChange={(e) => setCourseData({ ...courseData, is_private: e.target.checked })}
                    />
                  }
                  label="Private"
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} startIcon={<Cancel />} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} startIcon={<CheckCircle />} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="error" />
          Are you sure?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Do you really want to {selectedCourse ? "update" : "create"} this course?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSave} color="primary" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddEditCourseDialog;
