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
} from '@mui/material';
import { Add, Save, Title, Description, DateRange, AttachMoney, PendingActions, Edit } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../../context/ThemeContext';
import { format, parseISO } from 'date-fns'; // Import date-fns for date formatting

const MyTaskPage = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [tasks, setTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]); // Store all tasks fetched from the server
    const [loading, setLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openCompleteDialog, setOpenCompleteDialog] = useState(false); // For completion description
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // For "Are you sure?" confirmation
    const [currentTask, setCurrentTask] = useState(null);
    const [completeDescription, setCompleteDescription] = useState(''); // State for completion description
    const { darkMode } = useContext(ThemeContext);
    const [newTask, setNewTask] = useState({
        task_name: '',
        description: '',
        date: '',
        budget_revenue: 0,
        status: 'Pending',
    });
    const theme = useTheme();

    // Function to format date in a user-friendly way (e.g., "15 Jan 2025")
    const formatDate = (dateString) => {
        const date = parseISO(dateString); // Parse the date string to a Date object
        return format(date, 'dd MMM yyyy'); // Format the date
    };

    // Function to get status color based on task status
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return darkMode ? '#ffeb3b' : '#fff9c4'; // Yellow
            case 'In Progress':
                return darkMode ? '#64b5f6' : '#bbdefb'; // Blue
            case 'Complete':
                return darkMode ? '#81c784' : '#c8e6c9'; // Green
            default:
                return darkMode ? '#424242' : '#f5f5f5'; // Default
        }
    };

    // Function to get text color based on background color
    const getStatusTextColor = (status) => {
        const backgroundColor = getStatusColor(status);

        // Calculate the brightness of the background color
        const hexColor = backgroundColor.replace('#', '');
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Use black text for light backgrounds and white text for dark backgrounds
        return brightness > 128 ? '#000000' : '#ffffff';
    };

    // Fetch all tasks for the logged-in user
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                const userId = userDetails.id;

                if (userId) {
                    const tasksResponse = await selectData('my_task', { user_id: userId });
                    setAllTasks(tasksResponse.data); // Store all tasks
                    filterTasks(tasksResponse.data, month, year); // Filter tasks for the current month and year
                }
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
                toast.error('Failed to fetch tasks.', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            }
        };

        fetchData();
    }, []);

    // Filter tasks based on month and year
    useEffect(() => {
        filterTasks(allTasks, month, year);
    }, [month, year, allTasks]);

    const filterTasks = (tasks, month, year) => {
        console.log('Filtering tasks:', { month, year });
        console.log('All tasks:', tasks);

        const filteredTasks = tasks.filter(
            (task) => {
                console.log('Task:', { taskMonth: task.month, taskYear: task.year });
                return task.month === month && task.year === year;
            }
        );

        console.log('Filtered tasks:', filteredTasks);
        setTasks(filteredTasks);
    };

    // Handle adding a new task
    const handleAddTask = async () => {
        setLoading(true);

        try {
            const userDetails = await getUserDetails();
            const userId = userDetails.id;
            const userEmail = userDetails.email;

            const taskData = {
                ...newTask,
                user_id: userId,
                user_email: userEmail,
                month,
                year,
            };

            await insertData('my_task', taskData);
            toast.success('Task added successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenAddDialog(false);
            setNewTask({
                task_name: '',
                description: '',
                date: '',
                budget_revenue: 0,
                status: 'Pending',
            });

            // Refresh tasks
            const tasksResponse = await selectData('my_task', { user_id: userId });
            setAllTasks(tasksResponse.data); // Update all tasks
            filterTasks(tasksResponse.data, month, year); // Filter tasks for the current month and year
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

    // Handle editing a task
    const handleEditTask = (task) => {
        setCurrentTask({
            ...task,
            date: task.date ? format(parseISO(task.date), 'yyyy-MM-dd') : '', // Format the date for the input field
        });
        setOpenEditDialog(true);
    };

    // Handle updating a task
    const handleUpdateTask = async () => {
        if (!currentTask) return;

        setLoading(true);

        try {
            const updatedTaskData = {
                ...currentTask,
                month,
                year,
            };

            await updateData('my_task', updatedTaskData, { id: currentTask.id });
            toast.success('Task updated successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenEditDialog(false);

            // Refresh tasks
            const userDetails = await getUserDetails();
            const userId = userDetails.id;
            const tasksResponse = await selectData('my_task', { user_id: userId });
            setAllTasks(tasksResponse.data); // Update all tasks
            filterTasks(tasksResponse.data, month, year); // Filter tasks for the current month and year
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

    // Handle status change
    const handleStatusChange = async (task, newStatus) => {
        if (newStatus === 'Complete') {
            setCurrentTask(task); // Set the current task
            setOpenCompleteDialog(true); // Open the completion description modal
        } else {
            const updatedTask = {
                status: newStatus,
            };

            await updateData('my_task', updatedTask, { id: task.id });
            toast.success('Task status updated!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });

            // Refresh tasks
            const userDetails = await getUserDetails();
            const userId = userDetails.id;
            const tasksResponse = await selectData('my_task', { user_id: userId });
            setAllTasks(tasksResponse.data); // Update all tasks
            filterTasks(tasksResponse.data, month, year); // Filter tasks for the current month and year
        }
    };

    // Handle completion description submission
    const handleCompleteTask = async () => {
        if (!currentTask) return;

        setLoading(true);

        try {
            const updatedTask = {
                status: 'Complete',
                complete_description: completeDescription,
            };

            await updateData('my_task', updatedTask, { id: currentTask.id });
            toast.success('Task marked as complete!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });

            // Close all dialogs
            setOpenCompleteDialog(false);
            setOpenConfirmDialog(false);
            setCompleteDescription(''); // Reset completion description

            // Refresh tasks
            const userDetails = await getUserDetails();
            const userId = userDetails.id;
            const tasksResponse = await selectData('my_task', { user_id: userId });
            setAllTasks(tasksResponse.data); // Update all tasks
            filterTasks(tasksResponse.data, month, year); // Filter tasks for the current month and year
        } catch (error) {
            console.error('Error completing task:', error);
            toast.error('Failed to complete task.', {
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

    // Handle confirmation for completing the task
    const handleConfirmComplete = () => {
        setOpenConfirmDialog(true); // Open the confirmation dialog
    };

    // Handle confirmation dialog close
    const handleConfirmClose = () => {
        setOpenConfirmDialog(false); // Close the confirmation dialog
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Paper sx={{ padding: 3, borderRadius: 4, boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        My Tasks
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
                            onChange={(e) => setYear(Number(e.target.value))} // Convert to number
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
                                <TableCell sx={{ width: '5%' }}>ID</TableCell>
                                <TableCell sx={{ width: '20%' }}>Task Name</TableCell>
                                <TableCell sx={{ width: '40%' }}>Description</TableCell> {/* Wider column */}
                                <TableCell sx={{ width: '10%' }}>Date</TableCell>
                                <TableCell sx={{ width: '10%' }}>Budget/Revenue</TableCell>
                                <TableCell sx={{ width: '10%' }}>Status</TableCell> {/* Narrower column */}
                                <TableCell sx={{ width: '5%' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasks.map((task) => (
                                <TableRow key={task.id} sx={{ height: 20 }}> {/* Reduced row height */}
                                    <TableCell>{task.id}</TableCell>
                                    <TableCell>{task.task_name}</TableCell>
                                    <TableCell>{task.description}</TableCell>
                                    <TableCell>{formatDate(task.date)}</TableCell>
                                    <TableCell>{task.budget_revenue}</TableCell>
                                    <TableCell
                                        sx={{
                                            backgroundColor: getStatusColor(task.status), // Apply background color
                                            color: getStatusTextColor(task.status), // Apply text color
                                            fontWeight: 'bold', // Make text bold
                                            borderRadius: '4px', // Add rounded corners
                                            padding: '8px 16px', // Adjust padding for better appearance
                                        }}
                                    >
                                        <Select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task, e.target.value)}
                                            size="small"
                                            sx={{
                                                width: '100%',
                                                backgroundColor: 'transparent', // Make the Select background transparent
                                                border: 'none', // Remove border
                                                '& .MuiSelect-select': {
                                                    padding: '4px 8px', // Adjust padding for the Select component
                                                    color: getStatusTextColor(task.status), // Apply text color to the Select component
                                                },
                                            }}
                                            disabled={task.status === 'Complete'} // Disable if status is Complete
                                        >
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="In Progress">In Progress</MenuItem>
                                            <MenuItem value="Complete">Complete</MenuItem>
                                        </Select>
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
                <DialogTitle>Add New Task</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Title color="primary" />
                            <TextField
                                fullWidth
                                label="Task Name"
                                value={newTask.task_name}
                                onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                                size="small"
                            />
                        </Box>

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
                            />
                        </Box>

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
                <DialogTitle>Edit Task</DialogTitle>
                <DialogContent>
                    {currentTask && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Title color="primary" />
                                <TextField
                                    fullWidth
                                    label="Task Name"
                                    value={currentTask.task_name}
                                    onChange={(e) => setCurrentTask({ ...currentTask, task_name: e.target.value })}
                                    size="small"
                                    disabled={currentTask.status === 'Complete'} // Disable if status is Complete
                                />
                            </Box>

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
                                    disabled={currentTask.status === 'Complete'} // Disable if status is Complete
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateRange color="primary" />
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    value={currentTask.date} // Use the correctly formatted date
                                    onChange={(e) => setCurrentTask({ ...currentTask, date: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    disabled={currentTask.status === 'Complete'} // Disable if status is Complete
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AttachMoney color="primary" />
                                <TextField
                                    fullWidth
                                    label="Budget/Revenue"
                                    type="number"
                                    value={currentTask.budget_revenue}
                                    onChange={(e) => setCurrentTask({ ...currentTask, budget_revenue: e.target.value })}
                                    size="small"
                                    disabled={currentTask.status === 'Complete'} // Disable if status is Complete
                                />
                            </Box>

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

                            {currentTask.status === 'Complete' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Description color="primary" />
                                    <TextField
                                        fullWidth
                                        label="Completion Description"
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
                    <Button
                        onClick={handleUpdateTask}
                        variant="contained"
                        disabled={loading || currentTask?.status === 'Complete'} // Disable if status is Complete
                    >
                        {loading ? <CircularProgress size={24} /> : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for Completion Description */}
            <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Complete Task</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Description color="primary" />
                            <TextField
                                fullWidth
                                label="Completion Description"
                                multiline
                                rows={3}
                                value={completeDescription}
                                onChange={(e) => setCompleteDescription(e.target.value)}
                                size="small"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCompleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmComplete} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Completing Task */}
            <Dialog open={openConfirmDialog} onClose={handleConfirmClose}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This action cannot be undone. Are you sure you want to mark this task as complete?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmClose}>Cancel</Button>
                    <Button onClick={handleCompleteTask} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyTaskPage;