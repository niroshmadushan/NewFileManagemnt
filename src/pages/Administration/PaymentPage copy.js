import React, { useState, useEffect } from 'react';
import { LinearProgress } from '@mui/material';

import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Business, Payment, CheckCircle, Cancel, AccountBalance, Download, CloudUpload, Visibility } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PaymentPage = () => {
    const theme = useTheme();
    const [companyDetails, setCompanyDetails] = useState(null);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [bankDetails, setBankDetails] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('Pending');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const userDetails = await getUserDetails();
            if (!userDetails || !userDetails.company_id) {
                throw new Error("User details not found.");
            }
            const companyId = userDetails.company_id;

            // Fetch company details
            const companyResponse = await selectData('company', { id: companyId });
            if (companyResponse.data.length > 0) {
                setCompanyDetails(companyResponse.data[0]);
            } else {
                setCompanyDetails(null);
                console.warn("No company details found.");
            }

            // Fetch subscription plans
            const plansResponse = await selectData('subscription_plans', { is_active: true });
            setSubscriptionPlans(plansResponse.data || []);

            // Fetch bank details
            const bankResponse = await selectData('bank_details');
            setBankDetails(bankResponse.data || []);

            // Fetch payment requests and ensure correct formatting
            const paymentsResponse = await selectData('payment_requests', { company_id: companyId });
            const formattedPayments = paymentsResponse.data.map(payment => ({
                ...payment,
                bank_slip_pdf: payment.bank_slip_pdf
                    ? `data:application/pdf;base64,${payment.bank_slip_pdf}`
                    : null, // Ensure valid format for PDFs
            }));

            setPayments(formattedPayments);

            toast.success('Data fetched successfully!');
        } catch (error) {
            toast.error('Failed to fetch data.');
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleSubmitPayment = async () => {
        if (!selectedPlan || !selectedBank) {
            toast.error('Please select a plan and bank.');
            return;
        }

        try {
            const paymentData = {
                company_id: companyDetails.id,
                company_name: companyDetails.company_name,
                reference: `${companyDetails.company_name}_${companyDetails.id}`,
                plan_name: selectedPlan.name,
                amount: selectedPlan.price,
                bank_name: selectedBank.bank_name,
                account_no: selectedBank.account_no,
                branch_name: selectedBank.branch_name,
                status: 'Pending',
                bank_slip_status: 'Not Uploaded',
                created_at: new Date().toISOString(),
            };

            await insertData('payment_requests', paymentData);
            toast.success('Payment request submitted successfully!');
            setPayments([...payments, paymentData]);
            setPaymentStatus('Pending');
            setShowPaymentForm(false);
        } catch (error) {
            toast.error('Failed to submit payment request.');
            console.error('Error submitting payment:', error);
        }
    };

    const handleDownloadInvoice = (payment) => {
        const doc = new jsPDF();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(33, 150, 243);
        doc.text('BILL OF PAYMENT', 105, 15, { align: 'center' });

        doc.setDrawColor(33, 150, 243);
        doc.line(15, 20, 195, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Bill To:', 15, 30);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(payment.company_name, 15, 35);
        doc.text(payment.company_address || "No Address Provided", 15, 40);
        doc.text(`Company ID: ${payment.company_id}`, 15, 45);

        doc.setFont('helvetica', 'bold');
        doc.text('Connex Codeworks', 145, 30);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('No 286, R. A. De Mel Mawatha,', 145, 35);
        doc.text('Colombo 00300, Sri Lanka', 145, 40);
        doc.text('Email: info@connexcodeworks.biz', 145, 45);
        doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 145, 50);

        doc.setDrawColor(0);
        doc.rect(15, 55, 180, 15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Invoice Reference: ${payment.reference}`, 20, 63);
        doc.text(`Status: ${payment.status}`, 140, 63);

        doc.autoTable({
            startY: 75,
            head: [['Field', 'Details']],
            body: [
                ['Payment Plan', payment.plan_name],
                ['Payment Amount', `$${payment.amount}`],
                ['Bank Name', payment.bank_name],
                ['Account No', payment.account_no],
                ['Branch Name', payment.branch_name],
                ['Status', payment.status],
                ['Created At', new Date(payment.created_at).toLocaleString()],
            ],
            theme: 'grid',
            headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Instructions:', 15, doc.autoTable.previous.finalY + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('- Please ensure timely payment to avoid service disruptions.', 20, doc.autoTable.previous.finalY + 15);
        doc.text('- Use the reference number when making payments.', 20, doc.autoTable.previous.finalY + 20);
        doc.text('- Contact support at info@connexcodeworks.biz for any payment issues.', 20, doc.autoTable.previous.finalY + 25);

        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(0, 0, 0);
        doc.line(15, pageHeight - 25, 195, pageHeight - 25);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('System Generated Document - No Signature Required', 15, pageHeight - 18);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Authorized by Connex Codeworks', 15, pageHeight - 12);

        doc.save(`BillOfPayment_${payment.reference}.pdf`);
    };

    const handleViewPdf = (payment) => {
        if (!payment.bank_slip_pdf) {
            toast.error('No bank slip available.');
            return;
        }

        try {
            let base64 = payment.bank_slip_pdf;
            if (base64.startsWith('data:application/pdf;base64,')) {
                base64 = base64.replace('data:application/pdf;base64,', ''); // Remove prefix if exists
            }

            const binaryString = window.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error viewing PDF:', error);
            toast.error('Failed to view bank slip. Invalid file format.');
        }
    };
    const handleFileUpload = async () => {
        if (!selectedPayment) {
            toast.error('No payment selected.');
            return;
        }
    
        if (!uploadedFile) {
            toast.error('Please select a file to upload.');
            return;
        }
    
        try {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(uploadedFile);
    
            fileReader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    const base64String = arrayBufferToBase64(arrayBuffer);
                    const finalBase64 = `data:application/pdf;base64,${base64String}`;
    
                    // Simulating Progress Bar
                    for (let i = 0; i <= 100; i += 10) {
                        setUploadProgress(i);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
    
                    // **Updating the database**
                    const updateResponse = await updateData(
                        'payment_requests',  // **Table name**
                        { 
                            bank_slip_pdf: finalBase64,  // **Data to update**
                            bank_slip_status: 'Uploaded',
                            updated_at: new Date().toISOString() // Ensure timestamp updates
                        },
                        { id: selectedPayment.id }  // **Where condition**
                    );
    
                    if (updateResponse.success) {
                        // Update UI after successful upload
                        const updatedPayments = payments.map(p =>
                            p.id === selectedPayment.id 
                                ? { ...p, bank_slip_pdf: finalBase64, bank_slip_status: 'Uploaded' }
                                : p
                        );
                        setPayments(updatedPayments);
    
                        toast.success('Bank slip uploaded successfully!');
                        setUploadProgress(100);
                        setUploadedFile(null);
                        setSelectedPayment(null);
                    } else {
                        throw new Error('Database update failed.');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    toast.error('Failed to upload bank slip.');
                    setUploadProgress(0);
                }
            };
        } catch (error) {
            console.error('File Upload Error:', error);
            toast.error('Failed to upload bank slip.');
            setUploadProgress(0);
        }
    };
    


    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setUploadedFile(file);
        } else {
            toast.error('Please select a valid PDF file.');
        }
    };

    return (
        <Box sx={{ padding: 6, backgroundColor: theme.palette.background.default }}>

            <Typography variant="h4" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.primary }}>
                <Payment sx={{ fontSize: 32, color: 'primary.main' }} />
                Payment Page
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                <Button
                    variant="contained"
                    startIcon={<Payment />}
                    onClick={() => setShowPaymentForm(true)}
                    sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                >
                    Payment Request
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {companyDetails && (
                <Card sx={{ mb: 4, boxShadow: 'none', backgroundColor: theme.palette.background.paper }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                            Payment Details
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Company ID</TableCell>
                                        <TableCell>Company Name</TableCell>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Payment Plan</TableCell>
                                        <TableCell>Payment Amount</TableCell>
                                        <TableCell>Bank Name</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Bank Slip Status</TableCell>
                                        <TableCell>Created At</TableCell>
                                        <TableCell>Download Invoice</TableCell>
                                        <TableCell>Upload Bank Slip</TableCell>
                                        <TableCell>View Bank Slip</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payments.map((payment, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{payment.company_id}</TableCell>
                                            <TableCell>{payment.company_name}</TableCell>
                                            <TableCell>{payment.reference}</TableCell>
                                            <TableCell>{payment.plan_name}</TableCell>
                                            <TableCell>${payment.amount}</TableCell>
                                            <TableCell>{payment.bank_name}</TableCell>
                                            <TableCell>
                                                {payment.status === 'Approved' ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CheckCircle sx={{ color: 'success.main' }} />
                                                        <Typography>Approved</Typography>
                                                    </Box>
                                                ) : payment.status === 'Rejected' ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Cancel sx={{ color: 'error.main' }} />
                                                        <Typography>Rejected</Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Payment sx={{ color: 'warning.main' }} />
                                                        <Typography>Pending</Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {payment.bank_slip_status === 'Uploaded' ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CheckCircle sx={{ color: 'success.main' }} />
                                                        <Typography>Uploaded</Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Cancel sx={{ color: 'error.main' }} />
                                                        <Typography>Not Uploaded</Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadInvoice(payment)}
                                                    sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }}
                                                >
                                                    Download
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                {payment.status !== 'Approved' && (
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<CloudUpload />}
                                                        onClick={() => setSelectedPayment(payment)}
                                                        disabled={payment.status === 'Approved'}
                                                        sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }}
                                                    >
                                                        {payment.bank_slip_status === 'Uploaded' ? 'Update Slip' : 'Upload Slip'}
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {payment.bank_slip_status === 'Uploaded' && (
                                                    <IconButton onClick={() => handleViewPdf(payment)}>
                                                        <Visibility sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
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
            )}

            {/* Payment Request Form Dialog */}
            <Dialog open={showPaymentForm} onClose={() => setShowPaymentForm(false)} fullWidth maxWidth="sm">
                <DialogTitle>Payment Request Form</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Company Name"
                                value={companyDetails?.company_name || ''}
                                disabled
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Business sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Company ID"
                                value={companyDetails?.id || ''}
                                disabled
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Business sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Select Plan</InputLabel>
                                <Select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    label="Select Plan"
                                >
                                    {subscriptionPlans.map((plan) => (
                                        <MenuItem key={plan.id} value={plan}>
                                            {plan.name} (${plan.price})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Payment Amount"
                                value={selectedPlan ? selectedPlan.price : ''}
                                disabled
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Payment sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Select Bank</InputLabel>
                                <Select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    label="Select Bank"
                                >
                                    {bankDetails.map((bank) => (
                                        <MenuItem key={bank.id} value={bank}>
                                            {bank.bank_name} ({bank.branch_name})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Reference"
                                value={`${companyDetails?.company_name}_${companyDetails?.id}` || ''}
                                disabled
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccountBalance sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPaymentForm(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Payment />}
                        onClick={handleSubmitPayment}
                        sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main', color: 'white' }}
                    >
                        Submit Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* File Upload Dialog */}
            <Dialog open={!!selectedPayment} onClose={() => setSelectedPayment(null)} fullWidth maxWidth="sm">
                <DialogTitle>Upload Bank Slip</DialogTitle>
                <DialogContent>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        style={{ marginBottom: 16 }}
                    />
                    {uploadedFile && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Selected File: {uploadedFile.name}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedPayment(null)} color="secondary">
                        Cancel
                    </Button>
                    <Box sx={{ textAlign: 'center', my: 2 }}>
                        {uploadProgress > 0 && (
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />
                        )}

                    </Box>

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
}
export default PaymentPage;