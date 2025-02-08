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
} from '@mui/material';
import { Folder, Add, InsertDriveFile, Close, Edit, PictureAsPdf, Article, FolderZip, Description, TableChart, Slideshow, Search } from '@mui/icons-material';
import { selectData, insertData, updateData } from '../../services/dataService';
import { toast } from 'react-hot-toast';
import { uploadFile, downloadFile } from '../../services/fileservice';
import { getUserDetails } from '../../services/userService'; // Assuming you have a function to get user details

const FileExplorer = () => {
  const theme = useTheme();
  const [mainFolders, setMainFolders] = useState([]);
  const [subFolders, setSubFolders] = useState([]);
  const [selectedMainFolder, setSelectedMainFolder] = useState(null);
  const [selectedSubFolder, setSelectedSubFolder] = useState(null);
  const [newMainFolderName, setNewMainFolderName] = useState('');
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [mainFolderError, setMainFolderError] = useState(false);
  const [subFolderError, setSubFolderError] = useState(false);
  const [fileUploadPopupOpen, setFileUploadPopupOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [renameMainFolderId, setRenameMainFolderId] = useState(null);
  const [renameSubFolderId, setRenameSubFolderId] = useState(null);
  const [renameMainFolderName, setRenameMainFolderName] = useState('');
  const [renameSubFolderName, setRenameSubFolderName] = useState('');
  const [mainFolderSearchTerm, setMainFolderSearchTerm] = useState('');
  const [subFolderSearchTerm, setSubFolderSearchTerm] = useState('');

  useEffect(() => {
    const fetchMainFolders = async () => {
      try {
        const userDetails = await getUserDetails();
        const response = await selectData('main_folders', { userid: userDetails.id });
        setMainFolders(response.data);
      } catch (error) {
        console.error('Failed to fetch main folders:', error);
      }
    };

    fetchMainFolders();
  }, []);

  const handleCreateMainFolder = async () => {
    if (newMainFolderName.trim() === '') {
      setMainFolderError(true);
      toast.error('Please enter a name for the main folder');
    } else {
      const userDetails = await getUserDetails();
      const folderExists = mainFolders.some(folder => folder.name.toLowerCase() === newMainFolderName.toLowerCase());
      if (folderExists) {
        toast.error('A folder with this name already exists');
        return;
      }
      try {
        await insertData('main_folders', { name: newMainFolderName, userid: userDetails.id });
        setNewMainFolderName('');
        setMainFolderError(false);
        const response = await selectData('main_folders', { userid: userDetails.id });
        setMainFolders(response.data);
        toast.success('Main folder created successfully');
      } catch (error) {
        console.error('Failed to create main folder:', error);
        toast.error('Failed to create main folder');
      }
    }
  };
  const handleSelectMainFolder = async (mainFolder) => {
    setSelectedMainFolder(mainFolder);
    try {
      const response = await selectData('sub_folders', { main_folder_id: mainFolder.id });
      setSubFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch sub folders:', error);
    }
  };
  const handleRenameMainFolder = async (folderId, newName) => {
    if (newName.trim() === '') {
      toast.error('Please enter a name for the main folder');
    } else {
      const folderExists = mainFolders.some(folder => folder.name.toLowerCase() === newName.toLowerCase() && folder.id !== folderId);
      if (folderExists) {
        toast.error('A folder with this name already exists');
        return;
      }
      try {
        await updateData('main_folders', { name: newName }, { id: folderId });
        const userDetails = await getUserDetails();
        const response = await selectData('main_folders', { userid: userDetails.id });
        setMainFolders(response.data);
        setRenameMainFolderId(null);
        toast.success('Main folder renamed successfully');
      } catch (error) {
        console.error('Failed to rename main folder:', error);
        toast.error('Failed to rename main folder');
      }
    }
  };

  const handleCreateSubFolder = async () => {
    if (newSubFolderName.trim() === '') {
      setSubFolderError(true);
      toast.error('Please enter a name for the sub folder');
    } else {
      const folderExists = subFolders.some(folder => folder.name.toLowerCase() === newSubFolderName.toLowerCase());
      if (folderExists) {
        toast.error('A folder with this name already exists');
        return;
      }
      try {
        await insertData('sub_folders', { main_folder_id: selectedMainFolder.id, name: newSubFolderName });
        setNewSubFolderName('');
        setSubFolderError(false);
        const response = await selectData('sub_folders', { main_folder_id: selectedMainFolder.id });
        setSubFolders(response.data);
        toast.success('Sub folder created successfully');
      } catch (error) {
        console.error('Failed to create sub folder:', error);
        toast.error('Failed to create sub folder');
      }
    }
  };

  const handleRenameSubFolder = async (folderId, newName) => {
    if (newName.trim() === '') {
      toast.error('Please enter a name for the sub folder');
    } else {
      const folderExists = subFolders.some(folder => folder.name.toLowerCase() === newName.toLowerCase() && folder.id !== folderId);
      if (folderExists) {
        toast.error('A folder with this name already exists');
        return;
      }
      try {
        await updateData('sub_folders', { name: newName }, { id: folderId });
        const response = await selectData('sub_folders', { main_folder_id: selectedMainFolder.id });
        setSubFolders(response.data);
        setRenameSubFolderId(null);
        toast.success('Sub folder renamed successfully');
      } catch (error) {
        console.error('Failed to rename sub folder:', error);
        toast.error('Failed to rename sub folder');
      }
    }
  };


  const handleSelectSubFolder = async (subFolder) => {
    setSelectedSubFolder(subFolder);
    setFileUploadPopupOpen(true);
    try {
      const response = await selectData('files', { folder_id: subFolder.id });
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && selectedSubFolder) {
      try {
        const userDetails = await getUserDetails();
        await uploadFile(file,userDetails.id , selectedSubFolder.id);
        toast.success('File uploaded successfully');
        const response = await selectData('files', { folder_id: selectedSubFolder.id });
        setFiles(response.data);
      } catch (error) {
        console.error('Failed to upload file:', error);
        toast.error('Failed to upload file');
      }
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      await downloadFile(file.id, file.file_name);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PictureAsPdf />;
      case 'xlsx':
      case 'xls':
        return <TableChart />;
      case 'docx':
      case 'doc':
        return <Article />;
      case 'pptx':
      case 'ppt':
        return <Slideshow />;
      case 'zip':
        return <FolderZip />;
      default:
        return <Description />;
    }
  };

  const getRelativeFilePath = (fullPath) => {
    const parts = fullPath.split('uploads');
    return `uploads${parts[1]}`.replace(/\\/g, '/');
  };

  const getFileViewUrl = (relativePath) => {
    return `http://192.168.12.50:3000/${relativePath}`;
  };

  const filteredMainFolders = mainFolders.filter(folder =>
    folder.name.toLowerCase().includes(mainFolderSearchTerm.toLowerCase())
  );

  const filteredSubFolders = subFolders.filter(folder =>
    folder.name.toLowerCase().includes(subFolderSearchTerm.toLowerCase())
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
        File Explorer
      </Typography>

      <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Main Folders Section */}
        <Grid item xs={2} sx={{
          borderRight: '1px solid #ccc',
          height: '90%',
          display: 'flex',
          flexDirection: 'column',
          p: 1,
          overflow: 'hidden'
        }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1 }}>Main Folders</Typography>
          <TextField
            label="Search Main Folders"
            value={mainFolderSearchTerm}
            onChange={(e) => setMainFolderSearchTerm(e.target.value)}
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
            onClick={handleCreateMainFolder}
            sx={{ width: '100%', marginBottom: 2 }}
          >
            Create New Folder
          </Button>
          <TextField
            label="New Folder Name"
            value={newMainFolderName}
            onChange={(e) => setNewMainFolderName(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
            error={mainFolderError}
            helperText={mainFolderError ? 'Please enter a name for the main folder' : ''}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Folder />
                </InputAdornment>
              ),
            }}
          />
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
            {filteredMainFolders.map((mainFolder) => (
              <Box key={mainFolder.id} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                {renameMainFolderId === mainFolder.id ? (
                  <TextField
                    value={renameMainFolderName}
                    onChange={(e) => setRenameMainFolderName(e.target.value)}
                    onBlur={() => handleRenameMainFolder(mainFolder.id, renameMainFolderName)}
                    fullWidth
                    autoFocus
                  />
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Folder />}
                      onClick={() => handleSelectMainFolder(mainFolder)}
                      sx={{ flexGrow: 1, textAlign: 'left' }}
                    >
                      {mainFolder.name}
                    </Button>
                    <IconButton onClick={() => {
                      setRenameMainFolderId(mainFolder.id);
                      setRenameMainFolderName(mainFolder.name);
                    }}>
                      <Edit />
                    </IconButton>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Sub Folders Section */}
        <Grid item xs={10} sx={{ height: '100%', overflow: 'hidden' }}>
          {selectedMainFolder && (
            <Box sx={{
              padding: 2,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 3
              }}>

                <TextField
                  label="Search Sub Folders"
                  value={subFolderSearchTerm}
                  onChange={(e) => setSubFolderSearchTerm(e.target.value)}
                  sx={{ width: 400, marginRight: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2, color: theme.palette.text.primary }}>
                  <Article sx={{ fontSize: 20, color: 'primary.main' }} />
                  Sub Directory
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    label="New Sub Folder Name"
                    value={newSubFolderName}
                    onChange={(e) => setNewSubFolderName(e.target.value)}
                    sx={{ width: 200, marginRight: 2 }}
                    error={subFolderError}
                    helperText={subFolderError ? 'Please enter a name for the sub folder' : ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Folder />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateSubFolder}
                    sx={{ width: 200, height: 40 }}
                  >
                    Create New Sub Folder
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
                maxHeight: 'calc(100vh - 300px)', // Adjust this value as needed
              }}>
                {filteredSubFolders.map((subFolder) => (
                  <Grid item key={subFolder.id} xs={2}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 2,
                      border: '1px solid #ccc',
                      borderRadius: 2,
                      position: 'relative',
                      height: 120
                    }}>
                      <IconButton
                        sx={{ position: 'absolute', top: 5, left: 5 }}
                        onClick={() => {
                          setRenameSubFolderId(subFolder.id);
                          setRenameSubFolderName(subFolder.name);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      {renameSubFolderId === subFolder.id ? (
                        <TextField
                          value={renameSubFolderName}
                          onChange={(e) => setRenameSubFolderName(e.target.value)}
                          onBlur={() => handleRenameSubFolder(subFolder.id, renameSubFolderName)}
                          fullWidth
                          autoFocus
                        />
                      ) : (
                        <>
                          <Folder sx={{ fontSize: 32, color: 'primary.main' }} />
                          <Typography variant="body1" sx={{ marginTop: 1, textAlign: 'center' }}>
                            {subFolder.name}
                          </Typography>
                          <Button
                            onClick={() => handleSelectSubFolder(subFolder)}
                            sx={{ mt: 1 }}
                          >
                            View Files
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* File Upload Popup */}
      <Dialog open={fileUploadPopupOpen} onClose={() => setFileUploadPopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Files in {selectedSubFolder?.name}</Typography>
            <IconButton onClick={() => setFileUploadPopupOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
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
          </Box>
          <List sx={{ maxHeight: 400, overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc', borderRadius: '3px' } }}>
            {files.slice(0, 15).map((file) => {
              const relativePath = getRelativeFilePath(file.file_link);
              const fileUrl = getFileViewUrl(relativePath);
              return (
                <ListItem key={file.id}>
                  <ListItemIcon>
                    {getFileIcon(file.file_name)}
                  </ListItemIcon>
                  <ListItemText primary={file.file_name} />
                  <Button onClick={() => window.open(fileUrl, '_blank')}>View</Button>

                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileUploadPopupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileExplorer;