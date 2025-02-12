import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid } from '@mui/material';

const AddParticipantForm = ({ open, onClose, onAdd, participant }) => {
    const [fullName, setFullName] = useState(participant?.full_name || '');
    const [email, setEmail] = useState(participant?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(participant?.phone_number || '');
    const [companyName, setCompanyName] = useState(participant?.company_name || '');

    // Reset form when participant prop changes (for editing)
    useEffect(() => {
        if (participant) {
            setFullName(participant.full_name || '');
            setEmail(participant.email || '');
            setPhoneNumber(participant.phone_number || '');
            setCompanyName(participant.company_name || '');
        } else {
            setFullName('');
            setEmail('');
            setPhoneNumber('');
            setCompanyName('');
        }
    }, [participant]);

    const handleSubmit = () => {
        onAdd({ full_name: fullName, email, phone_number: phoneNumber, company_name: companyName });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{participant ? 'Edit Participant' : 'Add External Participant'}</DialogTitle>
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
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {participant ? 'Save' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddParticipantForm;