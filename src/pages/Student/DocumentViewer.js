import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { Close } from '@mui/icons-material';

const DocumentViewer = ({ docLink, qrCodeUrl, onClose }) => {
    const apiUrl = process.env.REACT_APP_MAIN_API; // ✅ Correct
    return (
        <Box sx={{ position: 'relative', height: '100vh', width: '100vw', backgroundColor: '#fff' }}>
            <IconButton 
                onClick={onClose} 
                sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, backgroundColor: '#fff' }}
            >
                <Close />
            </IconButton>
            <iframe
                src={`${apiUrl}:3000/uploads/${docLink}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Document Viewer"
            />
            <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}>
                <QRCodeSVG value={qrCodeUrl} size={100} />
            </Box>
        </Box>
    );
};

export default DocumentViewer;