import React, { useState, useEffect } from "react";
import {
    Box,
    Tabs,
    Tab,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Checkbox,
} from "@mui/material";
import {
    Add,
    MeetingRoom,
    Schedule,
    ArrowBack,
    Business,
    Groups,
    Work,
    Event,
} from "@mui/icons-material";
import { selectData, insertData, updateData } from "../../services/dataService";
import { getUserDetails } from '../../services/userService';

const VisitorAdmit = () => {
    const [tabValue, setTabValue] = useState(0);
    const [openManualModal, setOpenManualModal] = useState(false);
    const [step, setStep] = useState(0);
    const [selectedInvitation, setSelectedInvitation] = useState(null);
    const [externalParticipants, setExternalParticipants] = useState([]);
    const [existingParticipants, setExistingParticipants] = useState([]);
    const [openParticipantForm, setOpenParticipantForm] = useState(false);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [approvedParticipants, setApprovedParticipants] = useState([]);
    const [isPolling, setIsPolling] = useState(false);
    const [showCancelWarning, setShowCancelWarning] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState(null);
    const [selectedMeetingType, setSelectedMeetingType] = useState(null);
    const [selectedParticipants, setSelectedParticipants] = useState([]); // Track selected participants

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        const fetchInvitations = async () => {
            setLoading(true);
            try {
                const today = new Date().toISOString().split("T")[0];

                const responseOngoing = await selectData("invitations", {
                    date: today,
                    status: "ongoing",
                    is_deleted: false,
                });

                const responseUpcoming = await selectData("invitations", {
                    date: today,
                    status: "upcoming",
                    is_deleted: false,
                });

                const combinedInvitations = [
                    ...(responseOngoing?.data || []),
                    ...(responseUpcoming?.data || []),
                ];

                setInvitations(combinedInvitations);
            } catch (error) {
                console.error("Failed to fetch invitations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
    }, []);

    useEffect(() => {
        const fetchExistingParticipants = async () => {
            if (selectedInvitation) {
                setLoading(true);
                try {
                    const response = await selectData("external_participants", {
                        invitation_id: selectedInvitation.id,
                        is_approved: false,
                    });
                    setExistingParticipants(response?.data || []);
                } catch (error) {
                    console.error("Failed to fetch existing participants:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchExistingParticipants();
    }, [selectedInvitation]);

    useEffect(() => {
        if (editingParticipant) {
            setFullName(editingParticipant.full_name || '');
            setEmail(editingParticipant.email || '');
            setPhoneNumber(editingParticipant.phone_number || '');
            setCompanyName(editingParticipant.company_name || '');
        } else {
            setFullName('');
            setEmail('');
            setPhoneNumber('');
            setCompanyName('');
        }
    }, [editingParticipant]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleManualModalOpen = () => {
        setOpenManualModal(true);
        setStep(0);
    };

    const handleCloseModal = () => {
        if (step === 4 || step === 5) {
            alert("This step is sensitive. You cannot close the modal here.");
            return;
        }
        setShowCancelWarning(true);
    };

    const confirmCancel = () => {
        setOpenManualModal(false);
        setStep(0);
        setSelectedInvitation(null);
        setExternalParticipants([]);
        setApprovedParticipants([]);
        setIsPolling(false);
        setShowCancelWarning(false);
        setSelectedParticipants([]); // Reset selected participants
    };

    const handleNextStep = () => {
        setStep((prevStep) => prevStep + 1);
    };

    const handlePreviousStep = () => {
        setStep((prevStep) => prevStep - 1);
    };

    const handleSelectInvitation = (invitation) => {
        setSelectedInvitation(invitation);
    };

    const handleAddParticipant = () => {
        const participant = { full_name: fullName, email, phone_number: phoneNumber, company_name: companyName };
        if (editingParticipant) {
            const updatedParticipants = externalParticipants.map((p) =>
                p.email === editingParticipant.email ? { ...p, ...participant } : p
            );
            setExternalParticipants(updatedParticipants);
            setEditingParticipant(null);
        } else {
            setExternalParticipants([...externalParticipants, participant]);
        }
        setOpenParticipantForm(false);
        setFullName('');
        setEmail('');
        setPhoneNumber('');
        setCompanyName('');
    };

    const handleEditParticipant = (participant) => {
        setEditingParticipant(participant);
        setOpenParticipantForm(true);
    };

    const handleSelectParticipant = (participant) => {
        const isSelected = selectedParticipants.some((p) => p.email === participant.email);
        if (isSelected) {
            setSelectedParticipants(selectedParticipants.filter((p) => p.email !== participant.email));
        } else {
            setSelectedParticipants([...selectedParticipants, participant]);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (timeString) => {
        if (!timeString || typeof timeString !== "string") {
            return "Invalid Time";
        }

        const [hours, minutes] = timeString.split(":");
        const formattedTime = new Date(0, 0, 0, hours, minutes).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });

        return formattedTime;
    };
    const pollForApproval = async (participantIds) => {
        console.log("🔄 Starting polling for approval. Participant IDs:", participantIds);
        setIsPolling(true);
        setStep(4); // Ensure the UI reflects the "Waiting for approval" state.
    
        const maxRetries = 12; // Retry for 60 seconds (12 retries x 5 seconds).
        let retryCount = 0;
    
        const interval = setInterval(async () => {
            try {
                console.log(`🕒 Polling attempt ${retryCount + 1}/${maxRetries}`);
                
                // Fetch all participants with the given IDs in a single batch request.
                const response = await selectData("external_participants", { id: participantIds });
                const participants = response?.data || [];
    
                console.log("🔎 Server response:", participants);
    
                // Check for approved participants.
                const approved = participants.filter(p => p.is_approved === 1);
    
                if (approved.length === participantIds.length) {
                    console.log("✅ All participants approved!", approved);
                    clearInterval(interval); // Stop polling.
                    setApprovedParticipants(approved); // Save approved participants.
                    setIsPolling(false);
                    setStep(5); // Move to step 5.
                } else {
                    console.log(`⏳ Waiting... Approved: ${approved.length}/${participantIds.length}`);
                }
    
                // Stop polling if maximum retries are reached.
                if (++retryCount >= maxRetries) {
                    console.warn("⏰ Approval process timed out. Please check manually.");
                    clearInterval(interval); // Stop polling.
                    setIsPolling(false);
                    alert("Approval process timed out. Please try again.");
                }
            } catch (error) {
                console.error("❌ Polling error:", error);
                clearInterval(interval); // Stop polling on error.
                setIsPolling(false);
            }
        }, 5000); // Poll every 5 seconds.
    };
    
    
    const handleRequestApproval = async (participants) => {
        try {
            console.log("🚀 Starting approval process for participants:", participants);
    
            // Fetch user details for `company_id`.
            const userDetails = await getUserDetails();
            console.log("🆔 User Details:", userDetails);
    
            const participantIds = []; // To collect participant IDs for polling.
    
            for (const participant of participants) {
                if (participant.id) {
                    console.log(`🔄 Updating participant: ${participant.full_name} (ID: ${participant.id})`);
    
                    try {
                        // Update participant with the status "admit".
                        await updateData("external_participants", { visitor_status: "admit" }, { id: participant.id });
                        participantIds.push(participant.id); // Add ID to the list.
                    } catch (error) {
                        console.error(`❌ Failed to update participant ${participant.full_name}:`, error);
                    }
                } else {
                    console.log(`➕ Inserting new participant: ${participant.full_name}`);
    
                    try {
                        // Insert new participant into the database.
                        const response = await insertData("external_participants", {
                            ...participant,
                            invitation_id: selectedInvitation?.id, // Link to the invitation.
                            company_id: userDetails.company_id,   // Link to the company.
                            visitor_status: "admit",             // Default status.
                            is_approved: 0,                      // Initially not approved.
                        });
    
                        if (response?.id) {
                            console.log(`✅ Successfully inserted participant: ${participant.full_name} (ID: ${response.id})`);
                            participantIds.push(response.id); // Add ID to the list.
                        } else {
                            console.error(`❌ Failed to insert participant: ${participant.full_name}`);
                        }
                    } catch (error) {
                        console.error(`❌ Insert error for participant ${participant.full_name}:`, error);
                    }
                }
            }
    
            if (participantIds.length > 0) {
                console.log("📡 Starting polling for participant approvals:", participantIds);
                await pollForApproval(participantIds);
            } else {
                console.error("⚠️ No participant IDs found for polling. Approval process cannot proceed.");
            }
        } catch (error) {
            console.error("❌ Failed to request approval:", error);
        }
    };
    
    

    const handleSubmit = async () => {
        try {
            const participantsToProcess = [
                ...existingParticipants.filter((p) =>
                    selectedParticipants.some((selected) => selected.email === p.email)
                ),
                ...externalParticipants.filter((p) =>
                    selectedParticipants.some((selected) => selected.email === p.email)
                ),
            ];

            await handleRequestApproval(participantsToProcess);

            handleNextStep();
            console.log("Selected participants updated and added successfully!");
        } catch (error) {
            console.error("Failed to update or add participants:", error);
        }
    };

    const filteredInvitations = selectedMeetingType
        ? invitations.filter((invitation) => invitation.type === selectedMeetingType)
        : invitations;

    return (
        <Box sx={{ padding: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Manual" />
                <Tab label="With ID" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
                {tabValue === 0 && (
                    <Button variant="contained" startIcon={<Add />} onClick={handleManualModalOpen}>
                        Add Visitor
                    </Button>
                )}
                {tabValue === 1 && (
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        This feature is coming in the next update. Please wait for it!
                    </Typography>
                )}
            </Box>

            <Dialog
                open={openManualModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                disableBackdropClick
                disableEscapeKeyDown
            >
                <DialogTitle>
                    <Typography variant="h6">Admit Visitor - Manual Process</Typography>
                </DialogTitle>
                <DialogContent>
                    {step === 0 && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <MeetingRoom sx={{ fontSize: 60, color: "primary.main" }} />
                            <Typography variant="h4" sx={{ mt: 2 }}>
                                Welcome!
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                We are glad to have you here.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Schedule />}
                                onClick={handleNextStep}
                                sx={{ mt: 3 }}
                            >
                                Start
                            </Button>
                        </Box>
                    )}

                    {step === 1 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Select Meeting Type
                            </Typography>
                            <Grid container spacing={2}>
                                {[
                                    { type: "meeting", icon: <Groups sx={{ fontSize: 40, color: "primary.main" }} /> },
                                    { type: "session", icon: <Event sx={{ fontSize: 40, color: "primary.main" }} /> },
                                    { type: "interview", icon: <Work sx={{ fontSize: 40, color: "primary.main" }} /> },
                                    { type: "service", icon: <Business sx={{ fontSize: 40, color: "primary.main" }} /> },
                                ].map((item, index) => (
                                    <Grid item xs={6} sm={3} key={index}>
                                        <Card
                                            onClick={() => {
                                                setSelectedMeetingType(item.type);
                                                handleNextStep();
                                            }}
                                            sx={{
                                                cursor: "pointer",
                                                textAlign: "center",
                                                p: 2,
                                                "&:hover": { backgroundColor: "action.hover" },
                                            }}
                                        >
                                            {item.icon}
                                            <Typography variant="h6" sx={{ mt: 1 }}>
                                                {item.type}
                                            </Typography>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {step === 2 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Select Invitation
                            </Typography>
                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <Box sx={{ maxHeight: "300px", overflowY: "auto", mb: 2, p: 10 }}>
                                    <Grid container spacing={2}>
                                        {filteredInvitations.map((invitation) => (
                                            <Grid item xs={12} sm={6} key={invitation.id}>
                                                <Card
                                                    onClick={() => handleSelectInvitation(invitation)}
                                                    sx={{
                                                        cursor: "pointer",
                                                        p: 2,
                                                        backgroundColor:
                                                            selectedInvitation?.id === invitation.id ? "action.selected" : "background.paper",
                                                    }}
                                                >
                                                    <Typography variant="h6">{invitation.name}</Typography>
                                                    <Typography variant="body2">
                                                        {formatDate(invitation.date)} - {formatTime(invitation.start_time)} to{" "}
                                                        {formatTime(invitation.end_time)}
                                                    </Typography>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleNextStep}
                                disabled={!selectedInvitation}
                                sx={{ mt: 2 }}
                            >
                                Next
                            </Button>
                        </Box>
                    )}

                    {step === 3 && (
                        <Box>
                            <Box sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Selected Invitation Details
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Name:</strong> {selectedInvitation?.name}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Date:</strong> {formatDate(selectedInvitation?.date)}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Time:</strong> {formatTime(selectedInvitation?.start_time)} to{" "}
                                    {formatTime(selectedInvitation?.end_time)}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Type:</strong> {selectedInvitation?.type}
                                </Typography>
                            </Box>

                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Add External Participants
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => setOpenParticipantForm(true)}
                                >
                                    Add Participant
                                </Button>
                            </Box>

                            {(existingParticipants.length > 0 || externalParticipants.length > 0) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Already Added Participants
                                    </Typography>
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Select</TableCell>
                                                    <TableCell>Full Name</TableCell>
                                                    <TableCell>Email</TableCell>
                                                    <TableCell>Phone Number</TableCell>
                                                    <TableCell>Company Name</TableCell>
                                                    <TableCell>Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {existingParticipants.map((participant, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedParticipants.some((p) => p.email === participant.email)}
                                                                onChange={() => handleSelectParticipant(participant)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{participant.full_name}</TableCell>
                                                        <TableCell>{participant.email}</TableCell>
                                                        <TableCell>{participant.phone_number}</TableCell>
                                                        <TableCell>{participant.company_name}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outlined"
                                                                onClick={() => handleEditParticipant(participant)}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {externalParticipants.map((participant, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedParticipants.some((p) => p.email === participant.email)}
                                                                onChange={() => handleSelectParticipant(participant)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{participant.full_name}</TableCell>
                                                        <TableCell>{participant.email}</TableCell>
                                                        <TableCell>{participant.phone_number}</TableCell>
                                                        <TableCell>{participant.company_name}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="outlined"
                                                                onClick={() => handleEditParticipant(participant)}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}

                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                sx={{ mt: 2 }}
                                disabled={selectedParticipants.length === 0}
                            >
                                Submit
                            </Button>
                        </Box>
                    )}

                    {step === 4 && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Waiting for approval...
                            </Typography>
                            <Typography variant="body1">
                                Please wait while we process your request.
                            </Typography>
                        </Box>
                    )}

                    {step === 5 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Approved Participants
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Full Name</TableCell>
                                            <TableCell>Pass ID</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {approvedParticipants.map((participant, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{participant.full_name}</TableCell>
                                                <TableCell>{participant.pass_id}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ mt: 3, textAlign: "center" }}>
                                <Button
                                    variant="contained"
                                    onClick={() => setStep(6)}
                                >
                                    Finish
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {step === 6 && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <Box
                                sx={{
                                    fontSize: 60,
                                    color: "primary.main",
                                    animation: "wave 1s infinite",
                                    "@keyframes wave": {
                                        "0%": { transform: "rotate(0deg)" },
                                        "25%": { transform: "rotate(10deg)" },
                                        "50%": { transform: "rotate(0deg)" },
                                        "75%": { transform: "rotate(-10deg)" },
                                        "100%": { transform: "rotate(0deg)" },
                                    },
                                }}
                            >
                                🤝
                            </Box>

                            <Typography variant="h4" sx={{ mt: 2 }}>
                                Thank You!
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                Thank you for using the VMS system. We look forward to seeing you again!
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {step > 0 && step < 4 && (
                        <Button startIcon={<ArrowBack />} onClick={handlePreviousStep}>
                            Back
                        </Button>
                    )}
                    {step !== 4 && step !== 5 && (
                        <Button onClick={handleCloseModal}>Cancel</Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={showCancelWarning} onClose={() => setShowCancelWarning(false)}>
                <DialogTitle>Cancel Process</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to cancel the process? All unsaved changes will be lost.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCancelWarning(false)}>No</Button>
                    <Button onClick={confirmCancel} color="error">Yes, Cancel</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openParticipantForm} onClose={() => setOpenParticipantForm(false)}>
                <DialogTitle>{editingParticipant ? 'Edit Participant' : 'Add External Participant'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Phone Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Company Name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenParticipantForm(false)}>Cancel</Button>
                    <Button onClick={handleAddParticipant} variant="contained" color="primary">
                        {editingParticipant ? 'Save' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VisitorAdmit;