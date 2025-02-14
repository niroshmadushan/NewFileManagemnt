import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    LinearProgress,
    Grid,
    Divider,
    useTheme,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
} from '@mui/material';
import { selectData, selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { ThemeContext } from '../../context/ThemeContext';
import {
    TrendingUp,
    Timeline,
    Assignment,
    Task,
    Assessment,
    Person,
} from '@mui/icons-material';

const AnalyticsPage = () => {
    const { darkMode } = useContext(ThemeContext);
    const theme = useTheme();
    const [teamPlanStats, setTeamPlanStats] = useState({
        totalPlans: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
    });
    const [teamTaskStats, setTeamTaskStats] = useState({
        totalTasks: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState('');
    const [memberPlanStats, setMemberPlanStats] = useState({
        totalPlans: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
    });
    const [memberTaskStats, setMemberTaskStats] = useState({
        totalTasks: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
    });
    const [currentTab, setCurrentTab] = useState(0); // 0 for Team Stats, 1 for Member Stats

    useEffect(() => {
        fetchTeamAnalytics();
    }, []);

    const fetchTeamAnalytics = async () => {
        try {
            const userDetails = await getUserDetails();
            const teamId = userDetails.team_id;

            // Fetch Team Plans
            const teamPlans = await selectData('member_plan', { team_id: teamId });
            const teamPlanData = teamPlans.data || [];
            const totalPlans = teamPlanData.length;
            const completedPlans = teamPlanData.filter((plan) => plan.status === 'Completed').length;
            const pendingPlans = teamPlanData.filter((plan) => plan.status === 'Pending').length;
            const inProgressPlans = teamPlanData.filter((plan) => plan.status === 'In Progress').length;

            setTeamPlanStats({
                totalPlans,
                completed: completedPlans,
                pending: pendingPlans,
                inProgress: inProgressPlans,
            });

            // Fetch Team Tasks
            const teamTasks = await selectData('member_task', { team_id: teamId });
            const teamTaskData = teamTasks.data || [];
            const totalTasks = teamTaskData.length;
            const completedTasks = teamTaskData.filter((task) => task.status === 'Completed').length;
            const pendingTasks = teamTaskData.filter((task) => task.status === 'Pending').length;
            const inProgressTasks = teamTaskData.filter((task) => task.status === 'In Progress').length;

            setTeamTaskStats({
                totalTasks,
                completed: completedTasks,
                pending: pendingTasks,
                inProgress: inProgressTasks,
            });

            // Fetch Team Members
            const membersResponse = await selectData('members', { team_id: teamId, status: 'active' });
            const membersData = membersResponse.data || [];

            // Fetch Full User Details for Each Member
            const membersWithDetails = await Promise.all(
                membersData.map(async (member) => {
                    try {
                        const userDetailsResponse = await selectDataProfiles({ email: member.member_email });
                        if (userDetailsResponse.data && userDetailsResponse.data.length > 0) {
                            return {
                                ...member,
                                ...userDetailsResponse.data[0], // Merge member data with user details
                            };
                        }
                        return member; // If no user details found, return the original member data
                    } catch (error) {
                        console.error(`Failed to fetch user details for email: ${member.member_email}`, error);
                        return member; // Return the original member data if there's an error
                    }
                })
            );

            setTeamMembers(membersWithDetails); // Set the full member details
        } catch (error) {
            console.error('Failed to fetch team analytics:', error);
        }
    };

    const fetchMemberStats = async (memberId) => {
        try {
            // Fetch Member Plans
            const memberPlans = await selectData('member_plan', { member_id: memberId });
            const memberPlanData = memberPlans.data || [];
            const totalPlans = memberPlanData.length;
            const completedPlans = memberPlanData.filter((plan) => plan.status === 'Completed').length;
            const pendingPlans = memberPlanData.filter((plan) => plan.status === 'Pending').length;
            const inProgressPlans = memberPlanData.filter((plan) => plan.status === 'In Progress').length;

            setMemberPlanStats({
                totalPlans: totalPlans || 0,
                completed: completedPlans || 0,
                pending: pendingPlans || 0,
                inProgress: inProgressPlans || 0,
            });

            // Fetch Member Tasks
            const memberTasks = await selectData('member_task', { member_id: memberId });
            const memberTaskData = memberTasks.data || [];
            const totalTasks = memberTaskData.length;
            const completedTasks = memberTaskData.filter((task) => task.status === 'Completed').length;
            const pendingTasks = memberTaskData.filter((task) => task.status === 'Pending').length;
            const inProgressTasks = memberTaskData.filter((task) => task.status === 'In Progress').length;

            setMemberTaskStats({
                totalTasks: totalTasks || 0,
                completed: completedTasks || 0,
                pending: pendingTasks || 0,
                inProgress: inProgressTasks || 0,
            });
        } catch (error) {
            console.error('Failed to fetch member stats:', error);
            // If there's an error, reset member stats to zero
            setMemberPlanStats({
                totalPlans: 0,
                completed: 0,
                pending: 0,
                inProgress: 0,
            });
            setMemberTaskStats({
                totalTasks: 0,
                completed: 0,
                pending: 0,
                inProgress: 0,
            });
        }
    };

    const calculatePercentage = (value, total) => {
        return total === 0 ? 0 : Math.round((value / total) * 100);
    };

    const renderProgressBar = (completed, total, color) => {
        const percentage = calculatePercentage(completed, total);
        return (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: '100%' }}>
                    <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: darkMode ? '#424242' : '#f5f5f5',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: color,
                                borderRadius: 6,
                            },
                        }}
                    />
                </Box>
                <Typography
                    variant="body2"
                    sx={{
                        color: darkMode ? '#fff' : '#000',
                        fontWeight: 'bold',
                        minWidth: '40px',
                        textAlign: 'right',
                    }}
                >
                    {percentage}%
                </Typography>
            </Box>
        );
    };

    const renderStatsCard = (title, stats, icon, color) => {
        return (
            <Paper
                sx={{
                    padding: 3,
                    borderRadius: 2,
                    backgroundColor: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#000',
                    boxShadow: 'none',
                    border: `1px solid ${darkMode ? '#424242' : '#e0e0e0'}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {React.cloneElement(icon, { sx: { color } })}
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="body1">Total: {stats.totalPlans || stats.totalTasks}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1">Completed: {stats.completed || stats.completedTasks}</Typography>
                        {renderProgressBar(stats.completed || stats.completedTasks, stats.totalPlans || stats.totalTasks, '#81c784')}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1">Pending: {stats.pending || stats.pendingTasks}</Typography>
                        {renderProgressBar(stats.pending || stats.pendingTasks, stats.totalPlans || stats.totalTasks, '#ffeb3b')}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1">In Progress: {stats.inProgress || stats.inProgressTasks}</Typography>
                        {renderProgressBar(stats.inProgress || stats.inProgressTasks, stats.totalPlans || stats.totalTasks, '#64b5f6')}
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
                Team Analytics
            </Typography>

            {/* Tabs for Team and Member Statistics */}
            <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 4 }}>
                <Tab label="Team Statistics" />
                <Tab label="Member Statistics" />
            </Tabs>

            {currentTab === 0 && (
                <>
                    {/* Big Cards for Total Monthly Contribution */}
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    padding: 3,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? '#333' : '#fff',
                                    color: darkMode ? '#fff' : '#000',
                                    boxShadow: 'none',
                                    border: `1px solid ${darkMode ? '#424242' : '#e0e0e0'}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <TrendingUp fontSize="large" sx={{ color: '#81c784' }} />
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                        Total Monthly Plans Contribution
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {calculatePercentage(teamPlanStats.completed, teamPlanStats.totalPlans)}%
                                </Typography>
                                <Typography variant="body1">
                                    {teamPlanStats.completed} out of {teamPlanStats.totalPlans} plans completed.
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    padding: 3,
                                    borderRadius: 2,
                                    backgroundColor: darkMode ? '#333' : '#fff',
                                    color: darkMode ? '#fff' : '#000',
                                    boxShadow: 'none',
                                    border: `1px solid ${darkMode ? '#424242' : '#e0e0e0'}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Timeline fontSize="large" sx={{ color: '#64b5f6' }} />
                                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                        Total Monthly Tasks Contribution
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {calculatePercentage(teamTaskStats.completed, teamTaskStats.totalTasks)}%
                                </Typography>
                                <Typography variant="body1">
                                    {teamTaskStats.completed} out of {teamTaskStats.totalTasks} tasks completed.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Four Beautiful Analytics Cards */}
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6} lg={3}>
                            {renderStatsCard('Team Plans', teamPlanStats, <Assignment fontSize="large" />, '#81c784')}
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            {renderStatsCard('Team Tasks', teamTaskStats, <Task fontSize="large" />, '#64b5f6')}
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            {renderStatsCard('Overall Progress', {
                                totalPlans: teamPlanStats.totalPlans + teamTaskStats.totalTasks,
                                completed: teamPlanStats.completed + teamTaskStats.completed,
                                pending: teamPlanStats.pending + teamTaskStats.pending,
                                inProgress: teamPlanStats.inProgress + teamTaskStats.inProgress,
                            }, <Assessment fontSize="large" />, '#ff8a65')}
                        </Grid>
                    </Grid>
                </>
            )}

            {currentTab === 1 && (
                <>
                    {/* Member Selection Dropdown */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                        <FormControl sx={{ width: 300 }}>
                            <InputLabel>Select Team Member</InputLabel>
                            <Select
                                value={selectedMember}
                                onChange={(e) => {
                                    setSelectedMember(e.target.value);
                                    fetchMemberStats(e.target.value);
                                }}
                                label="Select Team Member"
                            >
                                {teamMembers.map((member) => (
                                    <MenuItem key={member.member_id} value={member.id}>
                                        {member.full_name || 'Unknown User'} ({member.email || 'No Email'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Selected Member Statistics */}
                    {selectedMember ? (
                        <>
                            {/* Big Cards for Member Monthly Contribution */}
                            <Grid container spacing={4} sx={{ mb: 4 }}>
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        sx={{
                                            padding: 3,
                                            borderRadius: 2,
                                            backgroundColor: darkMode ? '#333' : '#fff',
                                            color: darkMode ? '#fff' : '#000',
                                            boxShadow: 'none',
                                            border: `1px solid ${darkMode ? '#424242' : '#e0e0e0'}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <TrendingUp fontSize="large" sx={{ color: '#81c784' }} />
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                Member Monthly Plans Contribution
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                                            {calculatePercentage(memberPlanStats.completed, memberPlanStats.totalPlans)}%
                                        </Typography>
                                        <Typography variant="body1">
                                            {memberPlanStats.completed} out of {memberPlanStats.totalPlans} plans completed.
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper
                                        sx={{
                                            padding: 3,
                                            borderRadius: 2,
                                            backgroundColor: darkMode ? '#333' : '#fff',
                                            color: darkMode ? '#fff' : '#000',
                                            boxShadow: 'none',
                                            border: `1px solid ${darkMode ? '#424242' : '#e0e0e0'}`,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Timeline fontSize="large" sx={{ color: '#64b5f6' }} />
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                Member Monthly Tasks Contribution
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                                            {calculatePercentage(memberTaskStats.completed, memberTaskStats.totalTasks)}%
                                        </Typography>
                                        <Typography variant="body1">
                                            {memberTaskStats.completed} out of {memberTaskStats.totalTasks} tasks completed.
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Member Statistics Cards */}
                            <Grid container spacing={4}>
                                <Grid item xs={12} md={4}>
                                    {renderStatsCard('Member Plans', memberPlanStats, <Person fontSize="large" />, '#81c784')}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    {renderStatsCard('Member Tasks', memberTaskStats, <Task fontSize="large" />, '#64b5f6')}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    {renderStatsCard('Overall Progress', {
                                        totalPlans: memberPlanStats.totalPlans + memberTaskStats.totalTasks,
                                        completed: memberPlanStats.completed + memberTaskStats.completed,
                                        pending: memberPlanStats.pending + memberTaskStats.pending,
                                        inProgress: memberPlanStats.inProgress + memberTaskStats.inProgress,
                                    }, <Assessment fontSize="large" />, '#ff8a65')}
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
                            Please select a team member to view their statistics.
                        </Typography>
                    )}
                </>
            )}
        </Box>
    );
};

export default AnalyticsPage;