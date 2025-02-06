import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Paper,
    LinearProgress,
    Grid,
    Divider,
    useTheme,
} from '@mui/material';
import { selectData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { ThemeContext } from '../../context/ThemeContext';
import {
    CheckCircle,
    PendingActions,
    TrendingUp,
    Assignment,
    Task,
    Description,
    Assessment,
    Timeline,
} from '@mui/icons-material';

const AnalyticsPage = () => {
    const { darkMode } = useContext(ThemeContext);
    const theme = useTheme();
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
    const [myTaskStats, setMyTaskStats] = useState({
        totalTasks: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const userDetails = await getUserDetails();
            const userId = userDetails.id;

            // Fetch Member Plan Analytics
            const memberPlans = await selectData('member_plan', { member_id: userId });
            const memberPlanData = memberPlans.data;
            const totalPlans = memberPlanData.length;
            const completedPlans = memberPlanData.filter((plan) => plan.status === 'Completed').length;
            const pendingPlans = memberPlanData.filter((plan) => plan.status === 'Pending').length;
            const inProgressPlans = memberPlanData.filter((plan) => plan.status === 'In Progress').length;

            setMemberPlanStats({
                totalPlans,
                completed: completedPlans,
                pending: pendingPlans,
                inProgress: inProgressPlans,
            });

            // Fetch Member Task Analytics
            const memberTasks = await selectData('member_task', { member_id: userId });
            const memberTaskData = memberTasks.data;
            const totalTasks = memberTaskData.length;
            const completedTasks = memberTaskData.filter((task) => task.status === 'Completed').length;
            const pendingTasks = memberTaskData.filter((task) => task.status === 'Pending').length;
            const inProgressTasks = memberTaskData.filter((task) => task.status === 'In Progress').length;

            setMemberTaskStats({
                totalTasks,
                completed: completedTasks,
                pending: pendingTasks,
                inProgress: inProgressTasks,
            });

            // Fetch My Task Analytics
            const myTasks = await selectData('my_task', { user_id: userId });
            const myTaskData = myTasks.data;
            const totalMyTasks = myTaskData.length;
            const completedMyTasks = myTaskData.filter((task) => task.status === 'Complete').length;
            const pendingMyTasks = myTaskData.filter((task) => task.status === 'Pending').length;
            const inProgressMyTasks = myTaskData.filter((task) => task.status === 'In Progress').length;

            setMyTaskStats({
                totalTasks: totalMyTasks,
                completed: completedMyTasks,
                pending: pendingMyTasks,
                inProgress: inProgressMyTasks,
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
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
                        <Typography variant="body1">Completed: {stats.completed}</Typography>
                        {renderProgressBar(stats.completed, stats.totalPlans || stats.totalTasks, '#81c784')}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1">Pending: {stats.pending}</Typography>
                        {renderProgressBar(stats.pending, stats.totalPlans || stats.totalTasks, '#ffeb3b')}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="body1">In Progress: {stats.inProgress}</Typography>
                        {renderProgressBar(stats.inProgress, stats.totalPlans || stats.totalTasks, '#64b5f6')}
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
                Analytics
            </Typography>

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
                                Total Monthly Tasks Contribution
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

            {/* Four Beautiful Analytics Cards */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={6} lg={3}>
                    {renderStatsCard('Member Plans', memberPlanStats, <Assignment fontSize="large" />, '#81c784')}
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    {renderStatsCard('Member Tasks', memberTaskStats, <Task fontSize="large" />, '#64b5f6')}
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    {renderStatsCard('My Tasks', myTaskStats, <Description fontSize="large" />, '#ffeb3b')}
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    {renderStatsCard('Overall Progress', {
                        totalPlans: memberPlanStats.totalPlans + memberTaskStats.totalTasks + myTaskStats.totalTasks,
                        completed: memberPlanStats.completed + memberTaskStats.completed + myTaskStats.completed,
                        pending: memberPlanStats.pending + memberTaskStats.pending + myTaskStats.pending,
                        inProgress: memberPlanStats.inProgress + memberTaskStats.inProgress + myTaskStats.inProgress,
                    }, <Assessment fontSize="large" />, '#ff8a65')}
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsPage;