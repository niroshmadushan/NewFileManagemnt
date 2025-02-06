import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    IconButton,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { Add, Save, Title, Description, DateRange, AttachMoney, AssignmentInd, PendingActions, Edit, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../../context/ThemeContext';
import { format, parseISO } from 'date-fns'; // Import date-fns for date formatting

const MemberPlanPage = () => {
    const [selectedMember, setSelectedMember] = useState(null); // Selected member will be the logged-in user
    const { darkMode } = useContext(ThemeContext);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openCompletedDialog, setOpenCompletedDialog] = useState(false); // For completion description
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // For "Are you sure?" confirmation
    const [currentTask, setCurrentTask] = useState(null);
    const [completedDescription, setCompletedDescription] = useState(''); // For completion reason
    const [newTask, setNewTask] = useState({
        plan_name: '',
        description: '',
        date: '',
        budget_revenue: 0,
        status: 'Pending',
        assigned_by: 'Own',
        is_editable: false,
    });
    const [validationErrors, setValidationErrors] = useState({
        plan_name: false,
        date: false,
    });
    const theme = useTheme();

    // Function to format date in a user-friendly way (e.g., "15 Jan 2025")
    const formatDate = (dateString) => {
        if (!dateString) return ''; // Handle empty dates
        const date = parseISO(dateString); // Parse the date string to a Date object
        return format(date, 'dd MMM yyyy'); // Format the date as "15 Jan 2025"
    };

    // Fetch tasks when month or year changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                setSelectedMember({ id: userDetails.id, team_id: userDetails.team_id }); // Set selected member to logged-in user

                // Fetch tasks for the logged-in user
                const tasksResponse = await selectData('member_plan', { member_id: userDetails.id });
                const filteredTasks = tasksResponse.data.filter(
                    (task) => task.month === month && task.year === Number(year) // Ensure year is a number
                );
                setTasks(filteredTasks);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                toast.error('Failed to fetch data.', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            }
        };

        fetchData();
    }, [month, year]); // Re-fetch when month or year changes

    const handleAddTask = async () => {
        // Validate required fields
        if (!newTask.plan_name || !newTask.date) {
            setValidationErrors({
                plan_name: !newTask.plan_name,
                date: !newTask.date,
            });
            toast.error('Task Name and Date are required.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            return;
        }

        if (!selectedMember) {
            toast.error('User not found.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            return;
        }

        setLoading(true);

        try {
            const taskData = {
                ...newTask,
                member_id: selectedMember.id,
                team_id: selectedMember.team_id,
                month,
                year: Number(year), // Ensure year is a number
                is_editable: false,
            };

            await insertData('member_plan', taskData);
            toast.success('Task added successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenAddDialog(false);
            setNewTask({
                plan_name: '',
                description: '',
                date: '',
                budget_revenue: 0,
                status: 'Pending',
                assigned_by: 'Own',
                is_editable: false,
            });
            setValidationErrors({ plan_name: false, date: false }); // Reset validation errors

            // Refresh tasks
            const tasksResponse = await selectData('member_plan', { member_id: selectedMember.id, month, year: Number(year) });
            setTasks(tasksResponse.data);
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Failed to add task.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditTask = (task) => {
        // Format the date correctly for the input field (YYYY-MM-DD)
        const formattedDate = task.date ? format(parseISO(task.date), 'yyyy-MM-dd') : '';
        setCurrentTask({
            ...task,
            date: formattedDate,
        });
        setOpenEditDialog(true);
    };

    const handleUpdateTask = async () => {
        if (!currentTask) return;

        // Validate required fields
        if (!currentTask.plan_name || !currentTask.date) {
            setValidationErrors({
                plan_name: !currentTask.plan_name,
                date: !currentTask.date,
            });
            toast.error('Task Name and Date are required.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            return;
        }

        setLoading(true);

        try {
            const updatedTaskData = {
                ...currentTask,
                month,
                year: Number(year), // Ensure year is a number
            };

            await updateData('member_plan', updatedTaskData, { id: currentTask.id });
            toast.success('Task updated successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenEditDialog(false);
            setValidationErrors({ plan_name: false, date: false }); // Reset validation errors

            // Refresh tasks
            const tasksResponse = await selectData('member_plan', { member_id: selectedMember.id, month, year: Number(year) });
            setTasks(tasksResponse.data);
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (task, newStatus) => {
        setCurrentTask({ ...task, newStatus }); // Set the current task and new status
        setOpenConfirmDialog(true); // Show "Are you sure?" confirmation dialog
    };

    const updateTaskStatus = async (task, newStatus, completionReason = null) => {
        setLoading(true);

        try {
            const updatedTaskData = {
                status: newStatus, // Update only the status
                Complete_description: newStatus === 'Completed' ? completionReason : null, // Update completion reason if status is 'Completed'
            };

            // Update only the status and Completed_description fields in the database
            await updateData('member_plan', updatedTaskData, { id: task.id });

            toast.success('Status updated successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });

            // Refresh tasks
            const tasksResponse = await selectData('member_plan', { member_id: selectedMember.id, month, year: Number(year) });
            setTasks(tasksResponse.data);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCompletedTask = async () => {
        if (!currentTask) return;

        // Pass the new status ('Completed') and the completion reason
        await updateTaskStatus(currentTask, 'Completed', completedDescription);

        // Close the completion dialog and reset the completion reason
        setOpenCompletedDialog(false);
        setCompletedDescription('');
    };

    const handleConfirmCompleted = async () => {
        setOpenConfirmDialog(false); // Close the confirmation dialog

        if (currentTask.newStatus === 'Completed') {
            setOpenCompletedDialog(true); // Open the completion description modal
        } else {
            // For other status changes, update the status immediately
            await updateTaskStatus(currentTask, currentTask.newStatus);
        }
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Paper sx={{ padding: 3, borderRadius: 4, boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        My Plans
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Month</InputLabel>
                            <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value)}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))} // Ensure year is a number
                            size="small"
                            sx={{ width: 100 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenAddDialog(true)}
                        >
                            Add Task
                        </Button>
                    </Box>
                </Box>

                {/* Tasks Table */}
                <TableContainer
                    sx={{
                        maxHeight: 450,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#f5f5f5',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#757575' : '#bdbdbd',
                            borderRadius: '4px',
                            '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#999' : '#9e9e9e',
                            },
                        },
                    }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Plan Name</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Budget/Revenue</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Assigned By</TableCell>
                                <TableCell>Editable</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.id}</TableCell>
                                    <TableCell>{task.plan_name}</TableCell>
                                    <TableCell>{formatDate(task.date)}</TableCell> {/* Use formatDate here */}
                                    <TableCell>{task.budget_revenue}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task, e.target.value)}
                                            size="small"
                                            sx={{ width: 120 }}
                                            disabled={task.status === 'Completed'} // Disable if status is Completed
                                        >
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="In Progress">In Progress</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{task.assigned_by}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: task.is_editable ? 'success.main' : 'error.main', // Green for Granted, Red for Denied
                                                fontWeight: 'medium',
                                            }}
                                        >
                                            {task.is_editable ? 'Granted' : 'Denied'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEditTask(task)}>
                                            <Edit />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Dialog for Adding Task */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Plan</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {/* Task Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Title color="primary" />
                            <TextField
                                fullWidth
                                label="Plan Name"
                                value={newTask.plan_name}
                                onChange={(e) => setNewTask({ ...newTask, plan_name: e.target.value })}
                                size="small"
                                required
                                error={validationErrors.plan_name}
                                helperText={validationErrors.plan_name ? 'Task Name is required' : ''}
                            />
                        </Box>

                        {/* Description */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Description color="primary" />
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                size="small"
                            />
                        </Box>

                        {/* Date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DateRange color="primary" />
                            <TextField
                                fullWidth
                                label="Date"
                                type="date"
                                value={newTask.date}
                                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                required
                                error={validationErrors.date}
                                helperText={validationErrors.date ? 'Date is required' : ''}
                            />
                        </Box>

                        {/* Budget/Revenue */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AttachMoney color="primary" />
                            <TextField
                                fullWidth
                                label="Budget/Revenue"
                                type="number"
                                value={newTask.budget_revenue}
                                onChange={(e) => setNewTask({ ...newTask, budget_revenue: e.target.value })}
                                size="small"
                            />
                        </Box>

                        {/* Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PendingActions color="primary" />
                            <TextField
                                fullWidth
                                label="Status"
                                value="Pending"
                                disabled
                                size="small"
                            />
                        </Box>

                        {/* Assigned By */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AssignmentInd color="primary" />
                            <TextField
                                fullWidth
                                label="Assigned By"
                                value="own"
                                disabled
                                size="small"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddTask} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for Editing Task */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>View Task</DialogTitle>
                <DialogContent>
                    {currentTask && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {/* Task Name */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Title color="primary" />
                                <TextField
                                    fullWidth
                                    label="Task Name"
                                    value={currentTask.plan_name}
                                    onChange={(e) => setCurrentTask({ ...currentTask, plan_name: e.target.value })}
                                    size="small"
                                    required
                                    error={validationErrors.plan_name}
                                    helperText={validationErrors.plan_name ? 'Task Name is required' : ''}
                                    disabled={!currentTask.is_editable}
                                />
                            </Box>

                            {/* Description */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Description color="primary" />
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={currentTask.description}
                                    onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                                    size="small"
                                    disabled={!currentTask.is_editable}
                                />
                            </Box>

                            {/* Date */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateRange color="primary" />
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    value={currentTask.date} // Ensure this is in YYYY-MM-DD format
                                    onChange={(e) => setCurrentTask({ ...currentTask, date: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    error={validationErrors.date}
                                    helperText={validationErrors.date ? 'Date is required' : ''}
                                    disabled={!currentTask.is_editable}
                                />
                            </Box>

                            {/* Budget/Revenue */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AttachMoney color="primary" />
                                <TextField
                                    fullWidth
                                    label="Budget/Revenue"
                                    type="number"
                                    value={currentTask.budget_revenue}
                                    onChange={(e) => setCurrentTask({ ...currentTask, budget_revenue: e.target.value })}
                                    size="small"
                                    disabled={!currentTask.is_editable}
                                />
                            </Box>

                            {/* Status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PendingActions color="primary" />
                                <TextField
                                    fullWidth
                                    label="Status"
                                    value={currentTask.status}
                                    disabled
                                    size="small"
                                />
                            </Box>

                            {/* Assigned By */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AssignmentInd color="primary" />
                                <TextField
                                    fullWidth
                                    label="Assigned By"
                                    value={currentTask.assigned_by}
                                    disabled
                                    size="small"
                                />
                            </Box>
                            {currentTask.status === 'Completed' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Description color="primary" />
                                    <TextField
                                        fullWidth
                                        label="Complete Description"
                                        multiline
                                        rows={3}
                                        value={currentTask.complete_description || ''}
                                        disabled
                                        size="small"
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                    {currentTask?.is_editable ? ( // Show Update button only if editable
                        <Button onClick={handleUpdateTask} variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Update'}
                        </Button>
                    ) : null} {/* Return null if not editable */}
                </DialogActions>
            </Dialog>

            {/* Dialog for Completion Description */}
            <Dialog open={openCompletedDialog} onClose={() => setOpenCompletedDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Completed Task</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Reason for Completion"
                            multiline
                            rows={3}
                            value={completedDescription}
                            onChange={(e) => setCompletedDescription(e.target.value)}
                            size="small"
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCompletedDialog(false)}>Cancel</Button>
                    <Button onClick={handleCompletedTask} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Completing Task */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This action cannot be undone. Are you sure you want to mark this task as Completed?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmCompleted} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MemberPlanPage;