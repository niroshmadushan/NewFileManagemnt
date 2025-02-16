import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Search, Add, FilePresent, Image as ImageIcon, InsertDriveFile, Delete, Folder, Settings } from "@mui/icons-material";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-hot-toast";
import { selectData, insertData, updateData, selectDataProfiles } from "../../services/dataService";
import { uploadFile } from "../../services/fileservice";
import { ThemeContext } from "../../context/ThemeContext";
import { getUserDetails } from "../../services/userService";
const apiUrl = process.env.REACT_APP_MAIN_API; // ✅ Correct
const DocumentSharingGroupPage = () => {
  const { darkMode } = useContext(ThemeContext);
  const theme = useTheme();
  const [selectedSection, setSelectedSection] = useState("existing"); // Default to "Existing Members"

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [contents, setContents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // States for the add group dialog
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // States for the add content dialog
  const [openContentDialog, setOpenContentDialog] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentDescription, setNewContentDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // States for the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  // States for the group settings dialog
  const [openGroupSettingsDialog, setOpenGroupSettingsDialog] = useState(false);
  const [groupSettingsName, setGroupSettingsName] = useState("");
  const [groupSettingsDescription, setGroupSettingsDescription] = useState("");
  const [existingMembers, setExistingMembers] = useState([]);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    const fetchGroupsAndUsers = async () => {
      try {
        const userDetails = await getUserDetails();
        setCurrentUserId(userDetails.id);
        setCompanyId(userDetails.company_id);

        const usersData = await selectDataProfiles({ company_id: userDetails.company_id });
        setUsers(usersData.data);

        // Fetch group member IDs
        const groupsMemberResponse = await selectData("doc_group_members", { user_id: userDetails.id });
        const groupIds = groupsMemberResponse.data // Extracting IDs

        // Fetch group details for all found group IDs
        let allGroups = [];
        for (const groupId of groupIds) {
          const groupResponse = await selectData("doc_groups", { id: groupId.group_id });
          if (groupResponse.data) {
            allGroups = [...allGroups, ...groupResponse.data];
          }
        }

        setGroups(allGroups);
      } catch (error) {
        console.error("Error fetching groups and users:", error);
        toast.error("Failed to fetch groups and users.");
      }
    };

    fetchGroupsAndUsers();
  }, []);

  useEffect(() => {
    const fetchContents = async () => {
      if (selectedGroup) {
        try {
          const contentsResponse = await selectData("group_content", { group_id: selectedGroup.id, is_deleted: false });
          const contentData = contentsResponse.data;

          // Fetch files for each content
          const contentWithFiles = await Promise.all(contentData.map(async (content) => {
            const filesResponse = await selectData("group_content_files", { content_id: content.id });
            return { ...content, files: filesResponse.data };
          }));

          setContents(contentWithFiles);
        } catch (error) {
          console.error("Error fetching contents:", error);
          toast.error("Failed to fetch contents.");
        }
      } else {
        setContents([]);
      }
    };

    fetchContents();
  }, [selectedGroup]);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required.");
      return;
    }

    try {
      const groupResponse = await insertData("doc_groups", {
        group_name: newGroupName,
        description: newGroupDescription,
        created_by: currentUserId,
      });

      const groupId = groupResponse.id;

      // Add the creator as an admin
      await insertData("doc_group_members", {
        group_id: groupId,
        user_id: currentUserId,
        full_name: users.find(user => user.id === currentUserId).full_name,
        email: users.find(user => user.id === currentUserId).email,
        user_level: "admin",
      });

      // Add selected members
      await Promise.all(
        selectedMembers.map(async (member) => {
          await insertData("doc_group_members", {
            group_id: groupId,
            user_id: member.id,
            full_name: member.full_name,
            email: member.email,
            user_level: "user",
          });
        })
      );

      toast.success("Group created successfully!");
      setOpenGroupDialog(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedMembers([]);
      const groupsResponse = await selectData("doc_groups", { created_by: currentUserId });
      setGroups(groupsResponse.data);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group.");
    }
  };

  const handleUpdateGroup = async () => {
    if (!groupSettingsName.trim()) {
      toast.error("Group name is required.");
      return;
    }

    try {
      await updateData("doc_groups", {
        group_name: groupSettingsName,
        description: groupSettingsDescription,
      }, { id: selectedGroup.id });

      toast.success("Group updated successfully!");
      setOpenGroupSettingsDialog(false);
      const groupsResponse = await selectData("doc_groups", { created_by: currentUserId });
      setGroups(groupsResponse.data);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group.");
    }
  };

  const handleAddMember = async (member) => {
    try {
      await insertData("doc_group_members", {
        group_id: selectedGroup.id,
        user_id: member.id,
        full_name: member.full_name,
        email: member.email,
        user_level: "user",
      });

      toast.success(`${member.full_name} added to the group!`);
      const membersResponse = await selectData("doc_group_members", { group_id: selectedGroup.id });
      setExistingMembers(membersResponse.data);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member.");
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <InsertDriveFile />;
      case "doc":
      case "docx":
        return <FilePresent />;
      case "jpg":
      case "png":
      case "jpeg":
        return <ImageIcon />;
      default:
        return <InsertDriveFile />;
    }
  };

  const constructFileUrl = (filePath) => {
    const baseUrl = `${apiUrl}:3000/uploads`; // Replace with your actual base URL
    const cleanedFilePath = filePath.replace(/^\/+/, "");
    return `${baseUrl}/${cleanedFilePath}`;
  };

  const getFileNameFromLink = (link) => {
    const parts = link.split("\\uploads\\");
    return parts.length > 1 ? parts[1] : link.split("/").pop();
  };
  const handleAddContent = async () => {
    if (!newContentTitle.trim()) {
      toast.error("Title is required.");
      return;
    }

    try {
      const contentResponse = await insertData("group_content", {
        group_id: selectedGroup.id,
        title: newContentTitle,
        description: newContentDescription,
        uploaded_by: currentUserId,
      });

      const contentId = contentResponse.id;

      // Upload files and save links
      if (files.length > 0) {
        await Promise.all(
          Array.from(files).map(async (file) => {
            const uploadedFile = await uploadFile(file, currentUserId, contentId, (progress) => {
              setUploadProgress(progress);
            });
            await insertData("group_content_files", {
              content_id: contentId,
              file_link: uploadedFile.file_link,
              file_name: file.name,
            });
          })
        );
      }

      toast.success("Content added successfully!");
      setOpenContentDialog(false);
      setNewContentTitle("");
      setNewContentDescription("");
      setFiles([]);
      setUploadProgress(0);
      const contentsResponse = await selectData("group_content", { group_id: selectedGroup.id, is_deleted: false });
      const contentData = contentsResponse.data;

      // Fetch files for each content
      const contentWithFiles = await Promise.all(contentData.map(async (content) => {
        const filesResponse = await selectData("group_content_files", { content_id: content.id });
        return { ...content, files: filesResponse.data };
      }));

      setContents(contentWithFiles);
    } catch (error) {
      console.error("Error adding content:", error);
      toast.error("Failed to add content.");
    }
  };

  const handleDeleteContent = async () => {
    if (!contentToDelete) {
      return;
    }

    try {
      await updateData("group_content", { is_deleted: true }, { id: contentToDelete.id });
      toast.success("Content deleted successfully!");
      setDeleteDialogOpen(false);
      setContentToDelete(null);
      const contentsResponse = await selectData("group_content", { group_id: selectedGroup.id, is_deleted: false });
      const contentData = contentsResponse.data;

      // Fetch files for each content
      const contentWithFiles = await Promise.all(contentData.map(async (content) => {
        const filesResponse = await selectData("group_content_files", { content_id: content.id });
        return { ...content, files: filesResponse.data };
      }));

      setContents(contentWithFiles);
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content.");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) &&
    user.id !== currentUserId &&
    !existingMembers.some((member) => member.id === user.id)
  );

  return (
    <Box sx={{ display: "flex", height: "90vh", overflow: "hidden", p: 2 }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: "20%",
          p: 2,
          overflowY: "auto",
          backgroundColor: darkMode ? "#333" : "#f9f9f9",
          color: darkMode ? "#fff" : "#000",
          borderRadius: 5,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          📘 Groups
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Search Groups"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenGroupDialog(true)}
          fullWidth
          sx={{ mb: 2 }}
        >
          Add New Group
        </Button>
        <Box
          sx={{
            padding: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
              borderRadius: "3px",
            },
          }}
        >
          {filteredGroups.map((group) => (
            <Box key={group.id} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Folder />}
                onClick={() => setSelectedGroup(group)}
                sx={{
                  textAlign: "left",
                  flex: 1,
                  backgroundColor: selectedGroup?.id === group.id ? "primary.main" : "inherit",
                  color: selectedGroup?.id === group.id ? "#fff" : "inherit",
                }}
              >
                {group.group_name}
              </Button>
              {group.created_by === currentUserId && (
                <IconButton
                  onClick={async () => {
                    setSelectedGroup(group);
                    setGroupSettingsName(group.group_name);
                    setGroupSettingsDescription(group.description);
                    try {
                      const membersResponse = await selectData("doc_group_members", { group_id: group.id });
                      setExistingMembers(membersResponse.data);
                      setOpenGroupSettingsDialog(true);
                    } catch (error) {
                      console.error("Error fetching group members:", error);
                      toast.error("Failed to fetch group members.");
                    }
                  }}
                >
                  <Settings />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Content Area */}
      <Box sx={{ width: "80%", p: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {selectedGroup ? (
          <>
            {/* Fixed Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h4">{selectedGroup.group_name}</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenContentDialog(true)}
                >
                  Add Content
                </Button>
              </Box>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {selectedGroup.description}
              </Typography>
            </Box>

            {/* Scrollable Content */}
            <Box sx={{ flex: 1, p: 2, overflowY: "auto", "&::-webkit-scrollbar": { width: "6px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc", borderRadius: "3px" } }}>
              <Grid container spacing={2}>
                {contents.length > 0 ? (
                  contents.map((content) => (
                    <Grid item xs={12} key={content.id}>
                      <Card sx={{ p: 2, boxShadow: 'none', position: 'relative' }}>
                        <IconButton
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={() => {
                            setContentToDelete(content);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete />
                        </IconButton>
                        <Box sx={{ textAlign: "left" }}>
                          <Typography variant="h6">{content.title}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Uploaded by: {users.find(user => user.id === content.uploaded_by)?.full_name} <br />
                            Uploaded date: {new Date(content.created_at).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="textSecondary"
                            dangerouslySetInnerHTML={{ __html: content.description }}
                          />
                        </Box>
                        <List>
                          {content.files && content.files.map((file) => (
                            <ListItem key={file.id}>
                              <ListItemIcon>{getFileIcon(file.file_name)}</ListItemIcon>
                              <ListItemText primary={file.file_name} />
                              <Button
                                variant="text"
                                onClick={() =>
                                  window.open(
                                    constructFileUrl(getFileNameFromLink(file.file_link)),
                                    "_blank"
                                  )
                                }
                              >
                                View
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 5 }}>
                    No content available for this group.
                  </Typography>
                )}
              </Grid>
            </Box>
          </>
        ) : (
          <Typography variant="h6" sx={{ mt: 10, textAlign: "center" }}>
            Select a group to view its content.
          </Typography>
        )}
      </Box>

      {/* Add Group Dialog */}
      <Dialog open={openGroupDialog} onClose={() => setOpenGroupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Group</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add Members
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Search Users"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <List sx={{
              flex: 1, maxHeight: "300px", overflowY: "auto",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
                borderRadius: "3px",
              },
            }}>
              {filteredUsers.map((user) => (
                <ListItem key={user.id}>
                  <ListItemText primary={user.full_name} secondary={user.email} />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (!selectedMembers.includes(user)) {
                        setSelectedMembers([...selectedMembers, user]);
                      }
                    }}
                  >
                    Add
                  </Button>
                </ListItem>
              ))}
            </List>
            <List sx={{
              flex: 1, maxHeight: "300px", overflowY: "auto",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
                borderRadius: "3px",
              },
            }}>
              {selectedMembers.map((member) => (
                <ListItem key={member.id}>
                  <ListItemText primary={member.full_name} secondary={member.email} />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
                    }}
                  >
                    Remove
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGroupDialog(false)}>Cancel</Button>
          <Button onClick={handleAddGroup} variant="contained">
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Content Dialog */}
      <Dialog open={openContentDialog} onClose={() => setOpenContentDialog(false)} maxWidth="sm" fullWidth sx={{
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
          borderRadius: "3px",
        },
      }}>
        <DialogTitle>Add New Content</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newContentTitle}
            onChange={(e) => setNewContentTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Editor
            apiKey="pu258hbqcxkxv0lgzxelam5vmcax1y7m1oir2w0ougjnc5di"
            value={newContentDescription}
            init={{
              height: 200,
              menubar: false,
            }}
            sx={{ mb: 2 }}
            onEditorChange={(content) => setNewContentDescription(content)}
          />
          <Button
            variant="contained"
            component="label"
            startIcon={<FilePresent />}
          >
            Upload Files
            <input
              type="file"
              accept=".pdf,.pptx,.docx,.zip,.jpg,.png,.jpeg"
              multiple
              hidden
              onChange={(e) => setFiles([...files, ...e.target.files])}
            />
          </Button>
          {files.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Selected Files:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {Array.from(files).map((file, index) => (
                  <Chip key={index} label={file.name} />
                ))}
              </Box>
            </Box>
          )}
          {uploadProgress > 0 && (
            <Box sx={{ mt: 2 }}>
              <CircularProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2">{uploadProgress}%</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContentDialog(false)}>Cancel</Button>
          <Button onClick={handleAddContent} variant="contained">
            Add Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this content?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteContent} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Settings Dialog */}

      <Dialog open={openGroupSettingsDialog} onClose={() => setOpenGroupSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Group Settings</DialogTitle>
        <DialogContent sx={{ display: "flex", height: "500px", overflow: "hidden" }}>

          {/* Sidebar - Navigation */}
          <Box
            sx={{
              width: "25%", // Thin sidebar
              p: 2,
              borderRadius: 3,
              backgroundColor: darkMode ? "#222" : "#f5f5f5",
              color: darkMode ? "#fff" : "#000",
              borderRight: `1px solid ${darkMode ? "#444" : "#ddd"}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ textAlign: "center" }}>
              ⚙️ Settings
            </Typography>

            {/* Info Button */}
            <Button
              variant={selectedSection === "info" ? "contained" : "outlined"}
              color="info"
              fullWidth
              onClick={() => setSelectedSection("info")}
            >
              Info
            </Button>

            {/* Existing Members Button */}
            <Button
              variant={selectedSection === "existing" ? "contained" : "outlined"}
              color="info"
              fullWidth
              onClick={() => setSelectedSection("existing")}
            >
              Existing Members
            </Button>

            {/* Add Members Button */}
            <Button
              variant={selectedSection === "add" ? "contained" : "outlined"}
              color="info"
              fullWidth
              onClick={() => setSelectedSection("add")}
            >
              Add Members
            </Button>


          </Box>

          {/* Right Section */}
          <Box sx={{ flex: 1, p: 3, borderRadius: 3 }}>
            {/* Show "Info" Section */}
            {selectedSection === "info" && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>Group Info</Typography>
                <TextField
                  fullWidth
                  label="Group Name"
                  value={groupSettingsName}
                  onChange={(e) => setGroupSettingsName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={groupSettingsDescription}
                  onChange={(e) => setGroupSettingsDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {/* Show "Existing Members" Section */}
            {selectedSection === "existing" && (
              <>
                <Typography variant="h6" sx={{ mb: 2, }}>Existing Members</Typography>
                <List sx={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  backgroundColor: darkMode ? "#333" : "#f9f9f9",
                  borderRadius: "5px",
                  borderRadius: 3,
                  p: 1,
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: darkMode ? "#555" : "#ccc",
                    borderRadius: "3px",
                  },
                }}>
                  {existingMembers.map((member) => (
                    <ListItem key={member.id}>
                      <ListItemText primary={member.full_name} secondary={member.email} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Show "Add Members" Section */}
            {selectedSection === "add" && (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>Add New Members</Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Users"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <List sx={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  backgroundColor: darkMode ? "#333" : "#f9f9f9",
                  borderRadius: "5px",
                  borderRadius: 3,
                  p: 1,
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: darkMode ? "#555" : "#ccc",
                    borderRadius: "3px",
                  },
                }}>
                  {filteredUsers.map((user) => (
                    <ListItem key={user.id}>
                      <ListItemText primary={user.full_name} secondary={user.email} />
                      <Button
                        variant="contained"
                        onClick={() => handleAddMember(user)}
                        disabled={existingMembers.some((member) => member.id === user.id)}
                      >
                        Add
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenGroupSettingsDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateGroup} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
};

export default DocumentSharingGroupPage;