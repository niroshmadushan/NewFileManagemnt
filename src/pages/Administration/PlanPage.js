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
    CircularProgress,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    CardActions,
    Grid,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    List,
    ListItem,
    ListItemText,
    Collapse,
    IconButton,
} from '@mui/material';
import { Add, Save, Delete, ExpandLess, ExpandMore } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { insertData, selectData, updateData, selectDataProfiles } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { ThemeContext } from '../../context/ThemeContext';

import {
    Description as DescriptionIcon,
    ArrowBackIos as LeftArrowIcon,
    ArrowForwardIos as RightArrowIcon,
} from '@mui/icons-material';

// Add this import
// Reusable JSON View Popup Component
const JsonViewPopup = ({ open, onClose, data }) => {
    const [expandedKeys, setExpandedKeys] = useState({});

    const handleExpand = (key) => {
        setExpandedKeys((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const renderJsonData = (data, parentKey = '') => {
        if (typeof data !== 'object' || data === null) {
            return (
                <ListItem sx={{ pl: 4 }}>
                    <ListItemText primary={data} />
                </ListItem>
            );
        }

        return Object.entries(data).map(([key, value]) => {
            const uniqueKey = `${parentKey}-${key}`;
            const isObject = typeof value === 'object' && value !== null;

            return (
                <Box key={uniqueKey}>
                    <ListItem button onClick={() => isObject && handleExpand(uniqueKey)}>
                        <ListItemText primary={key} />
                        {isObject && (expandedKeys[uniqueKey] ? <ExpandLess /> : <ExpandMore />)}
                    </ListItem>
                    {isObject && (
                        <Collapse in={expandedKeys[uniqueKey]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {renderJsonData(value, uniqueKey)}
                            </List>
                        </Collapse>
                    )}
                    {!isObject && (
                        <ListItem sx={{ pl: 4 }}>
                            <ListItemText primary={value} />
                        </ListItem>
                    )}
                </Box>
            );
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>JSON Data</DialogTitle>
            <DialogContent>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <List>
                        {data ? renderJsonData(data) : <Typography>No data available.</Typography>}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const ConfirmationDialog = ({ open, onClose, onConfirm, title, message }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="error">
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const PlanPage = () => {
    const theme = useTheme();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [planFields, setPlanFields] = useState([{ type: 'Text', label: 'Plan Name', value: '', editable: false }]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [teamId, setTeamId] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [participation, setParticipation] = useState({});
    const [openAddFieldDialog, setOpenAddFieldDialog] = useState(false);
    const [newFieldType, setNewFieldType] = useState('');
    const [existingRecords, setExistingRecords] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [historyRecords, setHistoryRecords] = useState([]);
    const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState(null);
    const [openJsonPopup, setOpenJsonPopup] = useState(false);
    const [jsonData, setJsonData] = useState(null);
    const [openRemoveFieldDialog, setOpenRemoveFieldDialog] = useState(false);
    const [fieldToRemove, setFieldToRemove] = useState(null);
    const { darkMode, toggleTheme } = useContext(ThemeContext);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const handleViewJson = (data) => {
        setJsonData(data);
        setOpenJsonPopup(true);
    };

    const handleCloseJsonPopup = () => {
        setOpenJsonPopup(false);
        setJsonData(null);
    };

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                const userDetails = await getUserDetails();
                const companyId = userDetails.company_id;
                const teamLeaderData = await selectData('team_leaders', { user_email: userDetails.email });
                const teamId = teamLeaderData.data[0]?.team_id;
                const teamData = await selectData('teams', { id: teamLeaderData.data[0]?.team_id });
                const teamName = teamData.data[0]?.team_name;

                setCompanyId(companyId);
                setTeamId(teamId);
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

    const handleYearChange = (event) => setYear(event.target.value);
    const handleMonthChange = (direction) => {
        if (direction === 'prev' && month > 1) setMonth(month - 1);
        if (direction === 'next' && month < 12) setMonth(month + 1);
    };

    const handleAddFieldClick = () => {
        setOpenAddFieldDialog(true);
    };

    const handleAddFieldConfirm = () => {
        if (newFieldType) {
            setPlanFields([...planFields, { type: newFieldType, label: '', value: '', editable: true }]);
            setOpenAddFieldDialog(false);
            setNewFieldType('');
        }
    };

    const handleFieldChange = (index, field, value) => {
        const updatedFields = [...planFields];
        updatedFields[index][field] = value;
        setPlanFields(updatedFields);
    };

    const handleParticipationChange = (memberId, value) => {
        setParticipation((prev) => ({
            ...prev,
            [memberId]: value,
        }));
    };
    const handleNext = () => {
        if (currentPlanIndex + 3 < existingRecords.length) {
            setCurrentPlanIndex(currentPlanIndex + 1);
        }
    };
    const handleSavePlan = async () => {
        if (!planFields.every((field) => field.label && (field.editable || field.value))) {
            toast.error('Please fill all plan fields.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            return;
        }

        const totalParticipation = Object.values(participation).reduce((sum, percentage) => sum + (percentage || 0), 0);
        if (totalParticipation !== 100) {
            toast.error('Total participation must be 100%.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
            return;
        }

        setConfirmationAction('save');
        setOpenConfirmDialog(true);
    };

    // const handleConfirmSavePlan = async () => {
    //     setOpenConfirmDialog(false);
    //     setLoading(true);

    //     try {
    //         const planData = {
    //             year,
    //             month,
    //             team_id: teamId,
    //             plan: JSON.stringify(planFields.reduce((acc, field) => ({ ...acc, [field.label]: field.value }), {})),
    //             field_structure: JSON.stringify(planFields),
    //             is_active: true,
    //         };

    //         let planId;
    //         let oldData = null;

    //         if (selectedRecord) {
    //             // Fetch the current plan data before updating
    //             const currentPlan = await selectData('monthly_plans_teams', { id: selectedRecord.id });
    //             oldData = currentPlan.data[0];

    //             // Update the plan
    //             await updateData('monthly_plans_teams', planData, { id: selectedRecord.id });
    //             planId = selectedRecord.id;
    //             toast.success('Plan updated successfully!', {
    //                 style: {
    //                     borderRadius: '8px',
    //                     background: darkMode ? '#333' : '#fff',
    //                     color: darkMode ? '#fff' : '#333',
    //                 },
    //             });
    //         } else {
    //             // Insert a new plan
    //             const insertResponse = await insertData('monthly_plans_teams', planData);
    //             planId = insertResponse.data.id;
    //             toast.success('Plan saved successfully!', {
    //                 style: {
    //                     borderRadius: '8px',
    //                     background: darkMode ? '#333' : '#fff',
    //                     color: darkMode ? '#fff' : '#333',
    //                 },
    //             });
    //         }

    //         // Insert a history record for the update
    //         if (selectedRecord) {
    //             await insertData('monthly_plans_teams_history', {
    //                 record_id: planId,
    //                 old_data: JSON.stringify(oldData),
    //                 action: 'updated',
    //                 new_data: JSON.stringify(planData),
    //                 action_date: new Date().toISOString(),
    //                 team_id: teamId,
    //             });
    //         }

    //         // Save member participation data
    //         for (const [memberId, percentage] of Object.entries(participation)) {
    //             await insertData('TeamMemberParticipation', {
    //                 plan_id: planId,
    //                 plan_name: planFields.find((field) => field.label === 'Plan Name')?.value || 'Untitled Plan',
    //                 member_email: memberId,
    //                 participation_percentage: percentage,
    //                 month,
    //                 year,
    //             });
    //         }

    //         // Refresh the existing records
    //         const updatedRecords = await selectData('monthly_plans_teams', { team_id: teamId, month: month, year: year, is_active: true });
    //         setExistingRecords(updatedRecords.data);
    //     } catch (error) {
    //         console.error('Error in handleConfirmSavePlan:', error);
    //         toast.error('Failed to save plan. Please check the console for details.', {
    //             style: {
    //                 borderRadius: '8px',
    //                 background: darkMode ? '#333' : '#fff',
    //                 color: darkMode ? '#fff' : '#333',
    //             },
    //         });
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    const handleConfirmSavePlan = async () => {
        setOpenConfirmDialog(false);
        setLoading(true);
    
        try {
            const planData = {
                year,
                month,
                team_id: teamId,
                plan: JSON.stringify(planFields.reduce((acc, field) => ({ ...acc, [field.label]: field.value }), {})),
                field_structure: JSON.stringify(planFields),
                is_active: true,
            };
    
            let planId;
            let oldData = null;
    
            if (selectedRecord) {
                // Fetch the current plan data before updating
                const currentPlan = await selectData('monthly_plans_teams', { id: selectedRecord.id });
                oldData = currentPlan.data[0];
    
                // Update the plan
                await updateData('monthly_plans_teams', planData, { id: selectedRecord.id });
                planId = selectedRecord.id;
                toast.success('Plan updated successfully!', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            } else {
                // Insert a new plan
                const insertResponse = await insertData('monthly_plans_teams', planData);
    
                // Check if insertResponse is valid and has the expected structure
                if (!insertResponse || !insertResponse.id) {
                    throw new Error('Invalid response from insertData');
                }
    
                planId = insertResponse.id; // Access the id directly from the response
                toast.success('Plan saved successfully!', {
                    style: {
                        borderRadius: '8px',
                        background: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333',
                    },
                });
            }
    
            // Insert a history record for the update
            if (selectedRecord) {
                await insertData('monthly_plans_teams_history', {
                    record_id: planId,
                    old_data: JSON.stringify(oldData),
                    action: 'updated',
                    new_data: JSON.stringify(planData),
                    action_date: new Date().toISOString(),
                    team_id: teamId,
                });
            }
    
            // Save member participation data
            for (const [memberId, percentage] of Object.entries(participation)) {
                await insertData('TeamMemberParticipation', {
                    plan_id: planId,
                    plan_name: planFields.find((field) => field.label === 'Plan Name')?.value || 'Untitled Plan',
                    member_email: memberId,
                    participation_percentage: percentage,
                    month,
                    year,
                });
            }
    
            // Refresh the existing records
            const updatedRecords = await selectData('monthly_plans_teams', { team_id: teamId, month: month, year: year, is_active: true });
            setExistingRecords(updatedRecords.data);
        } catch (error) {
            console.error('Error in handleConfirmSavePlan:', error);
            toast.error('Failed to save plan. Please check the console for details.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecord = async (recordId) => {
        setConfirmationAction('delete');
        setSelectedRecord({ id: recordId });
        setOpenConfirmDialog(true);
    };

    const handleConfirmDeleteRecord = async () => {
        setOpenConfirmDialog(false);
        setLoading(true);

        try {
            // Fetch the current plan data before marking it as inactive
            const currentPlan = await selectData('monthly_plans_teams', { id: selectedRecord.id });
            const oldData = currentPlan.data[0];

            // Mark the plan as inactive
            await updateData('monthly_plans_teams', { is_active: false }, { id: selectedRecord.id });

            // Insert a history record for the deletion
            await insertData('monthly_plans_teams_history', {
                record_id: selectedRecord.id,
                old_data: JSON.stringify(oldData),
                action: 'deleted',
                new_data: null, // No new data for deletion
                action_date: new Date().toISOString(),
                team_id: teamId,
            });

            toast.success('Record marked as inactive and history saved successfully!', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });

            // Refresh the existing records
            const updatedRecords = await selectData('monthly_plans_teams', { team_id: teamId, month: month, year: year, is_active: true });
            setExistingRecords(updatedRecords.data);
        } catch (error) {
            console.error('Error marking record as inactive:', error);
            toast.error('Failed to mark record as inactive.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNewRecord = () => {
        setPlanFields([{ type: 'Text', label: 'Plan Name', value: '', editable: false }]);
        setSelectedRecord(null);
    };

    const fetchHistoryRecords = async () => {
        try {
            const historyRecords = await selectData('monthly_plans_teams_history', { team_id: teamId });
            setHistoryRecords(historyRecords.data);
        } catch (error) {
            console.error('Error fetching history records:', error);
            toast.error('Failed to fetch history records.', {
                style: {
                    borderRadius: '8px',
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                },
            });
        }
    };
    const handleRemoveField = (index) => {
        setFieldToRemove(index); // Store the index of the field to remove
        setOpenRemoveFieldDialog(true); // Open the confirmation dialog
    };

    const confirmRemoveField = () => {
        if (fieldToRemove !== null) {
            const updatedFields = [...planFields];
            updatedFields.splice(fieldToRemove, 1); // Remove the field at the specified index
            setPlanFields(updatedFields);
            setFieldToRemove(null); // Reset the field to remove
        }
        setOpenRemoveFieldDialog(false); // Close the confirmation dialog
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
    const handlePrev = () => {
        if (currentPlanIndex > 0) {
            setCurrentPlanIndex(currentPlanIndex - 1);
        }
    };
    return (
        <Box sx={{ display: 'flex', gap: 4, padding: 4 }}>
            <Button
                variant="outlined"
                onClick={() => { setOpenHistoryDialog(true); fetchHistoryRecords(); }}
                sx={{ position: 'absolute', top: 16, left: 16 }}
            >
                View History
            </Button>

            <Box sx={{ flex: 2,backgroundColor: theme.palette.background.paper,p:3,borderRadius:5 }}>
                <Paper sx={{ padding: 3, backgroundColor: theme.palette.background.paper, boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Create Monthly Plan
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
                        </Box>
                    </Box>

                    {planFields.map((field, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                label="Field Label"
                                value={field.label}
                                onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                size="small"
                                disabled={!field.editable}
                            />
                            {field.type === 'Text' && (
                                <TextField
                                    fullWidth
                                    label="Text Value"
                                    value={field.value}
                                    onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                                    size="small"
                                />
                            )}
                            {field.type === 'Number' && (
                                <TextField
                                    fullWidth
                                    label="Number Value"
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                                    size="small"
                                />
                            )}
                            {field.type === 'Text Box' && (
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={field.value}
                                    onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                                    size="small"
                                />
                            )}
                            {/* Add a delete button */}
                            <IconButton
                                onClick={() => handleRemoveField(index)}
                                sx={{ color: theme.palette.error.main }}
                            >
                                <Delete />
                            </IconButton>
                        </Box>
                    ))}

                    <Button variant="outlined" startIcon={<Add />} onClick={handleAddFieldClick} sx={{ mb: 3 }}>
                        Add Field
                    </Button>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined" onClick={handleNewRecord}>
                            New Record
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSavePlan}
                            disabled={loading}
                            sx={{ width: '15%' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save'}
                        </Button>
                    </Box>
                </Paper>

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
                                            borderRadius:2,
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
                                        <CardActions>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRecord(record.id);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <IconButton onClick={handleNext} disabled={currentPlanIndex + 3 >= existingRecords.length}>
                            <RightArrowIcon />
                        </IconButton>
                    </Box>
                </Box>
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
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                    backgroundColor: theme.palette.background.default,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                    },
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
                                        onChange={(e, value) => handleParticipationChange(member.id, value)}
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

            <Dialog open={openAddFieldDialog} onClose={() => setOpenAddFieldDialog(false)}>
                <DialogTitle>Select Field Type</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            variant={newFieldType === 'Text' ? 'contained' : 'outlined'}
                            onClick={() => setNewFieldType('Text')}
                            sx={{ textTransform: 'none' }}
                        >
                            Text
                        </Button>
                        <Button
                            variant={newFieldType === 'Number' ? 'contained' : 'outlined'}
                            onClick={() => setNewFieldType('Number')}
                            sx={{ textTransform: 'none' }}
                        >
                            Number
                        </Button>
                        <Button
                            variant={newFieldType === 'Text Box' ? 'contained' : 'outlined'}
                            onClick={() => setNewFieldType('Text Box')}
                            sx={{ textTransform: 'none' }}
                        >
                            Text Box
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddFieldDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddFieldConfirm} variant="contained" color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>You want to save this records.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (confirmationAction === 'save') {
                                handleConfirmSavePlan();
                            } else if (confirmationAction === 'delete') {
                                handleConfirmDeleteRecord();
                            }
                            setOpenConfirmDialog(false);
                        }}
                        variant="contained"
                        color="primary"
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)}>
                <DialogTitle>History Records</DialogTitle>
                <DialogContent>
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Record ID</TableCell>
                                        <TableCell>Action Date</TableCell>
                                        <TableCell>Old Data</TableCell>
                                        <TableCell>New Data</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historyRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{record.action}</TableCell>
                                            <TableCell>{record.record_id}</TableCell>
                                            <TableCell>{new Date(record.action_date).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleViewJson(JSON.parse(record.old_data))}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                {record.new_data ? (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleViewJson(JSON.parse(record.new_data))}
                                                    >
                                                        View
                                                    </Button>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <JsonViewPopup
                open={openJsonPopup}
                onClose={handleCloseJsonPopup}
                data={jsonData}
            />

            <ConfirmationDialog
                open={openRemoveFieldDialog}
                onClose={() => setOpenRemoveFieldDialog(false)}
                onConfirm={confirmRemoveField}
                title="Are you sure?"
                message="This action cannot be undone. Are you sure you want to remove this field?"
            />
        </Box>
    );
};

export default PlanPage;