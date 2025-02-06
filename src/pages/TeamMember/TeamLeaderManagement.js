import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    useTheme,
    CircularProgress,
    Switch,
    Divider,
} from '@mui/material';
import { Groups, Person, Email, Phone, Edit, Add, Save, Close } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, updateData, insertData } from '../../services/dataService';
import { createNewUser } from '../../services/authService';
import { changeUsernameusers, updateUserStatus } from '../../services/authService';
import { getUserDetails } from '../../services/userService';

const TeamLeaderManagement = () => {
    const theme = useTheme();
    const [teams, setTeams] = useState([]); // All teams
    const [groups, setGroups] = useState([]); // All groups
    const [selectedTeam, setSelectedTeam] = useState(null); // Selected team
    const [teamLeaders, setTeamLeaders] = useState([]); // Team leaders for the selected team
    const [openDialog, setOpenDialog] = useState(false); // Dialog for team leaders
    const [loading, setLoading] = useState(false); // Loading state
    const [openAddTeamLeaderForm, setOpenAddTeamLeaderForm] = useState(false); // Form for adding team leader
    const [companyId, setCompanyId] = useState(null); // Company ID of the logged-in user

    // State for new team leader form
    const [newTeamLeaderForm, setNewTeamLeaderForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'team_lead', // Only team_lead role is allowed
    });

    // Fetch company_id of the logged-in user
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const userDetails = await getUserDetails();
                setCompanyId(userDetails.data[0]?.company_id); // Set company_id
            } catch (error) {
                console.error('Failed to fetch user details:', error);
            }
        };
        fetchUserDetails();
    }, []);

    // Fetch all teams and groups for the logged-in user's company
    const fetchTeamsAndGroups = async () => {
        setLoading(true);
        try {
            // Fetch teams
            const teamsResponse = await selectData(`teams?company_id=${companyId}`);
            setTeams(teamsResponse.data);

            // Fetch groups
            const groupsResponse = await selectData(`groups?company_id=${companyId}`);
            setGroups(groupsResponse.data);

            toast.success('Data fetched successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } catch (error) {
            toast.error('Failed to fetch data.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch team leaders for a specific team
    const fetchTeamLeaders = async (teamId) => {
        setLoading(true);
        try {
            // Step 1: Fetch team leaders from the team_leaders table
            const teamLeadersResponse = await selectData(`team_leaders?team_id=${teamId}`);
            const teamLeadersData = teamLeadersResponse.data;

            // Step 2: Fetch user details for each team leader email
            const userAccountsData = [];
            for (const leader of teamLeadersData) {
                try {
                    const userResponse = await selectData(`user_accounts?email=${leader.user_email}`);
                    if (userResponse.data.length > 0) {
                        userAccountsData.push(userResponse.data[0]); // Add user details to the array
                    }
                } catch (error) {
                    console.error(`Failed to fetch user details for email: ${leader.user_email}`, error);
                }
            }

            // Step 3: Combine the data
            const combinedData = teamLeadersData.map((leader) => {
                const userDetails = userAccountsData.find((user) => user.email === leader.user_email);
                return {
                    ...leader,
                    ...userDetails, // Merge team leader and user details
                };
            });

            // Step 4: Set the combined data as team leaders
            setTeamLeaders(combinedData);
        } catch (error) {
            toast.error('Failed to fetch team leaders.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle team card click
    const handleTeamClick = async (team) => {
        setSelectedTeam(team);
        fetchTeamLeaders(team.id); // Fetch team leaders for the selected team
        setOpenDialog(true);
    };

    // Close dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTeam(null);
        setTeamLeaders([]); // Clear team leaders when dialog is closed
        setOpenAddTeamLeaderForm(false);
        setNewTeamLeaderForm({
            fullName: '',
            email: '',
            phoneNumber: '',
            role: 'team_lead',
        });
    };

    // Handle new team leader form input changes
    const handleNewTeamLeaderInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeamLeaderForm({ ...newTeamLeaderForm, [name]: value });
    };

    // Handle new team leader form submission
    const handleAddTeamLeader = async () => {
        if (!newTeamLeaderForm.fullName || !newTeamLeaderForm.email || !newTeamLeaderForm.phoneNumber) {
            toast.error('Please fill all required fields.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            return;
        }

        try {
            // Create user credentials
            const createUserPayload = {
                username: newTeamLeaderForm.email,
                password: '@CodeNet12345', // Set a default password or allow user input
                role: newTeamLeaderForm.role,
            };
            const createUserResponse = await createNewUser(createUserPayload);

            // Insert into user_accounts table
            const newTeamLeader = {
                company_id: companyId, // Associate with the logged-in user's company
                full_name: newTeamLeaderForm.fullName,
                email: newTeamLeaderForm.email,
                phone_number: newTeamLeaderForm.phoneNumber,
                role: newTeamLeaderForm.role,
                is_active: true,
            };
            await insertData('user_accounts', newTeamLeader);

            // Insert into team_leaders table
            const teamLeaderRelation = {
                user_email: newTeamLeaderForm.email,
                team_id: selectedTeam.id,
            };
            await insertData('team_leaders', teamLeaderRelation);

            toast.success('Team leader added successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            fetchTeamLeaders(selectedTeam.id); // Refresh the team leaders list
            setOpenAddTeamLeaderForm(false); // Close the add team leader form
            setNewTeamLeaderForm({
                fullName: '',
                email: '',
                phoneNumber: '',
                role: 'team_lead',
            }); // Reset form
        } catch (error) {
            toast.error('Failed to add team leader.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            console.error('Error:', error);
        }
    };

    // Toggle team leader active status
    const handleToggleStatus = async (userEmail, isActive) => {
        try {
            const newStatus = !isActive; // Calculate the new status

            // Update the team leader status in the authentication system
            await updateUserStatus(userEmail, newStatus ? 'enabled' : 'Disabled');

            // Prepare updates for the user_accounts table
            const updates = { is_active: newStatus };
            const where = { email: userEmail };

            // Update the team leader in the user_accounts table
            await updateData('user_accounts', updates, where);

            toast.success(`Team leader ${isActive ? 'deactivated' : 'activated'} successfully!`, {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });

            // Refresh the team leaders list
            fetchTeamLeaders(selectedTeam.id);
        } catch (error) {
            toast.error('Failed to toggle team leader status.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
            console.error('Error:', error);
        }
    };

    // Fetch teams and groups when company_id is available
    useEffect(() => {
        if (companyId) {
            fetchTeamsAndGroups();
        }
    }, [companyId]);

    return (
        <Box sx={{ padding: 6 }}>
            {/* Header */}
            <Typography variant="h4" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Groups sx={{ fontSize: 32, color: 'primary.main' }} />
                Team Leader Management
            </Typography>

            {/* Loading Spinner */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Group-wise Teams */}
            {groups.map((group) => {
                const groupTeams = teams.filter((team) => team.group_id === group.group_id);
                return (
                    <Box key={group.group_id} sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                            {group.group_name}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={3}>
                            {groupTeams.map((team) => (
                                <Grid item key={team.id} xs={12} sm={6} md={4}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'transform 0.3s ease',
                                            boxShadow: 'none',
                                            outline: 'none',
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 2,
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                            },
                                        }}
                                        onClick={() => handleTeamClick(team)}
                                    >
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Groups sx={{ color: 'primary.main', fontSize: 32 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {team.team_name}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            })}

            {/* Team Leader Management Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Groups sx={{ color: 'primary.main' }} />
                        {selectedTeam?.team_name} - Team Leaders
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* Add New Team Leader Button */}
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenAddTeamLeaderForm(true)}
                        sx={{ mb: 2 }}
                    >
                        Add New Team Leader
                    </Button>

                    {/* Add New Team Leader Form */}
                    {openAddTeamLeaderForm && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Add New Team Leader
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="fullName"
                                        value={newTeamLeaderForm.fullName}
                                        onChange={handleNewTeamLeaderInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={newTeamLeaderForm.email}
                                        onChange={handleNewTeamLeaderInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phoneNumber"
                                        value={newTeamLeaderForm.phoneNumber}
                                        onChange={handleNewTeamLeaderInputChange}
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                variant="contained"
                                onClick={handleAddTeamLeader}
                                sx={{ mt: 2 }}
                            >
                                Save Team Leader
                            </Button>
                        </Box>
                    )}

                    {/* Team Leaders Table */}
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', outline: 'none' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No</TableCell>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone No</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {teamLeaders.map((leader, index) => (
                                    <TableRow key={leader.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{leader.full_name}</TableCell>
                                        <TableCell>{leader.email}</TableCell>
                                        <TableCell>{leader.phone_number}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={leader.is_active}
                                                onChange={() => handleToggleStatus(leader.email, leader.is_active)}
                                                color="success"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamLeaderManagement;