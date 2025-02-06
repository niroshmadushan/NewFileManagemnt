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
import { Add, Title, Description, DateRange, AttachMoney, AssignmentInd, PendingActions, Edit, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../../context/ThemeContext';

// Utility function to format date as "YYYY-MM-DD" (ISO format)
const formatDateToISO = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

// Utility function to format date in a user-friendly way (e.g., "15 Jan 2025")
const formatDateToDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const MemberPlanPage = () => {
    const [selectedMember, setSelectedMember] = useState(null); // Selected member will be the logged-in user
    const { darkMode } = useContext(ThemeContext);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openCompletedDialog, setOpenCompletedDialog] = useState(false); // For completion description
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // For "Are you sure?" confirmation
    const [currentPlan, setCurrentPlan] = useState(null);
    const [CompletedDescription, setCompletedDescription] = useState(''); // For completion reason
    const [newPlan, setNewPlan] = useState({
        plan_name: '',
        description: '',
        date: formatDateToISO(new Date()), // Initialize with today's date in ISO format
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

    // Fetch logged-in user's details and plans
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                setSelectedMember({ id: userDetails.id, team_id: userDetails.team_id }); // Set selected member to logged-in user

                // Fetch plans for the logged-in user
                const plansResponse = await selectData('member_plan', { member_id: userDetails.id });
                const filteredPlans = plansResponse.data.filter(
                    (plan) => plan.month === month && plan.year === year
                );
                setPlans(filteredPlans);
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
    }, [month, year]);

    // Handle adding a new plan
    const handleAddPlan = async () => {
        // Validate required fields
        if (!newPlan.plan_name || !newPlan.date) {
            setValidationErrors({
                plan_name: !newPlan.plan_name,
                date: !newPlan.date,
            });
            toast.error('Plan Name and Date are required.', {
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
            const planData = {
                ...newPlan,
                member_id: selectedMember.id,
                team_id: selectedMember.team_id,
                month,
                year,
                is_editable: false,
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
                date: formatDateToISO(new Date()), // Reset to today's date in ISO format
                budget_revenue: 0,
                status: 'Pending',
                assigned_by: 'Own',
                is_editable: false,
            });
            setValidationErrors({ plan_name: false, date: false }); // Reset validation errors

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
        const formattedDate = formatDateToISO(plan.date); // Format date to ISO
        setCurrentPlan({
            ...plan,
            date: formattedDate,
        });
        setOpenEditDialog(true);
    };

    // Handle updating a plan
    const handleUpdatePlan = async () => {
        if (!currentPlan) return;

        // Validate required fields
        if (!currentPlan.plan_name || !currentPlan.date) {
            setValidationErrors({
                plan_name: !currentPlan.plan_name,
                date: !currentPlan.date,
            });
            toast.error('Plan Name and Date are required.', {
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
            setValidationErrors({ plan_name: false, date: false }); // Reset validation errors

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

    // Handle status change
    const handleStatusChange = async (plan, newStatus) => {
        setCurrentPlan({ ...plan, newStatus }); // Set the current plan and new status
        setOpenConfirmDialog(true); // Show "Are you sure?" confirmation dialog
    };

    // Update plan status in the database
    const updatePlanStatus = async (plan, newStatus, completionReason = null) => {
        setLoading(true);

        try {
            const updatedPlanData = {
                status: newStatus, // Update only the status
                Complete_description: newStatus === 'Completed' ? completionReason : null, // Update completion reason if status is 'Completed'
            };

            // Update only the status and Completed_description fields in the database
            await updateData('member_plan', updatedPlanData, { id: plan.id });

            toast.success('Status updated successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });

            // Refresh plans
            const plansResponse = await selectData('member_plan', { member_id: selectedMember.id, month, year });
            setPlans(plansResponse.data);
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

    // Handle completion description submission
    const handleCompletedTask = async () => {
        if (!currentPlan) return;

        // Pass the new status ('Completed') and the completion reason
        await updatePlanStatus(currentPlan, 'Completed', CompletedDescription);

        // Close the completion dialog and reset the completion reason
        setOpenCompletedDialog(false);
        setCompletedDescription('');
    };

    // Handle confirmation for completing the task
    const handleConfirmCompleted = async () => {
        setOpenConfirmDialog(false); // Close the confirmation dialog

        if (currentPlan.newStatus === 'Completed') {
            setOpenCompletedDialog(true); // Open the completion description modal
        } else {
            // For other status changes, update the status immediately
            await updatePlanStatus(currentPlan, currentPlan.newStatus);
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
                            onChange={(e) => setYear(e.target.value)}
                            size="small"
                            sx={{ width: 100 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenAddDialog(true)}
                        >
                            Add Plan
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
                                    <TableCell>{formatDateToDisplay(plan.date)}</TableCell>
                                    <TableCell>{plan.budget_revenue}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={plan.status}
                                            onChange={(e) => handleStatusChange(plan, e.target.value)}
                                            size="small"
                                            sx={{ width: 120 }}
                                            disabled={plan.status === 'Completed'} // Disable if status is Completed
                                        >
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="In Progress">In Progress</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{plan.assigned_by}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: plan.is_editable ? 'success.main' : 'error.main', // Green for Granted, Red for Denied
                                                fontWeight: 'medium',
                                            }}
                                        >
                                            {plan.is_editable ? 'Granted' : 'Denied'}
                                        </Typography>
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
                                required
                                error={validationErrors.plan_name}
                                helperText={validationErrors.plan_name ? 'Plan Name is required' : ''}
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
                                value="own"
                                disabled
                                size="small"
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
                <DialogTitle>View Plan</DialogTitle>
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
                                    required
                                    error={validationErrors.plan_name}
                                    helperText={validationErrors.plan_name ? 'Plan Name is required' : ''}
                                    disabled={!currentPlan.is_editable}
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
                                    disabled={!currentPlan.is_editable}
                                />
                            </Box>

                            {/* Date */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <DateRange color="primary" />
                                <TextField
                                    fullWidth
                                    label="Date"
                                    type="date"
                                    value={currentPlan.date}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, date: e.target.value })}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                    error={validationErrors.date}
                                    helperText={validationErrors.date ? 'Date is required' : ''}
                                    disabled={!currentPlan.is_editable}
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
                                    disabled={!currentPlan.is_editable}
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
                    {currentPlan?.is_editable ? ( // Show Update button only if editable
                        <Button onClick={handleUpdatePlan} variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Update'}
                        </Button>
                    ) : null} {/* Return null if not editable */}
                </DialogActions>
            </Dialog>

            {/* Dialog for Completion Description */}
            <Dialog open={openCompletedDialog} onClose={() => setOpenCompletedDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Completed Plan</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Reason for Completion"
                            multiline
                            rows={3}
                            value={CompletedDescription}
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

            {/* Confirmation Dialog for Completing Plan */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This action cannot be undone. Are you sure you want to mark this plan as Completed?
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