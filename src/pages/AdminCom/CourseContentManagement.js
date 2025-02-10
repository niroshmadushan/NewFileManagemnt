import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Search, Add, Image, FilePresent, Delete } from "@mui/icons-material";
import { Editor } from "@tinymce/tinymce-react"; // TinyMCE Editor
import { toast } from "react-hot-toast";
import { selectData, insertData } from "../../services/dataService";
import { ThemeContext } from "../../context/ThemeContext";
import { getUserDetails } from "../../services/userService";

const CourseContentManagement = () => {
  const { darkMode } = useContext(ThemeContext);

  // States for managing courses and content
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [contents, setContents] = useState([]);

  // States for adding new content
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);

  // Fetch courses on page load
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userDetails = await getUserDetails();

        // Fetch the teacher's course associations
        const teacherCourseResponse = await selectData("teacher_course", { user_id: userDetails.id, is_active: true });

        if (teacherCourseResponse?.data?.length > 0) {
          const courseIds = teacherCourseResponse.data.map((tc) => tc.course_id); // Extract course IDs

          // Initialize an empty array to store course details
          const courseDetails = [];

          // Fetch each course by its ID one by one
          for (const id of courseIds) {
            try {
              const courseResponse = await selectData("courses", { id });
              if (courseResponse?.data?.length > 0) {
                courseDetails.push(courseResponse.data[0]); // Assuming `data` is an array of course objects
              }
            } catch (error) {
              console.error(`Error fetching course with ID ${id}:`, error);
            }
          }

          // Set the courses state with the fetched course details
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
      const response = await selectData("course_content", { course_id: courseId });
      setContents(response?.data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to fetch content.");
    }
  };

  // Add new content
  const handleAddContent = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required.");
      return;
    }

    try {
      // Add the content to the course_content table
      const courseContentResponse = await insertData("course_content", {
        course_id: selectedCourse.id,
        type: "content",
      });

      const courseContentId = courseContentResponse.data.id;

      // Add the record to the course_content_record table
      const courseContentRecordResponse = await insertData("course_content_record", {
        course_content_id: courseContentId,
        title: newTitle,
        description: newDescription,
      });

      const courseContentRecordId = courseContentRecordResponse.data.id;

      // Upload images
      if (images.length > 0) {
        await Promise.all(
          images.map((image) =>
            insertData("course_content_record_image", {
              course_content_record_id: courseContentRecordId,
              image_link: URL.createObjectURL(image),
            })
          )
        );
      }

      // Upload files
      if (files.length > 0) {
        await Promise.all(
          files.map((file) =>
            insertData("course_content_record_file", {
              course_content_record_id: courseContentRecordId,
              file_name: file.name,
              file_link: URL.createObjectURL(file),
            })
          )
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

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: "20%",
          borderRight: `1px solid ${darkMode ? "#444" : "#ddd"}`,
          p: 2,
          overflowY: "auto",
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
        {courses
          .filter((course) =>
            course.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((course) => (
            <Card
              key={course.id}
              sx={{
                mb: 1,
                cursor: "pointer",
                backgroundColor:
                  selectedCourse?.id === course.id ? "primary.main" : "inherit",
                color: selectedCourse?.id === course.id ? "#fff" : "inherit",
              }}
              onClick={() => {
                setSelectedCourse(course);
                fetchContent(course.id);
              }}
            >
              <CardContent>
                <Typography variant="subtitle1">{course.name}</Typography>
              </CardContent>
            </Card>
          ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ width: "80%", p: 3 }}>
        {selectedCourse ? (
          <>
            {/* Course Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h4">{selectedCourse.name}</Typography>
                <Typography variant="body1" color="textSecondary">
                  {selectedCourse.description || "No description available."}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                Add Content
              </Button>
            </Box>

            {/* Content Cards */}
            <Grid container spacing={2}>
              {contents.length > 0 ? (
                contents.map((content) => (
                  <Grid item xs={12} sm={6} md={4} key={content.id}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="h6">{content.title}</Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, 100px)",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        {content.images?.map((image, index) => (
                          <img
                            key={index}
                            src={image.image_link}
                            alt="Content"
                            style={{
                              width: "100%",
                              height: "80px",
                              borderRadius: "4px",
                            }}
                          />
                        ))}
                      </Box>
                      <Editor
                        value={content.description}
                        init={{
                          height: 200,
                          menubar: false,
                        }}
                        disabled
                      />
                      {content.files?.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          <FilePresent />
                          <Typography
                            variant="body2"
                            sx={{ cursor: "pointer", color: "primary.main" }}
                            onClick={() => window.open(file.file_link, "_blank")}
                          >
                            {file.file_name}
                          </Typography>
                        </Box>
                      ))}
                    </Card>
                  </Grid>
                ))
              ) : (
                <Typography variant="body1" color="textSecondary" sx={{ mt: 5 }}>
                  No content available for this course.
                </Typography>
              )}
            </Grid>
          </>
        ) : (
          <Typography variant="h6" sx={{ mt: 10, textAlign: "center" }}>
            Select a course to view its content.
          </Typography>
        )}
      </Box>

      {/* Add Content Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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
            value={newDescription}
            init={{
              height: 200,
              menubar: false,
              plugins: [
                "advlist autolink lists link image charmap print preview anchor",
                "searchreplace visualblocks code fullscreen",
                "insertdatetime media table paste code help wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
            }}
            onEditorChange={(content) => setNewDescription(content)}
          />
          <Button
            variant="contained"
            component="label"
            startIcon={<Image />}
            sx={{ mt: 2 }}
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
          <Box sx={{ mt: 1 }}>
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
            sx={{ mt: 2 }}
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
            {files.map((file, index) => (
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
    </Box>
  );
};

export default CourseContentManagement;
