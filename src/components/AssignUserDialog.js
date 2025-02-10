import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    CircularProgress,
    TextField,
    Box,
    Divider,
} from "@mui/material";
import { Add, Delete, Search, People, School, Warning } from "@mui/icons-material";
import toast, { Toaster } from "react-hot-toast";
import { selectData, insertData, updateData, selectDataProfiles } from "../services/dataService";

const AssignUserDialog = ({ open, setOpen, courseId, role, refreshCourses }) => {
    const [users, setUsers] = useState([]);
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchAssigned, setSearchAssigned] = useState("");
    const [searchAvailable, setSearchAvailable] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmType, setConfirmType] = useState(""); // "assign" or "remove"
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchAssignedUsers();
        }
    }, [open]);

    // Fetch users based on role
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await selectDataProfiles({ role });
            setUsers(response.data || []);
        } catch (error) {
            showToast("Failed to fetch users.", "error");
        }
        setLoading(false);
    };

    // Fetch assigned users
    const fetchAssignedUsers = async () => {
        setLoading(true);
        try {
            const response = await selectData(role === "teacher" ? "teacher_course" : "student_course", {
                course_id: courseId,
                is_deleted: false,
            });
            setAssignedUsers(response.data || []);
        } catch (error) {
            showToast("Failed to fetch assigned users.", "error");
        }
        setLoading(false);
    };

    // Handle Assign User Click (Confirmation)
    const handleAssignUserClick = (user) => {
        setSelectedUser(user);
        setConfirmType("assign");
        setConfirmDialogOpen(true);
    };

    // Handle Remove User Click (Confirmation)
    const handleRemoveUserClick = (user) => {
        setSelectedUser(user);
        setConfirmType("remove");
        setConfirmDialogOpen(true);
    };

    // Assign User
    const handleAssignUser = async () => {
        if (!selectedUser) return;

        try {
            await insertData(role === "teacher" ? "teacher_course" : "student_course", {
                course_id: courseId,
                user_id: selectedUser.id,
                full_name: selectedUser.full_name,
                email: selectedUser.email,
                is_active: true,
                is_deleted: false,
            });

            showToast(`${role} assigned successfully!`, "success");
            fetchAssignedUsers();
            refreshCourses();
        } catch (error) {
            showToast("Failed to assign user.", "error");
        } finally {
            setConfirmDialogOpen(false);
            setSelectedUser(null);
        }
    };

    // Remove User (Soft Delete)
    const handleRemoveUser = async () => {
        if (!selectedUser) return;

        try {
            await updateData(role === "teacher" ? "teacher_course" : "student_course",
                { is_deleted: true },
                { course_id: courseId, user_id: selectedUser.user_id }
            );

            showToast(`${role} removed successfully!`, "success");
            fetchAssignedUsers();
            refreshCourses();
        } catch (error) {
            showToast("Failed to remove user.", "error");
        } finally {
            setConfirmDialogOpen(false);
            setSelectedUser(null);
        }
    };

    // Toast Notification (Supports Dark & Light Mode)
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
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {role === "teacher" ? "Assign Teachers" : "Assign Students"}
                </DialogTitle>
                <DialogContent>
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Box sx={{ display: "flex", gap: 2 }}>
                            {/* Assigned Users Section */}
                            <Box sx={{ flex: 1, border: "1px solid #ddd", borderRadius: "8px", p: 2 }}>
                                <Typography variant="subtitle1">Assigned {role === "teacher" ? "Teachers" : "Students"}</Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Search by name or email"
                                    value={searchAssigned}
                                    onChange={(e) => setSearchAssigned(e.target.value.toLowerCase())}
                                    sx={{ my: 1 }}
                                />
                                <List>
                                    {assignedUsers
                                        .filter(user =>
                                            user.full_name.toLowerCase().includes(searchAssigned) ||
                                            user.email.toLowerCase().includes(searchAssigned)
                                        )
                                        .map((user) => (
                                            <ListItem key={user.user_id}>
                                                <ListItemText primary={user.full_name} secondary={user.email} />
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" onClick={() => handleRemoveUserClick(user)}>
                                                        <Delete color="error" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                </List>
                            </Box>

                            <Divider orientation="vertical" flexItem />

                            {/* Available Users Section */}
                            <Box sx={{ flex: 1, border: "1px solid #ddd", borderRadius: "8px", p: 2 }}>
                                <Typography variant="subtitle1">Available {role === "teacher" ? "Teachers" : "Students"}</Typography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Search by name or email"
                                    value={searchAvailable}
                                    onChange={(e) => setSearchAvailable(e.target.value.toLowerCase())}
                                    sx={{ my: 1 }}
                                />
                                <List>
                                    {users
                                        .filter(user =>
                                            !assignedUsers.some((assigned) => assigned.user_id === user.id) &&
                                            (user.full_name.toLowerCase().includes(searchAvailable) ||
                                                user.email.toLowerCase().includes(searchAvailable))
                                        )
                                        .map((user) => (
                                            <ListItem key={user.id}>
                                                <ListItemText primary={user.full_name} secondary={user.email} />
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" onClick={() => handleAssignUserClick(user)}>
                                                        <Add color="primary" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        ))}
                                </List>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} variant="outlined">Close</Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Assign & Remove */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>
                    <Warning color="error" />
                    Are you sure?
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Do you really want to {confirmType === "assign" ? "assign" : "remove"}{" "}
                        <strong>{selectedUser?.full_name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmType === "assign" ? handleAssignUser : handleRemoveUser} color="primary" variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AssignUserDialog;
