import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
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
    IconButton,
    TextField,
} from '@mui/material';
import { Payment, CheckCircle, Cancel, Download, CloudUpload, Visibility } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { selectData, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import API_URL from '../../api';
const PaymentPage = () => {
    const theme = useTheme();
    const apiUrl = API_URL; // ✅ Correct

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const [openRecordDialog, setOpenRecordDialog] = useState(false);
    const [recordDetails, setRecordDetails] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

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

            const paymentsResponse = await selectData('payment_requests');
            const formattedPayments = paymentsResponse.data.map(payment => ({
                ...payment,
                bank_slip_status: payment.bank_slip_status || 'Not Uploaded',
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

    const handleApprovePayment = async () => {
        try {
            const userDetails = await getUserDetails();
            const paymentRecord = {
                payment_request_id: selectedPayment.id,
                company_name: selectedPayment.company_name,
                amount: selectedPayment.amount,
                plan_name: selectedPayment.plan_name,
                recorded_by_user_id: userDetails.id,
                recorded_by_full_name: userDetails.full_name,
                recorded_by_email: userDetails.email,
            };

            await insertData('payment_record', paymentRecord);
            await updateData('payment_requests', { status: 'Approved' }, { id: selectedPayment.id });

            toast.success('Payment approved successfully!');
            fetchData();
        } catch (error) {
            toast.error('Failed to approve payment.');
            console.error('Error approving payment:', error);
        } finally {
            setOpenConfirmDialog(false);
        }
    };

    const handleRejectPayment = async () => {
        try {
            const userDetails = await getUserDetails();
            const paymentRejectRecord = {
                payment_request_id: selectedPayment.id,
                company_name: selectedPayment.company_name,
                amount: selectedPayment.amount,
                plan_name: selectedPayment.plan_name,
                rejected_by_user_id: userDetails.id,
                rejected_by_full_name: userDetails.full_name,
                rejected_by_email: userDetails.email,
                reject_reason: rejectReason,
            };

            await insertData('payment_reject_record', paymentRejectRecord);
            await updateData('payment_requests', { status: 'Rejected' }, { id: selectedPayment.id });

            toast.success('Payment rejected successfully!');
            setOpenRejectDialog(false);
            setOpenConfirmDialog(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to reject payment.');
            console.error('Error rejecting payment:', error);
        }
    };

    const handleViewRecord = async (payment) => {
        try {
            let record;
            if (payment.status === 'Approved') {
                const response = await selectData('payment_record', { payment_request_id: payment.id });
                record = response.data[0];
            } else if (payment.status === 'Rejected') {
                const response = await selectData('payment_reject_record', { payment_request_id: payment.id });
                record = response.data[0];
            }

            setRecordDetails(record);
            setOpenRecordDialog(true);
        } catch (error) {
            toast.error('Failed to fetch record details.');
            console.error('Error fetching record details:', error);
        }
    };

    const handleConfirmAction = () => {
        if (actionType === 'approve') {
            handleApprovePayment();
        } else if (actionType === 'reject') {
            setOpenRejectDialog(true);
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
        doc.text(payment.address || "No Address Provided", 15, 40);
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

    const handleViewPdf = async (payment) => {
        if (!payment.file_link) {
            toast.error('No bank slip available.');
            return;
        }

        try {
            // Fetch the file path from the database or file service

            window.open(`${apiUrl}:3000/uploads/` + getFileNameFromLink(payment.file_link), '_blank')

        } catch (error) {
            console.error('Error viewing PDF:', error);
            toast.error('Failed to view bank slip.');
        }
    };
    const getFileNameFromLink = (link) => {
        const parts = link.split('\\uploads\\');
        return parts.length > 1 ? parts[1] : link.split('/').pop();
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
                        <Payment sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                        Payment Details
                    </Typography>
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
                                    <TableCell>View Bank Slip</TableCell>
                                    <TableCell>Actions</TableCell>
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
                                            {payment.bank_slip_status === 'Uploaded' && (
                                                <IconButton onClick={() => handleViewPdf(payment)}>
                                                    <Visibility sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }} />
                                                </IconButton>
                                            )}
                                        </TableCell>


                                        <TableCell>
                                            {payment.status === 'Pending' && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setActionType('approve');
                                                            setOpenConfirmDialog(true);
                                                        }}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setActionType('reject');
                                                            setOpenConfirmDialog(true);
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {(payment.status === 'Approved' || payment.status === 'Rejected') && (
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleViewRecord(payment)}
                                                >
                                                    View Record
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogContent>
                    <Typography>
                        {actionType === 'approve'
                            ? 'Are you sure you want to approve this payment?'
                            : 'Are you sure you want to reject this payment?'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmAction} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reject Reason Dialog */}
            <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
                <DialogTitle>Reject Payment</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Reject Reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
                    <Button onClick={handleRejectPayment} color="error">Reject</Button>
                </DialogActions>
            </Dialog>

            {/* Record Details Dialog */}
            <Dialog open={openRecordDialog} onClose={() => setOpenRecordDialog(false)}>
                <DialogTitle>{recordDetails ? 'Payment Record Details' : 'Reject Record Details'}</DialogTitle>
                <DialogContent>
                    {recordDetails && (
                        <Box>
                            <Typography><strong>Company Name:</strong> {recordDetails.company_name}</Typography>
                            <Typography><strong>Amount:</strong> ${recordDetails.amount}</Typography>
                            <Typography><strong>Plan Name:</strong> {recordDetails.plan_name}</Typography>
                            {recordDetails.recorded_by_full_name && (
                                <>
                                    <Typography><strong>Recorded By:</strong> {recordDetails.recorded_by_full_name}</Typography>
                                    <Typography><strong>Email:</strong> {recordDetails.recorded_by_email}</Typography>
                                    <Typography><strong>Recorded At:</strong> {new Date(recordDetails.recorded_at).toLocaleString()}</Typography>
                                </>
                            )}
                            {recordDetails.rejected_by_full_name && (
                                <>
                                    <Typography><strong>Rejected By:</strong> {recordDetails.rejected_by_full_name}</Typography>
                                    <Typography><strong>Email:</strong> {recordDetails.rejected_by_email}</Typography>
                                    <Typography><strong>Reject Reason:</strong> {recordDetails.reject_reason}</Typography>
                                    <Typography><strong>Rejected At:</strong> {new Date(recordDetails.rejected_at).toLocaleString()}</Typography>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRecordDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentPage;