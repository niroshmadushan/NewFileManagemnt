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

import { Add, Edit, Groups, Search, Delete } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { insertData, updateData, selectData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';

const TeamManagement = () => {
    const theme = useTheme();
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openGroupDialog, setOpenGroupDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [formData, setFormData] = useState({
        team_name: '',
        group_id: '',
    });
    const [groupFormData, setGroupFormData] = useState({
        group_id: '',
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
                setCompanyId(userDetails.company_id);
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
        if (!companyId) return;

        setLoading(true);
        try {
            const teamsResponse = await selectData('teams', { company_id: companyId, status: 'active' });
            setTeams(teamsResponse.data);
            setFilteredTeams(teamsResponse.data);

            const groupsResponse = await selectData('groups', { company_id: companyId });
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

        // If a group is selected from the dropdown, populate the group name
        if (name === 'group_id' && value) {
            const selectedGroup = groups.find((group) => group.group_id === value);
            if (selectedGroup) {
                setGroupFormData({
                    group_id: selectedGroup.group_id,
                    group_name: selectedGroup.group_name,
                });
                setCurrentGroup(selectedGroup);
            }
        } else if (name === 'group_id' && !value) {
            // If "Create New Group" is selected, reset the form
            setGroupFormData({
                group_id: '',
                group_name: '',
            });
            setCurrentGroup(null);
        }
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

    // Open dialog for adding/editing a group
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
        setGroupFormData({
            group_id: '',
            group_name: '',
        });
        setCurrentGroup(null);
    };

    // Handle team form submission
    const handleSubmit = async () => {
        try {
            if (currentTeam) {
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
                const data = {
                    team_name: formData.team_name,
                    company_id: companyId,
                    group_id: formData.group_id,
                    status: 'active',
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

            fetchTeamsAndGroups();
            handleCloseDialog();
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
            if (currentGroup) {
                // Update existing group
                const updates = {
                    group_name: groupFormData.group_name,
                };
                const where = { group_id: currentGroup.group_id };
                await updateData('groups', updates, where);

                toast.success('Group updated successfully!', {
                    style: {
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                    },
                });
            } else {
                // Add new group
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
            }

            fetchTeamsAndGroups();
            handleCloseGroupDialog();
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

    // Handle delete confirmation
    const handleDeleteConfirmation = (team) => {
        setTeamToDelete(team);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setTeamToDelete(null);
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;

        try {
            const updates = { status: 'deactive' };
            const where = { id: teamToDelete.id };
            await updateData('teams', updates, where);

            toast.success('Team deactivated successfully!', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });

            fetchTeamsAndGroups();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to deactivate team.', {
                style: {
                    background: theme.palette.background.paper,
                    color: theme.palette.error.main,
                    border: `1px solid ${theme.palette.divider}`,
                },
            });
        } finally {
            handleCloseDeleteDialog();
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
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton onClick={() => handleOpenDialog(team)}>
                                                    <Edit sx={{ color: 'primary.main' }} />
                                                </IconButton>
                                                <IconButton onClick={() => handleDeleteConfirmation(team)}>
                                                    <Delete sx={{ color: 'error.main' }} />
                                                </IconButton>
                                            </Box>
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

            {/* Add/Edit Group Dialog */}
            <Dialog open={openGroupDialog} onClose={handleCloseGroupDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Groups sx={{ color: 'primary.main' }} />
                        {currentGroup ? 'Edit Group' : 'Add Group'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Select Group</InputLabel>
                                <Select
                                    name="group_id"
                                    value={groupFormData.group_id}
                                    onChange={handleGroupInputChange}
                                    label="Select Group"
                                >
                                    <MenuItem value="">
                                        <em>Create New Group</em>
                                    </MenuItem>
                                    {groups.map((group) => (
                                        <MenuItem key={group.group_id} value={group.group_id}>
                                            {group.group_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
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
                        {currentGroup ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Delete sx={{ color: 'error.main' }} />
                        Delete Team
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to Delete the team "{teamToDelete?.team_name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteTeam} variant="contained" color="error">
                        Deactivate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamManagement;