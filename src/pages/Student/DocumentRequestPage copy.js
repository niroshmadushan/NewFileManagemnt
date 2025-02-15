import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PDFDocument, rgb } from 'pdf-lib';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogActions,
    DialogContent,
    InputAdornment,
    DialogTitle,
    LinearProgress,
    CircularProgress,
    IconButton,
} from '@mui/material';
import { CloudUpload, Description, Download } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { uploadFile, downloadFile } from '../../services/fileservice';
import { useTheme } from '@mui/material/styles';
import { QRCodeSVG } from 'qrcode.react'; // For generating QR code
import jsPDF from 'jspdf'; // For generating PDF with QR code
import QRCode from 'qrcode';

const DocumentRequestPage = () => {
    const theme = useTheme();
    const [documentRequests, setDocumentRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [docName, setDocName] = useState('');
    const [docDescription, setDocDescription] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [companyId, setCompanyId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const getFileNameFromLink = (link) => {
        const parts = link.split('\\uploads\\');
        return parts.length > 1 ? parts[1] : link.split('/').pop();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const userDetails = await getUserDetails();
            if (!userDetails || !userDetails.company_id) {
                throw new Error("User details not found.");
            }
            setCompanyId(userDetails.company_id);

            // Fetch document requests
            const requestsResponse = await selectData('document_requests', { company_id: userDetails.company_id });
            setDocumentRequests(requestsResponse.data || []);

            toast.success('Data fetched successfully!');
        } catch (error) {
            toast.error('Failed to fetch data.');
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!docName || !docDescription) {
            toast.error('Please fill in all fields.');
            return;
        }

        try {
            const userDetails = await getUserDetails();
            const requestData = {
                user_id: userDetails.user_id,
                full_name: userDetails.full_name,
                email: userDetails.email,
                doc_name: docName,
                doc_description: docDescription,
                company_id: userDetails.company_id,
                doc_link: null,
                status: 'Pending',
                created_at: new Date().toISOString(),
            };

            await insertData('document_requests', requestData);
            toast.success('Document request submitted successfully!');
            fetchData(); // Refresh data
            setShowRequestForm(false);
            setDocName('');
            setDocDescription('');
        } catch (error) {
            toast.error('Failed to submit document request.');
            console.error('Error submitting request:', error);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedRequest) {
            toast.error('No request selected.');
            return;
        }

        if (!uploadedFile) {
            toast.error('Please select a file to upload.');
            return;
        }

        try {
            // Upload file using file service
            const fileResponse = await uploadFile(uploadedFile, selectedRequest.id);

            // Update document request with file link
            await updateData('document_requests', { doc_link: fileResponse.file_link }, { id: selectedRequest.id });

            // Update UI
            const updatedRequests = documentRequests.map(request =>
                request.id === selectedRequest.id
                    ? { ...request, doc_link: fileResponse.file_link }
                    : request
            );
            setDocumentRequests(updatedRequests);

            toast.success('Document uploaded successfully!');
            setUploadProgress(100);
            setUploadedFile(null);
            setSelectedRequest(null);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload document.');
            setUploadProgress(0);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
        } else {
            toast.error('Please select a valid file.');
        }
    };



    const handleDownloadDocument = async (docRequest) => {
        if (!docRequest.doc_link) {
            toast.error('No document available.');
            return;
        }

        const fileName = getFileNameFromLink(docRequest.doc_link);
        const fileUrl = `http://10.187.89.140:3000/uploads/${fileName}`;
        console.log(`Fetching file from: ${fileUrl}`);

        try {
            // Fetch the PDF file using Axios
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            console.log('PDF file fetched successfully.');

            // Load the PDF into pdf-lib
            const pdfDoc = await PDFDocument.load(response.data);

            // Generate the QR code as a PNG data URL
            const qrCodeUrl = `http://10.187.89.140:3000/api/data/validate/docreq?id=${docRequest.id}`;
            const qrCodeDataUrl = await generateQRCodeDataURL(qrCodeUrl);
            const qrImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer());
            const qrImage = await pdfDoc.embedPng(qrImageBytes);

            // Add the QR Code to the first page
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();

            firstPage.drawImage(qrImage, {
                x: width - 60, // Adjust positioning
                y: 20,
                width: 50,
                height: 50
            });

            // Convert the modified PDF back to a blob
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            // Download the modified PDF
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `document_${docRequest.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Modified PDF downloaded successfully.');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download document.');
        }
    };


    // Utility function: Convert ArrayBuffer to Base64
    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    // Utility function: Generate QR Code Data URL




    const generateQRCodeDataURL = async (url) => {
        try {
            return await QRCode.toDataURL(url);
        } catch (error) {
            console.error('QR Code generation error:', error);
            return null;
        }
    };


    const blobToDataURL = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                console.log("Blob converted to Data URL (preview):", reader.result.slice(0, 100));
                resolve(reader.result);
            };
            reader.onerror = (error) => {
                console.error("Error converting blob to Data URL:", error);
                reject(error);
            };
            reader.readAsDataURL(blob);
        });
    };



    return (
        <Box sx={{ padding: 0, backgroundColor: theme.palette.background.default }}>
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            <Card sx={{ mb: 4, boxShadow: 'none', backgroundColor: theme.palette.background.paper }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                        <Description sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                        Document Requests
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -5 }}>
                        <Button
                            variant="contained"
                            startIcon={<Description />}
                            onClick={() => setShowRequestForm(true)}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                        >
                            Request Document
                        </Button>
                    </Box>
                    <TableContainer sx={{
                        maxHeight: 500, p: 1, mt: 1,
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                            borderRadius: '3px'
                        }
                    }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>User ID</TableCell>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Doc Name</TableCell>
                                    <TableCell>Doc Description</TableCell>
                                    <TableCell>Company ID</TableCell>
                                    <TableCell>Doc Link</TableCell>
                                    <TableCell>Upload Document</TableCell>
                                    <TableCell>Download Document</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documentRequests.map((request, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{request.user_id}</TableCell>
                                        <TableCell>{request.full_name}</TableCell>
                                        <TableCell>{request.email}</TableCell>
                                        <TableCell>{request.doc_name}</TableCell>
                                        <TableCell>{request.doc_description}</TableCell>
                                        <TableCell>{request.company_id}</TableCell>
                                        <TableCell>
                                            {request.doc_link ? (
                                                <Typography variant="body2" color="primary">
                                                    Document Available
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="error">
                                                    Not Uploaded
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!request.doc_link && (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<CloudUpload />}
                                                    onClick={() => setSelectedRequest(request)}
                                                    sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }}
                                                >
                                                    Upload
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {request.doc_link && (
                                                <IconButton onClick={() => handleDownloadDocument(request)}>
                                                    <Download sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Document Request Form Dialog */}
            <Dialog open={showRequestForm} onClose={() => setShowRequestForm(false)} fullWidth maxWidth="sm">
                <DialogTitle>Request Document</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Document Name"
                                value={docName}
                                onChange={(e) => setDocName(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Description sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Document Description"
                                value={docDescription}
                                onChange={(e) => setDocDescription(e.target.value)}
                                multiline
                                rows={4}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Description sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRequestForm(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Description />}
                        onClick={handleSubmitRequest}
                        sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                    >
                        Submit Request
                    </Button>
                </DialogActions>
            </Dialog>

            {/* File Upload Dialog */}
            <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} fullWidth maxWidth="sm">
                <DialogTitle>Upload Document</DialogTitle>
                <DialogContent>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        style={{ marginBottom: 16 }}
                    />
                    {uploadedFile && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Selected File: {uploadedFile.name}
                        </Typography>
                    )}
                    {uploadProgress > 0 && (
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedRequest(null)} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={handleFileUpload}
                        disabled={!uploadedFile}
                        sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentRequestPage;