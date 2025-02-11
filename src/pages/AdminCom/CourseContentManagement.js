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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import { Search, Add, FilePresent, Image as ImageIcon, InsertDriveFile } from "@mui/icons-material";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-hot-toast";
import { selectData, insertData } from "../../services/dataService";
import { uploadFile } from "../../services/fileservice";
import { ThemeContext } from "../../context/ThemeContext";
import { getUserDetails } from "../../services/userService";

// Helper function to construct the full URL for files/images
const constructFileUrl = (filePath) => {
    const baseUrl = "http://172.20.10.6:3000/uploads"; // Replace with your actual base URL
    // Remove leading slashes from filePath to avoid double slashes
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
                height: "250px", // Set a fixed height
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                borderRadius: "4px",
            }}
        >
            <img
                src={imageUrl || "placeholder-image-url"} // Provide a placeholder image URL
                alt={image.image_name || "Course Content"}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover", // Maintain aspect ratio
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

    // Fetch courses for the logged-in teacher
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const userDetails = await getUserDetails();
                setCurrentUserId(userDetails.id); // Set the current user ID
                const teacherCourseResponse = await selectData("teacher_course", {
                    user_id: userDetails.id,
                    is_active: true,
                });

                if (teacherCourseResponse?.data?.length > 0) {
                    const courseIds = teacherCourseResponse.data.map((tc) => tc.course_id);
                    const courseDetails = [];

                    for (const id of courseIds) {
                        const courseResponse = await selectData("courses", { id });
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
                if (content.type === "content") {
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
                            title: record.title,
                            description: record.description,
                            images: imagesResponse?.data || [],
                            files: filesResponse?.data || [],
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
                            image_name: image.name, // Save the image name
                        });
                    })
                );
            }

            // Upload files and save links
            if (files.length > 0) {
                await Promise.all(
                    files.map(async (file) => {
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

    return (
        <Box sx={{ display: "flex", height: "100vh" }}>
            {/* Sidebar */}
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

            {/* Content Area */}
            <Box sx={{ width: "80%", p: 3 }}>
                {selectedCourse ? (
                    <>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                            <Typography variant="h4">{selectedCourse.name}</Typography>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setOpenDialog(true)}
                            >
                                Add Content
                            </Button>
                        </Box>

                        <Grid container spacing={2}>
                            {contents.length > 0 ? (
                                contents.map((content) => (
                                    <Grid item xs={12} key={content.id}>
                                        <Card sx={{ p: 2 }}>
                                            <Box sx={{ textAlign: "left" }}>
                                                <Typography variant="h6">{content.title}</Typography>
                                            </Box>
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
                                                            onClick={() => window.open(constructFileUrl(getFileNameFromLink(file.file_link)), "_blank")}
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
                        onEditorChange={(content) => setNewDescription(content)}
                    />
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<ImageIcon />}
                        sx={{ mb: 2 }}
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