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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Search, Add, FilePresent, Image as ImageIcon, InsertDriveFile, Book, Delete, Folder } from "@mui/icons-material";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-hot-toast";
import { selectData, insertData, updateData, selectDataProfiles } from "../../services/dataService";
import { uploadFile } from "../../services/fileservice";
import { ThemeContext } from "../../context/ThemeContext";
import { getUserDetails } from "../../services/userService";

// Helper function to construct the full URL for files/images
const constructFileUrl = (filePath) => {
  const apiUrl = process.env.REACT_APP_MAIN_API; // ✅ Correct
  const baseUrl = `http://127.0.0.1:3000/uploads`; // Replace with your actual base URL
  const cleanedFilePath = filePath.replace(/^\/+/, "");
  return `${baseUrl}/${cleanedFilePath}`;
};

// Helper function to get the file name from a link
const getFileNameFromLink = (link) => {
  const parts = link.split("\\uploads\\");
  return parts.length > 1 ? parts[1] : link.split("/").pop();
};

// Component to render an image with dynamic fetching
const ImageRenderer = ({ image }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const fetchAndSetImage = async () => {
      const url = await fetchImage(getFileNameFromLink(image.image_link));
      setImageUrl(url);
    };

    fetchAndSetImage();
  }, [image.image_link]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "250px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderRadius: "4px",
      }}
    >
      <img
        src={imageUrl || "placeholder-image-url"}
        alt={image.image_name || "Course Content"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "4px",
        }}
      />
    </Box>
  );
};

// Helper function to fetch image from API
const fetchImage = async (filePath) => {
  try {
    const response = await fetch(constructFileUrl(filePath));
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      console.error("Failed to fetch image:", response.statusText);
      return null;
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};

const CourseContentManagement = () => {
  const { darkMode } = useContext(ThemeContext);
  const theme = useTheme();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // States for the add content dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [companyId, setCompanyId] = useState(null);

  // States for the add file collection dialog
  const [openFileCollectionDialog, setOpenFileCollectionDialog] = useState(false);
  const [newFileCollectionTitle, setNewFileCollectionTitle] = useState("");
  const [newFileCollectionDescription, setNewFileCollectionDescription] = useState("");

  // State for the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  // State to track the selected file name
  const [selectedFileName, setSelectedFileName] = useState("");

  // State for the file list dialog
  const [openFileListDialog, setOpenFileListDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Fetch courses for the logged-in teacher
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userDetails = await getUserDetails();
        setCurrentUserId(userDetails.id);
        setCompanyId(userDetails.company_id);
        const usersData = await selectDataProfiles({ company_id: userDetails.company_id });
        setUsers(usersData.data);

        const teacherCourseResponse = await selectData("teacher_course", {
          user_id: userDetails.id,
          is_active: true,
          is_deleted: false,
        });

        if (teacherCourseResponse?.data?.length > 0) {
          const courseIds = teacherCourseResponse.data.map((tc) => tc.course_id);
          const courseDetails = [];

          for (const id of courseIds) {
            const courseResponse = await selectData("courses", { id, is_active: true });
            if (courseResponse?.data?.length > 0) {
              courseDetails.push(courseResponse.data[0]);
            }
          }

          setCourses(courseDetails);
        }
      } catch (error) {
        console.error("Error fetching teacher courses:", error);
        toast.error("Failed to fetch courses.");
      }
    };

    fetchCourses();
  }, []);

  // Fetch content for the selected course
  const fetchContent = async (courseId) => {
    try {
      const courseContentResponse = await selectData("course_content", { course_id: courseId });
      const contentData = [];

      for (const content of courseContentResponse.data) {
        if (content.type === "content" && !content.is_deleted) {
          const recordResponse = await selectData("course_content_record", {
            course_content_id: content.id,
          });

          const record = recordResponse?.data?.[0];
          if (record) {
            const imagesResponse = await selectData("course_content_record_image", {
              course_content_record_id: record.id,
            });

            const filesResponse = await selectData("course_content_record_file", {
              course_content_record_id: record.id,
            });

            contentData.push({
              id: content.id,
              type: content.type,
              title: record.title,
              description: record.description,
              images: imagesResponse?.data || [],
              files: filesResponse?.data || [],
            });
          }
        } else if (content.type === "file_collection" && !content.is_deleted) {
          const recordResponse = await selectData("course_content_record", {
            course_content_id: content.id,
          });

          const record = recordResponse?.data?.[0];

          if (record) {
            const assessmentFilesResponse = await selectData("course_content_record_assessment_collection",{
                course_content_record_id: record.course_content_id,
              });

            contentData.push({
              id: content.id,
              type: content.type,
              title: record.title,
              description: record.description,
              assessmentFiles: assessmentFilesResponse?.data || [],
            });
          }
        }
      }

      setContents(contentData);
    } catch (error) {
      console.error("Error fetching course content:", error);
      toast.error("Failed to fetch course content.");
    }
  };

  // Handle adding new content
  const handleAddContent = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required.");
      return;
    }

    try {
      // Insert into course_content table
      const courseContentResponse = await insertData("course_content", {
        course_id: selectedCourse.id,
        type: "content",
      });

      const courseContentId = courseContentResponse.id;

      // Insert into course_content_record table
      const courseContentRecordResponse = await insertData("course_content_record", {
        course_content_id: courseContentId,
        title: newTitle,
        description: newDescription,
      });

      const courseContentRecordId = courseContentRecordResponse.id;

      // Upload images and save links
      if (images.length > 0) {
        await Promise.all(
          images.map(async (image) => {
            const uploadedImage = await uploadFile(image, currentUserId, courseContentRecordId);
            await insertData("course_content_record_image", {
              course_content_record_id: courseContentRecordId,
              image_link: uploadedImage.file_link,
              image_name: image.name,
            });
          })
        );
      }

      // Upload files and save links
      if (files.length > 0) {
        await Promise.all(
          Array.from(files).map(async (file) => {
            const uploadedFile = await uploadFile(file, currentUserId, courseContentRecordId);
            await insertData("course_content_record_file", {
              course_content_record_id: courseContentRecordId,
              file_name: file.name,
              file_link: uploadedFile.file_link,
            });
          })
        );
      }

      toast.success("Content added successfully!");
      fetchContent(selectedCourse.id); // Refresh content
      setOpenDialog(false);
      setNewTitle("");
      setNewDescription("");
      setImages([]);
      setFiles([]);
    } catch (error) {
      console.error("Error adding content:", error);
      toast.error("Failed to add content.");
    }
  };

  // Handle adding new file collection
  const handleAddFileCollection = async () => {
    if (!newFileCollectionTitle.trim()) {
      toast.error("Title is required.");
      return;
    }

    try {
      // Insert into course_content table
      const courseContentResponse = await insertData("course_content", {
        course_id: selectedCourse.id,
        type: "file_collection",
      });

      const courseContentId = courseContentResponse.id;

      // Insert into course_content_record table
      await insertData("course_content_record", {
        course_content_id: courseContentId,
        title: newFileCollectionTitle,
        description: newFileCollectionDescription,
      });

      toast.success("File collection added successfully!");
      fetchContent(selectedCourse.id); // Refresh content
      setOpenFileCollectionDialog(false);
      setNewFileCollectionTitle("");
      setNewFileCollectionDescription("");
    } catch (error) {
      console.error("Error adding file collection:", error);
      toast.error("Failed to add file collection.");
    }
  };

  // Handle adding a file to an assessment collection
  const handleAddAssessmentFile = async (collectionId, fileName, file, description) => {
    try {
      const uploadedFile = await uploadFile(file, currentUserId, collectionId);
      await insertData("course_content_record_assessment_collection", {
        course_content_record_id: collectionId,
        user_id: currentUserId,
        file_name: fileName,
        file_link: uploadedFile.file_link,
        description: description,
      });

      toast.success("File added to collection successfully!");
      fetchContent(selectedCourse.id); // Refresh content
    } catch (error) {
      console.error("Error adding file to collection:", error);
      toast.error("Failed to add file to collection.");
    }
  };

  // Handle delete content
  const handleDeleteContent = async () => {
    if (!contentToDelete) {
      return;
    }

    try {
      await updateData("course_content", { is_deleted: true }, { id: contentToDelete.id });
      toast.success("Content deleted successfully!");
      fetchContent(selectedCourse.id); // Refresh content
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content.");
    }
  };

  // Helper to get file icon based on file type
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

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserFullName = (userId) => {
    const user = users.find(user => user.id === userId);
    return user ? user.full_name : "Unknown User";
  };

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
          📘 Courses
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="Search Courses"
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
          {filteredCourses.map((course) => (
            <Button
              key={course.id}
              variant="outlined"
              startIcon={<Book />}
              onClick={() => {
                setSelectedCourse(course);
                fetchContent(course.id);
              }}
              sx={{
                textAlign: "left",
                marginBottom: 1,
                backgroundColor:
                  selectedCourse?.id === course.id ? "primary.main" : "inherit",
                color: selectedCourse?.id === course.id ? "#fff" : "inherit",
              }}
            >
              {course.name}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Content Area */}
      <Box sx={{ width: "80%", p: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {selectedCourse ? (
          <>
            {/* Fixed Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h4">{selectedCourse.name}</Typography>
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ mr: 2 }}
                  >
                    Add Content
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Folder />}
                    onClick={() => setOpenFileCollectionDialog(true)}
                  >
                    Add File Collection
                  </Button>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {selectedCourse.description}
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
                        </Box>
                       
                        {content.type === "content" ? (
                          <>
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                              {content.images.map((image) => (
                                <Grid item xs={12} sm={6} md={4} key={image.id}>
                                  <ImageRenderer image={image} />
                                </Grid>
                              ))}
                            </Grid>
                            <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 2, mt: 2 }}
                          dangerouslySetInnerHTML={{ __html: content.description }}
                        />
                            <List>
                              {content.files.map((file) => (
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
                          </>
                        ) : (
                          <>
                            {/* File Collection Upload Section */}
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <TextField
                                  label="File Name"
                                  variant="outlined"
                                  size="small"
                                  sx={{ flex: 1, mr: 2 }}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                />
                                <Button
                                  variant="contained"
                                  component="label"
                                  startIcon={<FilePresent />}
                                  sx={{ mr: 2 }}
                                >
                                  Select File
                                  <input
                                    type="file"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          setSelectedFileName(file.name); // Show selected file name
                                          setFiles([file]); // Store the selected file
                                        }
                                      }}
                                    />
                                  </Button>
                                  <Typography variant="body2" sx={{ mr: 2 }}>
                                    {selectedFileName || "No file selected"}
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() =>
                                      handleAddAssessmentFile(
                                        content.id,
                                        newTitle,
                                        files[0],
                                        newDescription
                                      )
                                    }
                                  >
                                    Submit
                                  </Button>
                                </Box>
                                <Editor
                                  apiKey="pu258hbqcxkxv0lgzxelam5vmcax1y7m1oir2w0ougjnc5di"
                                  value={newDescription}
                                  init={{
                                    height: 300,
                                    menubar: false,
                                  }}
                                  onEditorChange={(content) => setNewDescription(content)}
                                />
                              </Box>
  
                              {/* Button to Show Files in Popup */}
                              <Button
                                variant="contained"
                                onClick={() => {
                                  setSelectedFiles(content.assessmentFiles);
                                  setOpenFileListDialog(true);
                                }}
                                sx={{ mt: 2 }}
                              >
                                Show Files
                              </Button>
                            </>
                          )}
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 5 }}>
                      No content available for this course.
                    </Typography>
                  )}
                </Grid>
              </Box>
            </>
          ) : (
            <Typography variant="h6" sx={{ mt: 10, textAlign: "center" }}>
              Select a course to view its content.
            </Typography>
          )}
        </Box>
  
        {/* Add Content Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Content</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Editor
              apiKey="pu258hbqcxkxv0lgzxelam5vmcax1y7m1oir2w0ougjnc5di"
              value={newDescription}
              init={{
                height: 200,
                menubar: false,
              }}
              sx={{ mb: 2 }}
              onEditorChange={(content) => setNewDescription(content)}
            />
            <Button
              variant="contained"
              component="label"
              startIcon={<ImageIcon />}
              sx={{ mb: 2, mt: 1 }}
            >
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => setImages([...images, ...e.target.files])}
              />
            </Button>
            <Box sx={{ mb: 2 }}>
              {images.map((image, index) => (
                <Typography key={index} variant="body2">
                  {image.name}
                </Typography>
              ))}
            </Box>
            <Button
              variant="contained"
              component="label"
              startIcon={<FilePresent />}
            >
              Upload Files
              <input
                type="file"
                accept=".pdf,.pptx,.docx,.zip"
                multiple
                hidden
                onChange={(e) => setFiles([...files, ...e.target.files])}
              />
            </Button>
            <Box sx={{ mt: 1 }}>
              {files.length > 0 && Array.from(files).map((file, index) => (
                <Typography key={index} variant="body2">
                  {file.name}
                </Typography>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddContent} variant="contained">
              Add Content
            </Button>
          </DialogActions>
        </Dialog>
  
        {/* Add File Collection Dialog */}
        <Dialog open={openFileCollectionDialog} onClose={() => setOpenFileCollectionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New File Collection</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={newFileCollectionTitle}
              onChange={(e) => setNewFileCollectionTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Editor
              apiKey="pu258hbqcxkxv0lgzxelam5vmcax1y7m1oir2w0ougjnc5di"
              value={newFileCollectionDescription}
              init={{
                height: 200,
                menubar: false,
              }}
              sx={{ mb: 2 }}
              onEditorChange={(content) => setNewFileCollectionDescription(content)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFileCollectionDialog(false)}>Cancel</Button>
            <Button onClick={handleAddFileCollection} variant="contained">
              Add File Collection
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

        {/* File List Dialog */}
        <Dialog open={openFileListDialog} onClose={() => setOpenFileListDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Uploaded Files</DialogTitle>
          <DialogContent>
            <List>
              {selectedFiles.map((file) => (
                <ListItem key={file.id}>
                  <ListItemIcon>{getFileIcon(file.file_name)}</ListItemIcon>
                  <ListItemText primary={file.file_name} />
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Uploaded by: {getUserFullName(file.user_id)}
                  </Typography>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFileListDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };
  
  export default CourseContentManagement;