import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Paper,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Grid,
    IconButton,


} from '@mui/material';
import { toast } from 'react-hot-toast';
import { selectData, selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { ThemeContext } from '../../context/ThemeContext';
import {
    Description as DescriptionIcon,
    AttachMoney as BudgetIcon,
    CalendarToday as DateIcon,
    Person as PersonIcon,
    ArrowBackIos as LeftArrowIcon,
    ArrowForwardIos as RightArrowIcon,
    Groups as TeamIcon, // Icon for teams
} from '@mui/icons-material';
import { Groups} from '@mui/icons-material';
const PlanPage = () => {
    const theme = useTheme();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [teamMembers, setTeamMembers] = useState([]);
    const [companyId, setCompanyId] = useState(null);
    const [teamId, setTeamId] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [participation, setParticipation] = useState({});
    const [existingRecords, setExistingRecords] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [openTeamSelectDialog, setOpenTeamSelectDialog] = useState(false);
    const [userTeams, setUserTeams] = useState([]); // Teams the user is currently working on
    const [teamNames, setTeamNames] = useState({}); // Map of team IDs to team names
    const [planFields, setPlanFields] = useState([]);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const { darkMode } = useContext(ThemeContext);

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const userDetails = await getUserDetails();
                const companyId = userDetails.company_id;
                setCompanyId(companyId);

                // Fetch teams the user is currently working on
                const teamMemberData = await selectData('members', { member_email: userDetails.email });
                const teams = teamMemberData.data.map(member => member.team_id);
                setUserTeams(teams);

                // Fetch team names for the user's teams
                const teamNamesMap = {};
                for (const teamId of teams) {
                    const teamData = await selectData('teams', { id: teamId });
                    if (teamData.data.length > 0) {
                        teamNamesMap[teamId] = teamData.data[0].team_name;
                    }
                }
                setTeamNames(teamNamesMap);

                if (teams.length > 0) {
                    setTeamId(teams[0]); // Default to the first team
                    fetchTeamData(teams[0]);
                }
            } catch (error) {
                console.error('Failed to fetch team details:', error);
                toast.error('Failed to fetch team details.', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            }
        };

        fetchTeamDetails();
    }, [month, year]);

    const fetchTeamData = async (teamId) => {
        try {
            const teamData = await selectData('teams', { id: teamId });
            const teamName = teamData.data[0]?.team_name;
            setTeamName(teamName);

            const membersResponse = await selectData('members', { team_id: teamId });
            const membersData = membersResponse.data;

            const teamMembersWithDetails = [];
            for (const member of membersData) {
                try {
                    const userResponse = await selectDataProfiles({ email: member.member_email });
                    if (userResponse.data.length > 0) {
                        const userDetails = userResponse.data[0];
                        teamMembersWithDetails.push({
                            ...member,
                            ...userDetails,
                        });
                    }
                } catch (error) {
                    console.error(`Failed to fetch user details for email: ${member.member_email}`, error);
                }
            }

            setTeamMembers(teamMembersWithDetails);

            const existingRecords = await selectData('monthly_plans_teams', { team_id: teamId, month: month, year: year, is_active: true });
            setExistingRecords(existingRecords.data);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
            toast.error('Failed to fetch team data.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        }
    };

    const handleYearChange = (event) => setYear(event.target.value);
    const handleMonthChange = (direction) => {
        if (direction === 'prev' && month > 1) setMonth(month - 1);
        if (direction === 'next' && month < 12) setMonth(month + 1);
    };

    const handleTeamSelect = (teamId) => {
        setTeamId(teamId);
        fetchTeamData(teamId);
        setOpenTeamSelectDialog(false);
    };

    const handleCardClick = async (record) => {
        try {
            if (!record || typeof record !== 'object') {
                throw new Error('Invalid record data');
            }

            let planData = {};
            if (record.plan && typeof record.plan === 'string') {
                try {
                    planData = JSON.parse(record.plan);
                } catch (error) {
                    console.error('Failed to parse plan data:', error);
                    toast.error('Failed to load plan data. Please check the data format.', {
                        style: {
                            borderRadius: '8px',
                            background: darkMode ? '#333' : '#fff',
                            color: darkMode ? '#fff' : '#333',
                        },
                    });
                    return;
                }
            } else {
                console.warn('Plan data is missing or invalid');
                toast.error('Plan data is missing or invalid.', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
                return;
            }

            let fieldStructure = [];
            if (record.field_structure && typeof record.field_structure === 'string') {
                try {
                    fieldStructure = JSON.parse(record.field_structure);
                } catch (error) {
                    console.error('Failed to parse field structure:', error);
                    toast.error('Failed to load field structure. Using default structure.', {
                        style: {
                            borderRadius: '8px',
                            background: darkMode ? '#333' : '#fff',
                            color: darkMode ? '#fff' : '#333',
                        },
                    });
                }
            } else {
                console.warn('Field structure is missing or invalid. Using default structure.');
            }

            const updatedFields = fieldStructure.map((field) => {
                const value = planData[field.label] || '';
                return {
                    ...field,
                    value: value,
                };
            });

            setPlanFields(updatedFields);

            const participationData = await selectData('TeamMemberParticipation', { plan_id: record.id });
            const participationMap = {};
            participationData.data.forEach((record) => {
                participationMap[record.member_email] = record.participation_percentage;
            });
            setParticipation(participationMap);

            setSelectedRecord(record);
        } catch (error) {
            console.error('Error in handleCardClick:', error);
            toast.error('Failed to load record. Please check the console for details.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        }
    };

    // Map field types to icons
    const getFieldIcon = (label) => {
        switch (label) {
            case 'Plan Name':
                return <DescriptionIcon sx={{ fontSize: 18, mr: 1 }} />;
            case 'Budget':
                return <BudgetIcon sx={{ fontSize: 18, mr: 1 }} />;
            case 'Start Date':
            case 'End Date':
                return <DateIcon sx={{ fontSize: 18, mr: 1 }} />;
            default:
                return <DescriptionIcon sx={{ fontSize: 18, mr: 1 }} />;
        }
    };

    // Handle navigation arrows
    const handleNext = () => {
        if (currentPlanIndex + 3 < existingRecords.length) {
            setCurrentPlanIndex(currentPlanIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentPlanIndex > 0) {
            setCurrentPlanIndex(currentPlanIndex - 1);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 4, padding: 4 }}>
            <Box sx={{ flex: 2 }}>
                <Paper sx={{ padding: 3, backgroundColor: theme.palette.background.paper, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            View Monthly Plan
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                onChange={handleYearChange}
                                size="small"
                                sx={{ width: 100 }}
                            />

                            <Button
                                variant="outlined"
                                onClick={() => setOpenTeamSelectDialog(true)}
                            >
                                Select Team
                            </Button>
                        </Box>
                    </Box>

                    {/* Dynamic Fields with Icons and Two-Column Layout */}
                    {selectedRecord && (
                        <Grid container spacing={1} sx={{ mb: 3 }}>
                            {planFields.map((field, index) => (
                                <React.Fragment key={index}>
                                    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        {getFieldIcon(field.label)}
                                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary, minWidth: 120 }}>
                                            {field.label}
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={field.value}
                                            size="small"
                                            disabled
                                            sx={{ ml: 2 }}
                                        />
                                    </Grid>
                                </React.Fragment>
                            ))}
                        </Grid>
                    )}

                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                Existing Records
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                Total Plans: {existingRecords.length}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton onClick={handlePrev} disabled={currentPlanIndex === 0}>
                                <LeftArrowIcon />
                            </IconButton>

                            <Grid container spacing={3}>
                                {existingRecords.slice(currentPlanIndex, currentPlanIndex + 3).map((record) => (
                                    <Grid item xs={12} sm={6} md={4} key={record.id}>
                                        <Card
                                            sx={{
                                                cursor: 'pointer',
                                                boxShadow: 'none',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                backgroundColor: theme.palette.background.default,
                                                '&:hover': {
                                                    outline: `2px solid ${theme.palette.primary.main}`,
                                                },
                                            }}
                                            onClick={() => handleCardClick(record)}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <DescriptionIcon sx={{ fontSize: 18 }} />
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                        {JSON.parse(record.plan)['Plan Name'] || 'Untitled Record'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                                                    {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                    Team: {teamName}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            <IconButton onClick={handleNext} disabled={currentPlanIndex + 3 >= existingRecords.length}>
                                <RightArrowIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ flex: 1 }}>
                <Paper sx={{ padding: 3, backgroundColor: theme.palette.background.paper, borderRadius: 4, boxShadow: 'none' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: theme.palette.text.primary }}>
                        Team Members
                    </Typography>

                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary }}>
                            Total Contribution:
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 'bold',
                                color:
                                    Object.values(participation).reduce((sum, percentage) => sum + (percentage || 0), 0) === 100
                                        ? theme.palette.success.main
                                        : theme.palette.error.main,
                            }}
                        >
                            {Object.values(participation).reduce((sum, percentage) => sum + (percentage || 0), 0)}%
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            maxHeight: 400,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#f1f1f1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#757575' : '#888',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#999' : '#555',
                            },
                        }}
                    >
                        {teamMembers.map((member) => (
                            <Paper
                                key={member.id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 3,
                                    mr: 1,
                                    boxShadow: 'none',
                                    backgroundColor: theme.palette.background.default,
                                    transition: 'transform 0.2s, box-shadow 0.2s',

                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: theme.palette.primary.main,
                                        color: theme.palette.primary.contrastText,
                                    }}
                                >
                                    {member.full_name[0]}
                                </Avatar>

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.text.primary }}>
                                        {member.full_name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                                        {member.email}
                                    </Typography>
                                </Box>

                                <Box sx={{ width: 100, textAlign: 'center' }}>
                                    <Slider
                                        value={participation[member.id] || 0}
                                        aria-labelledby="participation-slider"
                                        sx={{
                                            color: theme.palette.primary.main,
                                            '& .MuiSlider-thumb': {
                                                width: 12,
                                                height: 12,
                                                transition: '0.3s',
                                                '&:hover, &.Mui-focusVisible': {},
                                            },
                                        }}
                                        disabled
                                    />
                                    <Typography variant="body2" sx={{ fontSize: 11, color: theme.palette.text.secondary }}>
                                        {participation[member.id] || 0}%
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Paper>
            </Box>

            {/* Team Selection Popup */}
            <Dialog open={openTeamSelectDialog} onClose={() => setOpenTeamSelectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Select Team</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        {userTeams.map((teamId) => (

                            <Grid item xs={12} sm={6} key={teamId}>
                                <Card
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
                                    onClick={() => handleTeamSelect(teamId)}
                                >
                                    <CardContent>
                                       
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Groups sx={{ fontSize: 24, color: 'primary.main' }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {teamNames[teamId] || `Team ${teamId}`}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTeamSelectDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlanPage;