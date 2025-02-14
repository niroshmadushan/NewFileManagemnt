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
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    IconButton,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { Add, Save, Title, Description, DateRange, AttachMoney, AssignmentInd, PendingActions, Edit } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData, selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../../context/ThemeContext';
import { format, parseISO } from 'date-fns'; // Import date-fns for date formatting

const MemberTaskPage = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const { darkMode } = useContext(ThemeContext);
    const [month, setMonth] = useState(new Date().getMonth() + 1); // Ensure month is a number
    const [year, setYear] = useState(new Date().getFullYear()); // Ensure year is a number
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [newTask, setNewTask] = useState({
        task_name: '',
        description: '',
        date: '',
        budget_revenue: 0,
        status: 'Pending',
        assigned_by: 'Team Lead',
        is_editable: true,
    });
    const theme = useTheme();

    // Function to format date in a user-friendly way (e.g., "15 Jan 2025")
    const formatDate = (dateString) => {
        if (!dateString) return ''; // Handle empty dates
        const date = parseISO(dateString); // Parse the date string to a Date object
        return format(date, 'dd MMM yyyy'); // Format the date as "15 Jan 2025"
    };

    // Function to get status color based on task status
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return darkMode ? '#ffeb3b' : '#fff9c4'; // Yellow
            case 'In Progress':
                return darkMode ? '#64b5f6' : '#bbdefb'; // Blue
            case 'Completed':
                return darkMode ? '#81c784' : '#c8e6c9'; // Green
            default:
                return darkMode ? '#424242' : '#f5f5f5'; // Default
        }
    };

    // Fetch team members and tasks for the selected member, month, and year
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                const teamLeaderData = await selectData('team_leaders', { user_email: userDetails.email });
                const teamId = teamLeaderData.data[0]?.team_id;

                // Fetch team members
                const membersResponse = await selectData('members', { team_id: teamId });
                const membersData = membersResponse.data;

                const teamMembersWithDetails = [];
                for (const member of membersData) {
                    const userResponse = await selectDataProfiles({ email: member.member_email });
                    if (userResponse.data.length > 0) {
                        const userDetails = userResponse.data[0];
                        teamMembersWithDetails.push({
                            ...member,
                            ...userDetails,
                        });
                    }
                }

                setTeamMembers(teamMembersWithDetails);

                // Fetch tasks for the selected member, month, and year
                if (selectedMember) {
                    const tasksResponse = await selectData('member_task', {
                        member_id: selectedMember.id,
                        month: Number(month), // Ensure month is a number
                        year: Number(year), // Ensure year is a number
                    });
                    setTasks(tasksResponse.data);
                }
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
    }, [selectedMember, month, year]); // Re-fetch when selectedMember, month, or year changes

    // Handle adding a new task
    const handleAddTask = async () => {
        if (!selectedMember) {
            toast.error('Please select a member.', {
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
                month: Number(month), // Ensure month is a number
                year: Number(year), // Ensure year is a number
            };
            await insertData('member_task', taskData);
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
                assigned_by: 'Team Lead',
                is_editable: true,
            });

            // Re-fetch tasks after adding a new task
            const tasksResponse = await selectData('member_task', {
                member_id: selectedMember.id,
                month: Number(month),
                year: Number(year),
            });
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

    // Handle editing a task
    const handleEditTask = (task) => {
        const formattedDate = task.date ? format(parseISO(task.date), 'yyyy-MM-dd') : ''; // Format the date for the input field
        setCurrentTask({
            ...task,
            date: formattedDate,
        });
        setOpenEditDialog(true);
    };

    // Handle updating a task
    const handleUpdateTask = async () => {
        setOpenConfirmDialog(false); // Close the confirmation dialog
        setLoading(true);

        try {
            const updatedTaskData = {
                ...currentTask,
                month: Number(month), // Ensure month is a number
                year: Number(year), // Ensure year is a number
            };

            await updateData('member_task', updatedTaskData, { id: currentTask.id });
            toast.success('Task updated successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenEditDialog(false);

            // Re-fetch tasks after updating a task
            const tasksResponse = await selectData('member_task', {
                member_id: selectedMember.id,
                month: Number(month),
                year: Number(year),
            });
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

    // Handle toggle for editable field
    const handleToggleEditable = (event) => {
        setCurrentTask((prev) => ({
            ...prev,
            is_editable: event.target.checked,
        }));
    };

    return (
        <Box sx={{ display: 'flex', gap: 4, padding: 4 }}>
            {/* Left Section: Team Members */}
            <Box sx={{ flex: 1, maxWidth: 300 }}>
                <Paper sx={{ padding: 3, borderRadius: 4, boxShadow: 'none' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                        Team Members
                    </Typography>

                    <Box
                        sx={{
                            maxHeight: 420,
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
                        {teamMembers.map((member) => (
                            <Paper
                                key={member.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: 2,
                                    p: 2,
                                    mr: 1,
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                    backgroundColor:
                                        selectedMember?.id === member.id
                                            ? theme.palette.mode === 'dark'
                                                ? '#424242'
                                                : '#e0e0e0'
                                            : theme.palette.background.paper,
                                    color:
                                        selectedMember?.id === member.id
                                            ? theme.palette.getContrastText(
                                                theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0'
                                            )
                                            : theme.palette.text.primary,
                                    '&:hover': {
                                        backgroundColor:
                                            selectedMember?.id === member.id
                                                ? theme.palette.mode === 'dark'
                                                    ? '#424242'
                                                    : '#e0e0e0'
                                                : theme.palette.mode === 'dark'
                                                    ? '#424242'
                                                    : '#f5f5f5',
                                    },
                                }}
                                onClick={() => setSelectedMember(member)}
                            >
                                <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                                    {member.full_name[0]}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {member.full_name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: 12,
                                            color:
                                                selectedMember?.id === member.id
                                                    ? theme.palette.mode === 'dark'
                                                        ? '#e0e0e0'
                                                        : '#757575'
                                                    : theme.palette.text.secondary,
                                        }}
                                    >
                                        {member.email}
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Paper>
            </Box>

            {/* Right Section: Member Tasks */}
            <Box sx={{ flex: 2 }}>
                <Paper sx={{ padding: 3, borderRadius: 4, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Member Tasks
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Month</InputLabel>
                                <Select value={month} label="Month" onChange={(e) => setMonth(Number(e.target.value))}>
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
                                onChange={(e) => setYear(Number(e.target.value))}
                                size="small"
                                sx={{ width: 100 }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setOpenAddDialog(true)}
                                disabled={!selectedMember}
                            >
                                Assign Task
                            </Button>
                        </Box>
                    </Box>

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
                                    <TableCell>Task Name</TableCell>
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
                                        <TableCell>{task.task_name}</TableCell>
                                        <TableCell>{formatDate(task.date)}</TableCell> {/* Use formatDate here */}
                                        <TableCell>{task.budget_revenue}</TableCell>
                                        <TableCell
                                            sx={{
                                                backgroundColor: getStatusColor(task.status),
                                                fontWeight: 'bold',
                                                color: darkMode ? '#000' : '#000', // Adjust text color for dark mode
                                            }}
                                        >
                                            {task.status}
                                        </TableCell>
                                        <TableCell>{task.assigned_by}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={task.is_editable}
                                                disabled
                                                color="primary"
                                            />
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
            </Box>

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

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AssignmentInd color="primary" />
                            <TextField
                                fullWidth
                                label="Assigned By"
                                value="Team Lead"
                                disabled
                                size="small"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={newTask.is_editable}
                                        onChange={(e) => setNewTask({ ...newTask, is_editable: e.target.checked })}
                                        color="primary"
                                    />
                                }
                                label="Editable"
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
                                    disabled={currentTask.status === 'Completed'}
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
                                    disabled={currentTask.status === 'Completed'}
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
                                    disabled={currentTask.status === 'Completed'}
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
                                    disabled={currentTask.status === 'Completed'}
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

                            {/* Editable Toggle (only for Pending and In Progress) */}
                            {currentTask.status !== 'Completed' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={currentTask.is_editable}
                                                onChange={handleToggleEditable}
                                                color="primary"
                                            />
                                        }
                                        label="Editable"
                                    />
                                </Box>
                            )}

                            {/* Complete Description (if status is Completed) */}
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
                    {currentTask?.status !== 'Completed' && ( // Hide Update button if status is Completed
                        <Button
                            onClick={() => setOpenConfirmDialog(true)}
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Update'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Update */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleUpdateTask} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MemberTaskPage;