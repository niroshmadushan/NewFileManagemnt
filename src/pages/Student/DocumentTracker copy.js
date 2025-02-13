import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Avatar,
} from '@mui/material';
import { Folder, Add, InsertDriveFile, Close, Edit, PictureAsPdf, Article, FolderZip, Description, TableChart, Slideshow, Search } from '@mui/icons-material';
import { selectData, insertData, updateData,selectDataProfiles } from '../../services/dataService';
import { toast } from 'react-hot-toast';
import { uploadFile, downloadFile } from '../../services/fileservice';
import { getUserDetails  } from '../../services/userService';

const DocumentTracker = () => {
  const theme = useTheme();
  const [documentTrackers, setDocumentTrackers] = useState([]);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [newTrackerName, setNewTrackerName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [trackerRecords, setTrackerRecords] = useState([]);
  const [fileUploadPopupOpen, setFileUploadPopupOpen] = useState(false);
  const [newFileDescription, setNewFileDescription] = useState('');
  const [companyId, setCompanyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const userDetails = await getUserDetails();
      setCompanyId(userDetails.company_id);
      const usersData = await selectDataProfiles({ company_id: userDetails.company_id });
      setParticipants(usersData.data);
      const trackersData = await selectData('document_trackers', { company_id: userDetails.company_id });
      setDocumentTrackers(trackersData.data);
    };

    fetchData();
  }, []);

  const handleCreateTracker = async () => {
    if (newTrackerName.trim() === '' || !selectedParticipant) {
      toast.error('Please enter a name for the tracker and select a participant');
      return;
    }

    try {
      await insertData('document_trackers', { name: newTrackerName, participant_id: selectedParticipant.id, company_id: companyId });
      setNewTrackerName('');
      setSelectedParticipant(null);
      const trackersData = await selectData('document_trackers', { company_id: companyId });
      setDocumentTrackers(trackersData.data);
      toast.success('Document tracker created successfully');
    } catch (error) {
      console.error('Failed to create document tracker:', error);
      toast.error('Failed to create document tracker');
    }
  };

  const handleSelectTracker = async (tracker) => {
    setSelectedTracker(tracker);
    const recordsData = await selectData('document_tracker_records', { document_tracker_id: tracker.id });
    setTrackerRecords(recordsData.data);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && selectedTracker) {
      try {
        const userDetails = await getUserDetails();
        const fileLink = await uploadFile(file, userDetails.id, selectedTracker.id);
        await insertData('document_tracker_records', {
          document_tracker_id: selectedTracker.id,
          file_link: fileLink,
          description: newFileDescription,
        });
        toast.success('File uploaded successfully');
        const recordsData = await selectData('document_tracker_records', { document_tracker_id: selectedTracker.id });
        setTrackerRecords(recordsData.data);
        setNewFileDescription('');
      } catch (error) {
        console.error('Failed to upload file:', error);
        toast.error('Failed to upload file');
      }
    }
  };

  const filteredTrackers = documentTrackers.filter(tracker =>
    tracker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participants.find(participant => participant.id === tracker.participant_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{
      padding: 2,
      width: '100%',
      height: 'calc(100vh - 75px)',
      backgroundColor: theme.palette.background.default,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2, color: theme.palette.text.primary }}>
        <Folder sx={{ fontSize: 32, color: 'primary.main' }} />
        Document Tracker
      </Typography>

      <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Document Trackers */}
        <Grid item xs={2} sx={{
          borderRight: '1px solid #ccc',
          height: '90%',
          display: 'flex',
          flexDirection: 'column',
          p: 1,
          overflow: 'hidden'
        }}>
          <TextField
            label="Search Trackers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        
          <TextField
            label="New Tracker Name"
            value={newTrackerName}
            onChange={(e) => setNewTrackerName(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            select
            label="Select Participant"
            value={selectedParticipant?.id || ''}
            onChange={(e) => setSelectedParticipant(participants.find(participant => participant.id === e.target.value))}
            fullWidth
            sx={{ marginBottom: 2 }}
            SelectProps={{
              native: true,
            }}
          >
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name} ({participant.email})
              </option>
            ))}
          </TextField>
          <Box sx={{
            padding: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
              borderRadius: '3px'
            }
          }}>
            {filteredTrackers.map((tracker) => (
              <Button
                key={tracker.id}
                variant="outlined"
                startIcon={<Folder />}
                onClick={() => handleSelectTracker(tracker)}
                sx={{ textAlign: 'left', marginBottom: 1 }}
              >
                {tracker.name}
              </Button>
            ))}
          </Box>
        </Grid>

        {/* Right Section - Tracker Details */}
        <Grid item xs={10} sx={{ height: '100%', overflow: 'hidden' }}>
          {selectedTracker && (
            <Box sx={{
              padding: 2,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                {selectedTracker.name} - {participants.find(participant => participant.id === selectedTracker.participant_id)?.name}
              </Typography>
              <Box sx={{ marginBottom: 2 }}>
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload">
                  <Button variant="contained" component="span" startIcon={<Add />}>
                    Upload File
                  </Button>
                </label>
                <TextField
                  label="File Description"
                  value={newFileDescription}
                  onChange={(e) => setNewFileDescription(e.target.value)}
                  fullWidth
                  sx={{ marginLeft: 2 }}
                />
              </Box>
              <Grid container spacing={2} sx={{
                flex: 1,
                p: 1,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                  borderRadius: '3px'
                },
                alignContent: 'flex-start',
                maxHeight: 'calc(100vh - 300px)',
              }}>
                {trackerRecords.map((record) => (
                  <Grid item key={record.id} xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{record.description}</Typography>
                        <Typography variant="body2">{record.file_link}</Typography>
                      </CardContent>
                      <CardActions>
                        <Button onClick={() => window.open(record.file_link, '_blank')}>View</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentTracker;