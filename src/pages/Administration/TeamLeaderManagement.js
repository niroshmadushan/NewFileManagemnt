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
    TextField,
    useTheme,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Modal,
    InputAdornment,
} from '@mui/material';
import { Groups, Email, Phone, Add, Search } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, updateData, insertData, selectDataProfiles } from '../../services/dataService';
import { createNewUser } from '../../services/authService';
import { getUserDetails } from '../../services/userService';
import { createUser } from '../../services/authService';

const TeamLeaderManagement = () => {
    const theme = useTheme();
    const [teams, setTeams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [filteredTeamLeaders, setFilteredTeamLeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddTeamLeaderForm, setOpenAddTeamLeaderForm] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [openAssignTeamModal, setOpenAssignTeamModal] = useState(false);
    const [selectedLeader, setSelectedLeader] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

    const [newTeamLeaderForm, setNewTeamLeaderForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'team_lead',
    });

    // Fetch all data
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const userDetails = await getUserDetails();
            setCompanyId(userDetails.company_id);

            const [teamsResponse, groupsResponse] = await Promise.all([
                selectData('teams', { company_id: userDetails.company_id }),
                selectData('groups', { company_id: userDetails.company_id }),
            ]);
            setTeams(teamsResponse.data);
            setGroups(groupsResponse.data);

            const leadersResponse = await selectDataProfiles({
                company_id: userDetails.company_id,
                role: 'team_lead',
            });

            const leadersWithTeamsAndGroups = await Promise.all(
                leadersResponse.data.map(async (leader) => {
                    const teamResponse = await selectData('team_leaders', { user_email: leader.email });
                    const team = teamResponse.data[0] ? teamsResponse.data.find((t) => t.id === teamResponse.data[0].team_id) : null;
                    const group = team ? groupsResponse.data.find((g) => g.group_id === team.group_id) : null;

                    return {
                        ...leader,
                        team: team ? team.team_name : 'Unassigned',
                        team_id: team ? team.id : null,
                        group: group ? group.group_name : 'No Group',
                    };
                })
            );

            setTeamLeaders(leadersWithTeamsAndGroups);
            setFilteredTeamLeaders(leadersWithTeamsAndGroups);
            toast.success('Data fetched successfully!');
        } catch (error) {
            toast.error('Failed to fetch data.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = teamLeaders.filter(
            (leader) =>
                leader.full_name.toLowerCase().includes(query) ||
                leader.email.toLowerCase().includes(query) ||
                leader.team.toLowerCase().includes(query)
        );
        setFilteredTeamLeaders(filtered);
    };

    const handleNewTeamLeaderInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeamLeaderForm({ ...newTeamLeaderForm, [name]: value });
    };

    const handleAddTeamLeader = async () => {
        if (!newTeamLeaderForm.fullName || !newTeamLeaderForm.email || !newTeamLeaderForm.phoneNumber) {
            toast.error('Please fill all required fields.');
            return;
        }

        try {
            // Insert into user_accounts table
            const newUser = {
                company_id: companyId, // Ensure the user is associated with the selected company
                full_name: newTeamLeaderForm.fullName,
                email: newTeamLeaderForm.email,
                phone_number: newTeamLeaderForm.phoneNumber,
                role: newTeamLeaderForm.role,
                is_active: true,
                password_hashed:'@CodeNet12345',
            };

            await createUser(newUser);

            toast.success('Team leader added successfully!');
            fetchAllData();
            setOpenAddTeamLeaderForm(false);
            setNewTeamLeaderForm({
                fullName: '',
                email: '',
                phoneNumber: '',
                role: 'team_lead',
            });
        } catch (error) {
            toast.error('Failed to add team leader.');
            console.error('Error:', error);
        }
    };

    const handleAssignTeam = async () => {
        if (!selectedLeader || !selectedTeamId) {
            toast.error('Please select a team.');
            return;
        }

        try {
            const existingAssignment = await selectData('team_leaders', { user_email: selectedLeader.email });
            if (existingAssignment.data.length > 0) {
                await updateData('team_leaders', { team_id: selectedTeamId }, { user_email: selectedLeader.email });
            } else {
                await insertData('team_leaders', { user_email: selectedLeader.email, team_id: selectedTeamId });
            }

            toast.success('Team assigned successfully!');
            fetchAllData();
            setOpenAssignTeamModal(false);
            setOpenConfirmationModal(false);
        } catch (error) {
            toast.error('Failed to assign team.');
            console.error('Error:', error);
        }
    };

    const handleAssignTeamClick = () => {
        if (!selectedLeader || !selectedTeamId) {
            toast.error('Please select a team.');
            return;
        }
        setOpenConfirmationModal(true);
    };

    return (
        <Box sx={{ padding: 6 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups sx={{ fontSize: 32, color: 'primary.main' }} />
                    Team Leader Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenAddTeamLeaderForm(true)}
                    >
                        Add New Team Leader
                    </Button>
                    <TextField
                        placeholder="Search by name, email or team..."
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: '300px' }}
                    />
                </Box>
            </Box>

            {/* Loading Spinner */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Team Leaders Cards */}
            <Box
                sx={{
                    display: 'grid',
                    paddingRight:1,
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 3,
                    maxHeight: '600px', // Set a maximum height for the card container
                    overflowY: 'auto', // Add vertical scrollbar
                    '&::-webkit-scrollbar': {
                        width: '8px', // Scrollbar width
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc', // Scrollbar thumb color
                        borderRadius: '4px', // Scrollbar thumb border radius
                    },
                    '&::-webkit-scrollbar-track': {
                        
                    },
                }}
            >
                {filteredTeamLeaders.map((leader) => (
                    <Card
                        key={leader.id}
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
                    >
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {leader.full_name}
                            </Typography>
                            <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email sx={{ color: 'text.secondary' }} />
                                {leader.email}
                            </Typography>
                            <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Phone sx={{ color: 'text.secondary' }} />
                                {leader.phone_number}
                            </Typography>
                            <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Groups sx={{ color: 'text.secondary' }} />
                                Team: {leader.team || 'Unassigned'}
                            </Typography>
                            <Typography sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Groups sx={{ color: 'text.secondary' }} />
                                Group: {leader.group || 'No Group'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setSelectedLeader(leader);
                                        setSelectedTeamId(leader.team_id || '');
                                        setOpenAssignTeamModal(true);
                                    }}
                                >
                                    Change Team
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Add New Team Leader Form */}
            <Dialog open={openAddTeamLeaderForm} onClose={() => setOpenAddTeamLeaderForm(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Add sx={{ color: 'primary.main' }} />
                        Add New Team Leader
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
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
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddTeamLeaderForm(false)} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleAddTeamLeader} variant="contained" color="primary">
                        Save Team Leader
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Team Modal */}
            <Modal open={openAssignTeamModal} onClose={() => setOpenAssignTeamModal(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Assign Team to {selectedLeader?.full_name}
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Select Team</InputLabel>
                        <Select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            label="Select Team"
                            startAdornment={
                                <InputAdornment position="start">
                                    <Groups sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            }
                        >
                            {teams.map((team) => (
                                <MenuItem key={team.id} value={team.id}>
                                    {team.team_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handleAssignTeamClick}
                            sx={{ width: '150px' }}
                            startIcon={<Groups />}
                        >
                            Assign Team
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Confirmation Modal */}
            <Modal open={openConfirmationModal} onClose={() => setOpenConfirmationModal(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Are you sure?
                    </Typography>
                    <Typography sx={{ mb: 3 }}>
                        Do you want to assign the selected team to {selectedLeader?.full_name}?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setOpenConfirmationModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleAssignTeam}
                        >
                            Confirm
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default TeamLeaderManagement;