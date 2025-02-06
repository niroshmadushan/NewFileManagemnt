import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    IconButton,
    useTheme,
    CircularProgress,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
} from '@mui/material';

import { Add, Edit, Groups, Search } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { insertData, updateData, selectData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';

const TeamManagement = () => {
    const theme = useTheme();
    const [teams, setTeams] = useState([]); // Original teams data
    const [filteredTeams, setFilteredTeams] = useState([]); // Filtered teams for display
    const [groups, setGroups] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [formData, setFormData] = useState({
        team_name: '',
        group_id: '',
    });
    const [groupFormData, setGroupFormData] = useState({
        group_name: '',
    });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [companyId, setCompanyId] = useState(null);

    // Fetch user details and company ID
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const userDetails = await getUserDetails();
                console.log('User details:', userDetails.data); // Debugging
                setCompanyId(userDetails.data[0]?.company_id);
            } catch (error) {
                console.error('Failed to fetch user details:', error);
                toast.error('Failed to fetch user details.', {
                    style: {
                        background: theme.palette.background.paper,
                        color: theme.palette.error.main,
                        border: `1px solid ${theme.palette.divider}`,
                    },
                });
            }
        };
        fetchUserDetails();
    }, [theme]);

    // Fetch all teams and groups for the company
    const fetchTeamsAndGroups = async () => {
        if (!companyId) return; // Ensure companyId is set

        setLoading(true);
        try {
            // Fetch teams
            const teamsResponse = await selectData('teams', { company_id: companyId });
            console.log('Teams fetched:', teamsResponse.data); // Debugging
            setTeams(teamsResponse.data);
            setFilteredTeams(teamsResponse.data); // Initialize filteredTeams with all teams

            // Fetch groups
            const groupsResponse = await selectData('groups', { company_id: companyId });
            console.log('Groups fetched:', groupsResponse.data); // Debugging
            setGroups(groupsResponse.data);

            toast.success('Data fetched successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to fetch data.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.error.main,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchTeamsAndGroups();
        }
    }, [companyId]);

    // Handle search input changes
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = teams.filter((team) =>
            team.team_name.toLowerCase().includes(query)
        );
        setFilteredTeams(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle group form input changes
    const handleGroupInputChange = (e) => {
        const { name, value } = e.target;
        setGroupFormData({ ...groupFormData, [name]: value });
    };

    // Open dialog for adding/editing a team
    const handleOpenDialog = (team = null) => {
        if (team) {
            setFormData(team);
            setCurrentTeam(team);
        } else {
            setFormData({
                team_name: '',
                group_id: '',
            });
            setCurrentTeam(null);
        }
        setOpenDialog(true);
    };

    // Open dialog for adding a group
    const handleOpenGroupDialog = () => {
        setOpenGroupDialog(true);
    };

    // Close dialogs
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentTeam(null);
    };

    const handleCloseGroupDialog = () => {
        setOpenGroupDialog(false);
    };

    // Handle team form submission
    const handleSubmit = async () => {
        try {
            if (currentTeam) {
                // Update existing team
                const updates = {
                    team_name: formData.team_name,
                    group_id: formData.group_id,
                };

                const where = { id: currentTeam.id };
                await updateData('teams', updates, where);

                toast.success('Team updated successfully!', {
                    style: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                    },
                });
            } else {
                // Add new team
                const data = {
                    team_name: formData.team_name,
                    company_id: companyId,
                    group_id: formData.group_id,
                };
                await insertData('teams', data);

                toast.success('Team added successfully!', {
                    style: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                    },
                });
            }

            fetchTeamsAndGroups(); // Refresh the team and group list
            handleCloseDialog(); // Close the dialog
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to save team.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.error.main,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        }
    };

    // Handle group form submission
    const handleGroupSubmit = async () => {
        try {
            const data = {
                group_name: groupFormData.group_name,
                company_id: companyId,
            };
            await insertData('groups', data);

            toast.success('Group added successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });

            fetchTeamsAndGroups(); // Refresh the group list
            handleCloseGroupDialog(); // Close the dialog
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to save group.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.error.main,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        }
    };

    return (
        <Box sx={{ padding: 6 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups sx={{ fontSize: 32, color: 'primary.main' }} />
                    Team Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: '700px', width: '100%' }}>
                    <TextField
                        label="Search"
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenGroupDialog}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            padding: '10px 20px',
                        }}
                    >
                        Add Group
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            padding: '10px 20px',
                        }}
                    >
                        Add Team
                    </Button>
                </Box>
            </Box>

            {/* Loading Spinner */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Group and Team List */}
            {groups.map((group) => {
                const groupTeams = filteredTeams.filter((team) => team.group_id === group.group_id);
                console.log(`Group: ${group.group_name}, Teams:`, groupTeams); // Debugging

                return (
                    <Box key={group.group_id} sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                            {group.group_name}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={3}>
                            {groupTeams.map((team) => (
                                <Grid item xs={12} sm={6} md={3} key={team.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2,
                                            border: `1px solid ${theme.palette.divider}`,
                                            boxShadow: 'none',
                                            outline: 'none',
                                            transition: 'transform 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                            },
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                flexGrow: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 2,
                                                padding: '16px !important',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        backgroundColor: theme.palette.primary.main,
                                                        color: theme.palette.primary.contrastText,
                                                    }}
                                                >
                                                    <Groups sx={{ fontSize: 24 }} />
                                                </Box>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        flex: 1,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '160px',
                                                    }}
                                                >
                                                    {team.team_name}
                                                </Typography>
                                            </Box>
                                            <IconButton onClick={() => handleOpenDialog(team)}>
                                                <Edit sx={{ color: 'primary.main' }} />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            })}

            {/* Add/Edit Team Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Groups sx={{ color: 'primary.main' }} />
                        {currentTeam ? 'Edit Team' : 'Add Team'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Team Name"
                                name="team_name"
                                value={formData.team_name}
                                onChange={handleInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Groups sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Group</InputLabel>
                                <Select
                                    name="group_id"
                                    value={formData.group_id}
                                    onChange={handleInputChange}
                                    label="Group"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {groups.map((group) => (
                                        <MenuItem key={group.group_id} value={group.group_id}>
                                            {group.group_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {currentTeam ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Group Dialog */}
            <Dialog open={openGroupDialog} onClose={handleCloseGroupDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Groups sx={{ color: 'primary.main' }} />
                        Add Group
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Group Name"
                                name="group_name"
                                value={groupFormData.group_name}
                                onChange={handleGroupInputChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Groups sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGroupDialog} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleGroupSubmit} variant="contained" color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamManagement;