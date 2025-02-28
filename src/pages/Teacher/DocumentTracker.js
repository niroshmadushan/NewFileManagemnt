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
  useTheme,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Autocomplete,
} from '@mui/material';
import { Folder, Add, Search, InsertDriveFile, Warning, Person, Description, AdminPanelSettings, PersonOutline } from '@mui/icons-material';
import { selectData, insertData, updateData, selectDataProfiles } from '../../services/dataService';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../../services/fileservice';
import { getUserDetails } from '../../services/userService';
import { Editor } from '@tinymce/tinymce-react'; // Import TinyMCE editor

const DocumentTracker = () => {
  const theme = useTheme();
  const [documentTrackers, setDocumentTrackers] = useState([]);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [newTrackerName, setNewTrackerName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [trackerRecords, setTrackerRecords] = useState([]);
  const [newFileDescription, setNewFileDescription] = useState('');
  const [companyId, setCompanyId] = useState(null);
  const [uid, setUid] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateTrackerPopupOpen, setIsCreateTrackerPopupOpen] = useState(false);
  const [isAddTaskPopupOpen, setIsAddTaskPopupOpen] = useState(false);
  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [isRenameTrackerPopupOpen, setIsRenameTrackerPopupOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const apiUrl = process.env.REACT_APP_MAIN_API; // ✅ Correct
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDetails = await getUserDetails();
        setCompanyId(userDetails.company_id);
        setUid(userDetails.id);
        setUserDetails(userDetails);
        const usersData = await selectDataProfiles({ company_id: userDetails.company_id });
        setParticipants(usersData.data);
        setUsers(usersData.data);
        const trackersData = await selectData('document_trackers', { user_id: userDetails.id });
        setDocumentTrackers(trackersData.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  const handleCreateTracker = async () => {
    if (newTrackerName.trim() === '' || !selectedParticipant) {
      toast.error('Please enter a name for the tracker and select a participant');
      return;
    }

    try {
      await insertData('document_trackers', {
        name: newTrackerName,
        participant_id: selectedParticipant.id,
        user_id: userDetails.id,
      });
      setNewTrackerName('');
      setSelectedParticipant(null);
      setIsCreateTrackerPopupOpen(false);
      const trackersData = await selectData('document_trackers', { user_id: userDetails.id });
      setDocumentTrackers(trackersData.data);
      toast.success('Document tracker created successfully');
    } catch (error) {
      console.error('Failed to create document tracker:', error);
      toast.error('Failed to create document tracker');
    }
  };

  const handleRenameTracker = async () => {
    if (newTrackerName.trim() === '') {
      toast.error('Please enter a new name for the tracker');
      return;
    }

    try {
      await updateData('document_trackers', { name: newTrackerName }, { id: selectedTracker.id });
      setNewTrackerName('');
      setIsRenameTrackerPopupOpen(false);
      const userDetails = await getUserDetails();
      setCompanyId(userDetails.company_id);
      setUid(userDetails.id);
      setUserDetails(userDetails);
      const usersData = await selectDataProfiles({ company_id: userDetails.company_id });
      setParticipants(usersData.data);
      setUsers(usersData.data);
      const trackersData = await selectData('document_trackers', { user_id: userDetails.id });
      setDocumentTrackers(trackersData.data);
      toast.success('Document tracker renamed successfully');
    } catch (error) {
      console.error('Failed to rename document tracker:', error);
      toast.error('Failed to rename document tracker');
    }
  };

  const handleSelectTracker = async (tracker) => {
    setSelectedTracker(tracker);
    try {
      const recordsData = await selectData('document_tracker_records', { document_tracker_id: tracker.id });
      setTrackerRecords(recordsData.data);
    } catch (error) {
      console.error('Failed to fetch tracker records:', error);
      toast.error('Failed to fetch tracker records');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddTaskSubmit = () => {
    if (!selectedFile || newFileDescription.trim() === '') {
      toast.error('Please select a file and enter a description');
      return;
    }
    setIsConfirmPopupOpen(true);
  };

  const handleConfirmUpload = async () => {
    if (selectedFile && selectedTracker) {
      try {
        const fileLink = await uploadFile(selectedFile, userDetails.id, selectedTracker.id);
        await insertData('document_tracker_records', {
          document_tracker_id: selectedTracker.id,
          file_id: fileLink.file_id,
          file_link: fileLink.file_link,
          description: newFileDescription,
          user_id: userDetails.id,
          created_at: new Date().toISOString(),
        });
        toast.success('File uploaded successfully');
        const recordsData = await selectData('document_tracker_records', { document_tracker_id: selectedTracker.id });
        setTrackerRecords(recordsData.data);
        setNewFileDescription('');
        setSelectedFile(null);
        setIsAddTaskPopupOpen(false);
        setIsConfirmPopupOpen(false);
      } catch (error) {
        console.error('Failed to upload file:', error);
        toast.error('Failed to upload file');
      }
    }
  };

  const filteredTrackers = documentTrackers.filter(tracker =>
    tracker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participants.find(participant => participant.id === tracker.participant_id)?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileNameFromLink = (link) => {
    const parts = link.split('\\uploads\\');
    return parts.length > 1 ? parts[1] : link.split('/').pop();
  };

  const getUserNameById = (userId) => {
    const user = users.find(user => user.id === userId);
    return user ? user.full_name : 'Unknown User';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

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
        Document Flow
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
            label="Search Flows"
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateTrackerPopupOpen(true)}
            sx={{ width: '100%', marginBottom: 2 }}
          >
            Create New Flow
          </Button>

          {/* Popup for Creating New Tracker */}
          <Dialog open={isCreateTrackerPopupOpen} onClose={() => setIsCreateTrackerPopupOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Flow</DialogTitle>
            <DialogContent>
              <TextField
                label="Flow Name"
                value={newTrackerName}
                onChange={(e) => setNewTrackerName(e.target.value)}
                fullWidth
                sx={{ marginBottom: 2, mt: 2 }}
              />
              <Autocomplete
                options={participants}
                getOptionLabel={(option) => `${option.full_name} (${option.email})`}
                value={selectedParticipant}
                onChange={(event, newValue) => setSelectedParticipant(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Participant"
                    fullWidth
                    sx={{ marginBottom: 2 }}
                  />
                )}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsCreateTrackerPopupOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTracker} variant="contained">Create</Button>
            </DialogActions>
          </Dialog>

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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description />
                  {selectedTracker.name} - {participants.find(participant => participant.id === selectedTracker.participant_id)?.full_name}
                </Typography>
                <Box>
                  <Button variant="contained" startIcon={<Add />} onClick={() => setIsAddTaskPopupOpen(true)} sx={{ marginRight: 1 }}>
                    Add Task
                  </Button>
                  <Button variant="outlined" onClick={() => setIsRenameTrackerPopupOpen(true)}>
                    Rename
                  </Button>
                </Box>
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
                    <Card sx={{
                      boxShadow: 'none',
                      borderRadius: '8px',
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                          <Avatar sx={{ bgcolor: record.user_id === uid ? theme.palette.primary.main : theme.palette.secondary.main }}>
                            {record.user_id === uid ? <AdminPanelSettings /> : <Person />}
                          </Avatar>
                          <Typography variant="h6">
                            {getUserNameById(record.user_id)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: record.description }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 2 }}>
                          <InsertDriveFile />
                          <Typography variant="body2">
                            {getFileNameFromLink(record.file_link)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', marginTop: 1 }}>
                          Created at: {formatTimestamp(record.created_at)}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button onClick={() => window.open(`${apiUrl}:3000/uploads/` + getFileNameFromLink(record.file_link), '_blank')}>View</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Popup for Adding Task */}
      <Dialog open={isAddTaskPopupOpen} onClose={() => setIsAddTaskPopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button variant="contained" component="span" startIcon={<Add />} sx={{ marginBottom: 2 }}>
              Select File
            </Button>
          </label>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
            <Typography variant="body2">{selectedFile ? selectedFile.name : 'No file selected'}</Typography>
          </Box>
          <Editor
            apiKey="pu258hbqcxkxv0lgzxelam5vmcax1y7m1oir2w0ougjnc5di"
            value={newFileDescription}
            onEditorChange={(content) => setNewFileDescription(content)}
            init={{
              height: 300,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar:
                'undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | help'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddTaskPopupOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTaskSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Popup for Renaming Tracker */}
      <Dialog open={isRenameTrackerPopupOpen} onClose={() => setIsRenameTrackerPopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Flows</DialogTitle>
        <DialogContent>
          <TextField
            label="New Tracker Name"
            value={newTrackerName}
            onChange={(e) => setNewTrackerName(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRenameTrackerPopupOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameTracker} variant="contained">Rename</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Popup */}
      <Dialog open={isConfirmPopupOpen} onClose={() => setIsConfirmPopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: 'warning.main' }} />
            <Typography variant="h6">Are you sure?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>Do you want to upload this file and description?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmPopupOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmUpload} variant="contained">Yes, Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentTracker;