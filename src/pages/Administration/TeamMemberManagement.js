import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    useTheme,
    Avatar,
    TextField,
    InputAdornment,
    IconButton,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Pagination,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Add, Person, Email, Phone, Groups, Search, Delete, GroupAdd, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { selectData, insertData, selectDataProfiles, updateData } from '../../services/dataService';
import { createUser } from '../../services/authService';
import { getUserDetails } from '../../services/userService';
import { ThemeContext } from '../../context/ThemeContext';

const SuperAdminTeamManagement = () => {
    const theme = useTheme();
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableTeams, setAvailableTeams] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetailsDialog, setMemberDetailsDialog] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [memberTeams, setMemberTeams] = useState([]);
    const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
    const [newMemberForm, setNewMemberForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'team_member',
        teamId: '',
    });
    const { darkMode } = useContext(ThemeContext);

    useEffect(() => {
        fetchUserAndTeamDetails();
    }, []);

    const fetchUserAndTeamDetails = async () => {
        try {
            const userDetails = await getUserDetails();
            const teamData = await selectData('teams', { company_id: userDetails.company_id, status: 'active' });
            const teams = teamData.data.map(team => ({
                teamId: team.id,
                teamName: team.team_name,
            }));
            setAvailableTeams(teams);
            setCompanyId(userDetails.company_id);
            if (teams.length > 0) {
                setSelectedTeamId(teams[0].teamId);
                fetchTeamMembers(teams[0].teamId);
            }
        } catch (error) {
            console.error('Failed to fetch user or team details:', error);
            toast.error('Failed to fetch user or team details.');
        }
    };

    const fetchTeamMembers = async (teamId) => {
        setLoading(true);
        try {
            const membersResponse = await selectData('members', { team_id: teamId, status: 'active' });
            const membersData = membersResponse.data;

            const userAccountsData = [];
            for (const member of membersData) {
                try {
                    const userResponse = await selectDataProfiles({
                        email: member.member_email,
                        role: 'team_member',
                    });
                    if (userResponse.data.length > 0) {
                        userAccountsData.push(userResponse.data[0]);
                    }
                } catch (error) {
                    console.error(`Failed to fetch user details for email: ${member.member_email}`, error);
                }
            }

            const combinedData = membersData.map((member) => {
                const userDetails = userAccountsData.find((user) => user.email === member.member_email);
                return {
                    ...member,
                    ...userDetails,
                };
            });

            setMembers(combinedData.filter((member) => member.is_active));
            setFilteredMembers(combinedData.filter((member) => member.is_active));
        } catch (error) {
            console.error('Failed to fetch team members:', error);
            toast.error('Failed to fetch team members.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberTeams = async (memberEmail) => {
        try {
            const memberTeamsResponse = await selectData('members', { member_email: memberEmail, status: 'active' });
            const memberTeamsData = memberTeamsResponse.data;

            if (!memberTeamsData || memberTeamsData.length === 0) {
                console.log('No active teams found for this member.');
                setMemberTeams([]);
                return;
            }

            const teamsWithGroups = [];
            for (const team of memberTeamsData) {
                try {
                    const teamDetails = await selectData('teams', { id: team.team_id });
                    const groupDetails = await selectData('groups', { group_id: teamDetails.data[0].group_id });

                    if (teamDetails.data.length > 0 && groupDetails.data.length > 0) {
                        teamsWithGroups.push({
                            team_name: teamDetails.data[0].team_name,
                            group_name: groupDetails.data[0].group_name,
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching details for team_id: ${team.team_id}`, error);
                }
            }

            setMemberTeams(teamsWithGroups);
        } catch (error) {
            console.error('Failed to fetch member teams:', error);
            toast.error('Failed to fetch member teams.');
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = members.filter(
            (member) =>
                member.full_name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
        );
        setFilteredMembers(filtered);
    };

    const handleViewMemberDetails = async (member) => {
        setSelectedMember(member);
        fetchMemberTeams(member.email);
        setMemberDetailsDialog(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMemberForm({ ...newMemberForm, [name]: value });
    };

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleAddMember = async () => {
        if (!newMemberForm.fullName || !newMemberForm.email || !newMemberForm.phoneNumber || !newMemberForm.teamId) {
            toast.error('Please fill all required fields.');
            return;
        }

        if (!validateEmail(newMemberForm.email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        try {
            const newUser = {
                company_id: companyId,
                full_name: newMemberForm.fullName,
                email: newMemberForm.email,
                phone_number: newMemberForm.phoneNumber,
                password_hashed: '@CodeNet12345',
                role: newMemberForm.role,
                is_active: true,
            };
            await createUser(newUser);

            const newMember = {
                member_email: newMemberForm.email,
                team_id: newMemberForm.teamId,
                status: 'active',
            };

            await insertData('members', newMember);

            toast.success('Team member added successfully!');
            fetchTeamMembers(newMemberForm.teamId);
            setOpenAddMemberDialog(false);
            setNewMemberForm({
                fullName: '',
                email: '',
                phoneNumber: '',
                role: 'team_member',
                teamId: '',
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to add team member.');
        }
    };

    const handleFilterByTeam = (teamId) => {
        setSelectedTeamId(teamId);
        fetchTeamMembers(teamId);
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 30, color: 'primary.main' }} />
                    Team Member Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Search Members"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearch}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton>
                                        <Search />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: '300px' }}
                    />
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="team-filter-label">Filter by Team</InputLabel>
                        <Select
                            labelId="team-filter-label"
                            value={selectedTeamId}
                            onChange={(e) => handleFilterByTeam(e.target.value)}
                            label="Filter by Team"
                        >
                            {availableTeams.map((team) => (
                                <MenuItem key={team.teamId} value={team.teamId}>
                                    {team.teamName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenAddMemberDialog(true)}
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            padding: '10px 20px',
                        }}
                    >
                        Add Member
                    </Button>
                </Box>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            <Grid container spacing={3}>
                {filteredMembers.map((member, index) => (
                    <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <Card
                                onClick={() => handleViewMemberDetails(member)}
                                sx={{
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                    border: '1px solid transparent',
                                    transition: 'border-color 0.3s',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                                            {member.full_name[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6">{member.full_name}</Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                {member.email}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                {member.phone_number}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                <Groups fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                                {member.role}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Add Member Dialog */}
            <Dialog open={openAddMemberDialog} onClose={() => setOpenAddMemberDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'primary.main' }} />
                        Add New Team Member
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="fullName"
                                value={newMemberForm.fullName}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={newMemberForm.email}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={newMemberForm.phoneNumber}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone sx={{ color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel id="team-select-label">Select Team</InputLabel>
                                <Select
                                    labelId="team-select-label"
                                    name="teamId"
                                    value={newMemberForm.teamId}
                                    onChange={handleInputChange}
                                    label="Select Team"
                                >
                                    {availableTeams.map((team) => (
                                        <MenuItem key={team.teamId} value={team.teamId}>
                                            {team.teamName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddMemberDialog(false)} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleAddMember} variant="contained" color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Member Details Dialog */}
            <Dialog open={memberDetailsDialog} onClose={() => setMemberDetailsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'primary.main' }} />
                        Member Details
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedMember && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 64, height: 64 }}>{selectedMember.full_name[0]}</Avatar>
                                    <Box>
                                        <Typography variant="h6">{selectedMember.full_name}</Typography>
                                        <Typography variant="body2" color="textSecondary">{selectedMember.email}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">Phone: {selectedMember.phone_number}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mt: 2 }}>Current Teams</Typography>
                                <List>
                                    {memberTeams.map((team, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Groups sx={{ color: 'primary.main' }} />
                                                        <Typography variant="body1">{team.team_name}</Typography>
                                                    </Box>
                                                }
                                                secondary={`Group: ${team.group_name}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMemberDetailsDialog(false)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SuperAdminTeamManagement;