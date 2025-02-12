import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Box, Typography, Grid, Card, CardContent, Avatar } from '@mui/material';
import { Event, Schedule, History, Person, CheckCircle, Upcoming, DoneAll } from '@mui/icons-material';
import { selectData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Medal Icons
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Gold
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'; // Silver
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech'; // Bronze
import StarIcon from '@mui/icons-material/Star'; // 4th place
import GradeIcon from '@mui/icons-material/Grade'; // 5th place

const Analytics = () => {
    const [totalInvitations, setTotalInvitations] = useState(0);
    const [ongoingInvitations, setOngoingInvitations] = useState(0);
    const [upcomingInvitations, setUpcomingInvitations] = useState(0);
    const [passedInvitations, setPassedInvitations] = useState(0);
    const [weeklyData, setWeeklyData] = useState([]);
    const [topResponsePersons, setTopResponsePersons] = useState([]);
    const [companyId, setCompanyId] = useState(null);
    const { darkMode } = useContext(ThemeContext);

    // Fetch the company ID from user details
    useEffect(() => {
        const fetchCompanyId = async () => {
            try {
                const userDetails = await getUserDetails();
                setCompanyId(userDetails.company_id);
            } catch (error) {
                console.error('Failed to fetch user details:', error);
                toast.error('Failed to fetch user details. Please check the console for details.');
            }
        };

        fetchCompanyId();
    }, []);

    // Fetch invitations data
    useEffect(() => {
        const fetchInvitations = async () => {
            if (companyId) {
                try {
                    const response = await selectData('invitations', { company_id: companyId, is_deleted: false });
                    const invitations = response.data;

                    setTotalInvitations(invitations.length);
                    setOngoingInvitations(invitations.filter(inv => inv.status === 'ongoing').length);
                    setUpcomingInvitations(invitations.filter(inv => inv.status === 'upcoming').length);
                    setPassedInvitations(invitations.filter(inv => inv.status === 'passed').length);

                    // Process weekly data
                    const weeklyCounts = {};
                    invitations.forEach(inv => {
                        const week = getWeekNumber(new Date(inv.date));
                        if (!weeklyCounts[week]) {
                            weeklyCounts[week] = 0;
                        }
                        weeklyCounts[week]++;
                    });

                    const weeklyDataArray = Object.keys(weeklyCounts).map(week => ({
                        week: `Week ${week}`,
                        invitations: weeklyCounts[week]
                    }));

                    setWeeklyData(weeklyDataArray);

                    // Process top response persons
                    const responsePersonCounts = {};
                    invitations.forEach(inv => {
                        if (!responsePersonCounts[inv.response_person]) {
                            responsePersonCounts[inv.response_person] = 0;
                        }
                        responsePersonCounts[inv.response_person]++;
                    });

                    const topPersons = Object.entries(responsePersonCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5) // Top 5 persons
                        .map(([name, count], index) => ({
                            name,
                            count,
                            rank: index + 1, // Assign rank (1st, 2nd, etc.)
                        }));

                    setTopResponsePersons(topPersons);
                } catch (error) {
                    console.error('Failed to fetch invitations:', error);
                    toast.error('Failed to fetch invitations. Please check the console for details.');
                }
            }
        };

        fetchInvitations();
    }, [companyId]);

    const getWeekNumber = (date) => {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    };

    const analyticsCards = [
        {
            title: 'Total',
            value: totalInvitations,
            icon: <Event fontSize="small" />,
            color: 'primary.main',
        },
        {
            title: 'Ongoing',
            value: ongoingInvitations,
            icon: <CheckCircle fontSize="small" />,
            color: 'success.main',
        },
        {
            title: 'Upcoming',
            value: upcomingInvitations,
            icon: <Upcoming fontSize="small" />,
            color: 'warning.main',
        },
        {
            title: 'Passed',
            value: passedInvitations,
            icon: <DoneAll fontSize="small" />,
            color: 'error.main',
        },
    ];

    // Medal Icons based on rank
    const getMedalIcon = (rank) => {
        switch (rank) {
            case 1:
                return <EmojiEventsIcon sx={{ color: '#FFD700' }} />; // Gold
            case 2:
                return <WorkspacePremiumIcon sx={{ color: '#C0C0C0' }} />; // Silver
            case 3:
                return <MilitaryTechIcon sx={{ color: '#CD7F32' }} />; // Bronze
            case 4:
                return <StarIcon sx={{ color: '#FF69B4' }} />; // 4th place
            case 5:
                return <GradeIcon sx={{ color: '#00BFFF' }} />; // 5th place
            default:
                return null;
        }
    };

    return (
        <Box sx={{ padding: 2, height: '90vh', overflowY: 'auto' }}>
            {/* Page Title */}
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Event sx={{ fontSize: 24, color: 'primary.main' }} />
                Invitation Analytics
            </Typography>

            {/* Analytics Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {analyticsCards.map((card, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card
                                sx={{
                                    boxShadow: 'none',
                                    backgroundColor: darkMode ? '#424242' : '#fff',
                                    color: darkMode ? '#fff' : '#000',
                                    borderRadius: 2,
                                    textAlign: 'center',
                                    padding: 1,
                                    height: 130,
                                }}
                            >
                                <Avatar sx={{ bgcolor: card.color, width: 40, height: 40, margin: 'auto', mt: 1 }}>
                                    {card.icon}
                                </Avatar>
                                <CardContent>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: card.color }}>
                                        {card.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Weekly Invitations Chart */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Weekly Invitations
            </Typography>
            <Box sx={{ height: '200px', mb: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                        <XAxis dataKey="week" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="invitations" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Top Response Persons Leaderboard */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Top Response Persons
            </Typography>
            <Grid container spacing={2}>
                {topResponsePersons.map((person, index) => (
                    <Grid item xs={12} sm={4} md={2} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card
                                sx={{
                                    boxShadow: 'none',
                                    backgroundColor: darkMode ? '#424242' : '#fff',
                                    color: darkMode ? '#fff' : '#000',
                                    borderRadius: 2,
                                    textAlign: 'center',
                                    padding: 1,
                                }}
                            >
                                <Avatar sx={{ backgroundColor: darkMode ? '#424242' : '#fff', width: 40, height: 40, margin: 'auto', mt: 1 }}>
                                    {getMedalIcon(person.rank)}
                                </Avatar>
                                <CardContent>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {person.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: darkMode ? '#ccc' : '#666' }}>
                                        {person.count} Invitations
                                    </Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Analytics;