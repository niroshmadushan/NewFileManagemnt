import React, { useState, useEffect } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Add, Person, Email, Phone, Groups, Search, Delete, GroupAdd, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { selectData, insertData, selectDataProfiles, updateData } from '../../services/dataService';
import { createUser } from '../../services/authService';
import { getUserDetails } from '../../services/userService';

const TeamMemberManagement = () => {
    const theme = useTheme();
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableTeams, setAvailableTeams] = useState([]); // Array of { teamId, teamName }
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetailsDialog, setMemberDetailsDialog] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [memberTeams, setMemberTeams] = useState([]);
    const [teamSelectDialog, setTeamSelectDialog] = useState(false); // New state for team selection popup

    const fetchUserAndTeamDetails = async () => {
        try {
            const userDetails = await getUserDetails();
            const teamData = await selectData('members', { member_email: userDetails.email });
            const teams = teamData.data.map(member => member.team_id);
            setCompanyId(userDetails.company_id);

            // Fetch team names for the user's teams
            const teamNamesMap = [];
            for (const teamId of teams) {
                const teamDetails = await selectData('teams', { id: teamId });
                if (teamDetails.data.length > 0) {
                    teamNamesMap.push({
                        teamId: teamId,
                        teamName: teamDetails.data[0].team_name,
                    });
                }
            }
            setAvailableTeams(teamNamesMap);

            if (teamNamesMap.length > 0) {
                setSelectedTeamId(teamNamesMap[0].teamId); // Default to the first team
                fetchTeamMembers(teamNamesMap[0].teamId);
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

    const handleTeamSelect = (teamId) => {
        setSelectedTeamId(teamId);
        fetchTeamMembers(teamId);
        setTeamSelectDialog(false); // Close the team selection popup
    };

    const handleViewMemberDetails = async (member) => {
        setSelectedMember(member);
        fetchMemberTeams(member.email);
        setMemberDetailsDialog(true);
    };

    useEffect(() => {
        fetchUserAndTeamDetails();
    }, []);

    return (
        <Box sx={{ padding: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 30, color: 'primary.main' }} />
                    Team Member Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setTeamSelectDialog(true)}
                        startIcon={<Groups />}
                    >
                        Select Team
                    </Button>
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

            {/* Team Selection Popup */}
            <Dialog open={teamSelectDialog} onClose={() => setTeamSelectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Groups sx={{ color: 'primary.main' }} />
                        Select Team
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        {availableTeams.map((team) => (
                            <Grid item xs={12} sm={6} key={team.teamId}>
                                <Card
                                    onClick={() => handleTeamSelect(team.teamId)}
                                    sx={{
                                        cursor: 'pointer',
                                        boxShadow: 'none',
                                        border: '1px solid transparent',
                                        backgroundColor: theme.palette.background.default,
                                        transition: 'border-color 0.3s',
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Groups sx={{ fontSize: 24, color: 'primary.main' }} />
                                            <Typography variant="h6">{team.teamName}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTeamSelectDialog(false)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Member Details Modal */}
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

export default TeamMemberManagement;