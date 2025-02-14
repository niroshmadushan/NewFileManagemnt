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
import { ThemeContext } from '../../context/ThemeContext';
import { Add, Save, Title, Description, DateRange, AttachMoney, AssignmentInd, PendingActions, Edit } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData, selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { useTheme } from '@mui/material/styles';
import { format, parseISO } from 'date-fns'; // Import date-fns for date formatting

const MemberPlanPage = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const { darkMode } = useContext(ThemeContext);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        plan_name: '',
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

    // Function to get status color based on plan status
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

    // Fetch team members and plans
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                const teamLeaderData = await selectData('team_leaders', { user_email: userDetails.email });
                const teamId = teamLeaderData.data[0]?.team_id;

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

                if (selectedMember) {
                    const plansResponse = await selectData('member_plan', { member_id: selectedMember.id });
                    const filteredPlans = plansResponse.data.filter(
                        (plan) => plan.month === month && plan.year === year
                    );
                    setPlans(filteredPlans);
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
    }, [selectedMember, month, year]);

    // Handle adding a new plan
    const handleAddPlan = async () => {
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
            const planData = {
                ...newPlan,
                member_id: selectedMember.id,
                team_id: selectedMember.team_id,
                month,
                year,
            };

            await insertData('member_plan', planData);
            toast.success('Plan added successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenAddDialog(false);
            setNewPlan({
                plan_name: '',
                description: '',
                date: '',
                budget_revenue: 0,
                status: 'Pending',
                assigned_by: 'Team Lead',
                is_editable: true,
            });

            // Refresh plans
            const plansResponse = await selectData('member_plan', { member_id: selectedMember.id, month, year });
            setPlans(plansResponse.data);
        } catch (error) {
            console.error('Error adding plan:', error);
            toast.error('Failed to add plan.', {
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

    // Handle editing a plan
    const handleEditPlan = (plan) => {
        // Format the date correctly for the input field (YYYY-MM-DD)
        const formattedDate = plan.date ? format(parseISO(plan.date), 'yyyy-MM-dd') : '';
        
        setCurrentPlan({
            ...plan,
            date: formattedDate, // Ensure the date is in the correct format
        });
        setOpenEditDialog(true);
    };

    // Handle updating a plan
    const handleUpdatePlan = async () => {
        if (!currentPlan) return;

        setLoading(true);

        try {
            const updatedPlanData = {
                ...currentPlan,
                month,
                year,
            };

            await updateData('member_plan', updatedPlanData, { id: currentPlan.id });
            toast.success('Plan updated successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            setOpenEditDialog(false);

            // Refresh plans
            const plansResponse = await selectData('member_plan', { member_id: selectedMember.id, month, year });
            setPlans(plansResponse.data);
        } catch (error) {
            console.error('Error updating plan:', error);
            toast.error('Failed to update plan.', {
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

    // Handle toggling editable status
    const handleToggleEditable = (event) => {
        setCurrentPlan((prev) => ({
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

                    {/* Team Members List */}
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

            {/* Right Section: Member Plans */}
            <Box sx={{ flex: 2 }}>
                <Paper sx={{ padding: 3, borderRadius: 4, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Member Plans
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
                                Assign Plan
                            </Button>
                        </Box>
                    </Box>

                    {/* Plans Table */}
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
                                {plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>{plan.id}</TableCell>
                                        <TableCell>{plan.plan_name}</TableCell>
                                        <TableCell>{formatDate(plan.date)}</TableCell>
                                        <TableCell>{plan.budget_revenue}</TableCell>
                                        <TableCell
                                            sx={{
                                                backgroundColor: getStatusColor(plan.status),
                                                fontWeight: 'bold',
                                                color: darkMode ? '#000' : '#000', // Adjust text color for dark mode
                                            }}
                                        >
                                            {plan.status}
                                        </TableCell>
                                        <TableCell>{plan.assigned_by}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={plan.is_editable}
                                                disabled
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditPlan(plan)}>
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

            {/* Dialog for Adding Plan */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Plan</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {/* Plan Name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Title color="primary" />
                            <TextField
                                fullWidth
                                label="Plan Name"
                                value={newPlan.plan_name}
                                onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
                                size="small"
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
                                value={newPlan.description}
                                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
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
                                value={newPlan.date}
                                onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>

                        {/* Budget/Revenue */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AttachMoney color="primary" />
                            <TextField
                                fullWidth
                                label="Budget/Revenue"
                                type="number"
                                value={newPlan.budget_revenue}
                                onChange={(e) => setNewPlan({ ...newPlan, budget_revenue: e.target.value })}
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
                                value="Team Lead"
                                disabled
                                size="small"
                            />
                        </Box>

                        {/* Editable */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={newPlan.is_editable}
                                        onChange={(e) => setNewPlan({ ...newPlan, is_editable: e.target.checked })}
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
                    <Button onClick={handleAddPlan} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for Editing Plan */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Plan</DialogTitle>
                <DialogContent>
                    {currentPlan && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {/* Plan Name */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Title color="primary" />
                                <TextField
                                    fullWidth
                                    label="Plan Name"
                                    value={currentPlan.plan_name}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, plan_name: e.target.value })}
                                    size="small"
                                    disabled={currentPlan.status === 'Completed'}
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
                                    value={currentPlan.description}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                                    size="small"
                                    disabled={currentPlan.status === 'Completed'}
                                />
                            </Box>

                            {/* Date */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateRange color="primary" />
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    value={currentPlan.date} // Ensure this is in YYYY-MM-DD format
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, date: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    disabled={currentPlan.status === 'Completed'}
                                />
                            </Box>

                            {/* Budget/Revenue */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AttachMoney color="primary" />
                                <TextField
                                    fullWidth
                                    label="Budget/Revenue"
                                    type="number"
                                    value={currentPlan.budget_revenue}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, budget_revenue: e.target.value })}
                                    size="small"
                                    disabled={currentPlan.status === 'Completed'}
                                />
                            </Box>

                            {/* Status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PendingActions color="primary" />
                                <TextField
                                    fullWidth
                                    label="Status"
                                    value={currentPlan.status}
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
                                    value={currentPlan.assigned_by}
                                    disabled
                                    size="small"
                                />
                            </Box>

                            {/* Editable (only for Pending and In Progress) */}
                            {currentPlan.status !== 'Completed' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={currentPlan.is_editable}
                                                onChange={handleToggleEditable}
                                                color="primary"
                                            />
                                        }
                                        label="Editable"
                                    />
                                </Box>
                            )}

                            {/* Complete Description (if status is Completed) */}
                            {currentPlan.status === 'Completed' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Description color="primary" />
                                    <TextField
                                        fullWidth
                                        label="Complete Description"
                                        multiline
                                        rows={3}
                                        value={currentPlan.complete_description || ''}
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
                    {currentPlan?.status !== 'Completed' && ( // Hide Update button if status is Completed
                        <Button onClick={handleUpdatePlan} variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Update'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MemberPlanPage;