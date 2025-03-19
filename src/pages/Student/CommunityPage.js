import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    TextField,
    Button,
    IconButton,
    Paper,
    useTheme,
    Badge,
    InputAdornment,
    Dialog,
    Divider,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Email, Search, People, Refresh, Add } from '@mui/icons-material';
import { selectData, selectDataProfiles, insertData, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Editor } from '@tinymce/tinymce-react'; // TinyMCE Editor

const CommunityPage = () => {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState({});
    const [sortedUsers, setSortedUsers] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [openNewMessageDialog, setOpenNewMessageDialog] = useState(false);
    const [newMessageSubject, setNewMessageSubject] = useState('');
    const [newMessageBody, setNewMessageBody] = useState('');
    const messageBoxRef = useRef(null);

    // Fetch all users and current user details
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                setCurrentUser(userDetails);

                const usersResponse = await selectDataProfiles({ company_id: userDetails.company_id });
                const allUsers = [...usersResponse.data];
                setUsers(allUsers);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to fetch users.', { position: 'top-right' });
            }
        };

        fetchData();
    }, []);

    // Fetch all messages for the current user (both sent and received)
    const fetchMessages = async () => {
        if (!currentUser.id) return;

        try {
            const sentMessages = await selectData('community', { sender_id: currentUser.id });
            const receivedMessages = await selectData('community', { receiver_id: currentUser.id });

            const allMessages = [...sentMessages.data, ...receivedMessages.data];
            const uniqueMessages = Array.from(new Set(allMessages.map((message) => message.id)))
                .map((id) => allMessages.find((message) => message.id === id));

            setMessages(uniqueMessages);

            const userMessages = {};
            uniqueMessages.forEach((message) => {
                const otherUserId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;
                if (!userMessages[otherUserId]) {
                    userMessages[otherUserId] = [];
                }
                userMessages[otherUserId].push(message);
            });

            const sortedUsers = users
                .map((user) => ({
                    ...user,
                    latestMessage: userMessages[user.id]
                        ? userMessages[user.id].reduce((latest, message) => {
                              return message.sent_at > latest.sent_at ? message : latest;
                          })
                        : null,
                }))
                .sort((a, b) => {
                    if (!a.latestMessage && !b.latestMessage) return 0;
                    if (!a.latestMessage) return 1;
                    if (!b.latestMessage) return -1;
                    return new Date(b.latestMessage.sent_at) - new Date(a.latestMessage.sent_at);
                });

            setSortedUsers(sortedUsers);

            const unread = {};
            sortedUsers.forEach((user) => {
                if (userMessages[user.id]) {
                    unread[user.id] = userMessages[user.id].filter(
                        (message) => message.status !== 'viewed' && message.receiver_id === currentUser.id
                    ).length;
                }
            });
            setUnreadMessages(unread);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to fetch messages.', { position: 'top-right' });
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [currentUser, users]);

    // Set up headers for SSE
    const setAuthHeaders = () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        return {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-refresh-token': refreshToken,
            },
            withCredentials: true,
        };
    };

    // Listen for real-time updates using SSE
    useEffect(() => {
        if (!currentUser.id) return;

        const eventSource = new EventSource(
            `http://127.0.0.1:5000/updates?userId=${currentUser.id}`,
            setAuthHeaders()
        );

        eventSource.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);

            setMessages((prevMessages) => {
                const isDuplicate = prevMessages.some((message) => message.id === newMessage.id);
                if (!isDuplicate) {
                    const updatedMessages = [...prevMessages, newMessage];
                    
                    // Update sorted users and unread messages
                    const userMessages = {};
                    updatedMessages.forEach((message) => {
                        const otherUserId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;
                        if (!userMessages[otherUserId]) {
                            userMessages[otherUserId] = [];
                        }
                        userMessages[otherUserId].push(message);
                    });

                    const sortedUsers = users
                        .map((user) => ({
                            ...user,
                            latestMessage: userMessages[user.id]
                                ? userMessages[user.id].reduce((latest, message) => {
                                      return message.sent_at > latest.sent_at ? message : latest;
                                  })
                                : null,
                        }))
                        .sort((a, b) => {
                            if (!a.latestMessage && !b.latestMessage) return 0;
                            if (!a.latestMessage) return 1;
                            if (!b.latestMessage) return -1;
                            return new Date(b.latestMessage.sent_at) - new Date(a.latestMessage.sent_at);
                        });

                    setSortedUsers(sortedUsers);

                    const unread = {};
                    sortedUsers.forEach((user) => {
                        if (userMessages[user.id]) {
                            unread[user.id] = userMessages[user.id].filter(
                                (message) => message.status !== 'viewed' && message.receiver_id === currentUser.id
                            ).length;
                        }
                    });
                    setUnreadMessages(unread);

                    // Show toast notification for new message
                    if (newMessage.receiver_id === currentUser.id && newMessage.status !== 'viewed') {
                        toast.info(`New message from ${newMessage.sender_name}: ${newMessage.subject}`, {
                            position: 'top-right',
                        });
                    }

                    return updatedMessages;
                }
                return prevMessages;
            });
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [currentUser.id, users]);

    // Filter messages for the selected user
    const filteredMessages = selectedUser
        ? messages
              .filter(
                  (message) =>
                      (message.sender_id === currentUser.id && message.receiver_id === selectedUser.id) ||
                      (message.sender_id === selectedUser.id && message.receiver_id === currentUser.id)
              )
              .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at))
        : [];

    // Handle sending a new message
    const handleSendMessage = async () => {
        if (!newMessageSubject.trim() || !newMessageBody.trim() || !selectedUser) {
            toast.error('Please fill in both subject and body.', { position: 'top-right' });
            return;
        }

        try {
            const messageData = {
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                subject: newMessageSubject,
                message: newMessageBody, // TinyMCE content
                status: 'not_viewed',
            };

            await insertData('community', messageData);
            setNewMessageSubject('');
            setNewMessageBody('');
            setOpenNewMessageDialog(false);
            toast.success('Message sent successfully!', { position: 'top-right' });
            fetchMessages(); // Refresh messages after sending to ensure consistency
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message.', { position: 'top-right' });
        }
    };

    // Mark messages as viewed when a user is selected
    useEffect(() => {
        if (selectedUser) {
            setUnreadMessages((prevUnread) => ({
                ...prevUnread,
                [selectedUser.id]: 0,
            }));

            updateData(
                'community',
                { status: 'viewed' },
                { receiver_id: currentUser.id, sender_id: selectedUser.id }
            )
                .then(() => {
                    console.log('Messages marked as viewed');
                })
                .catch((error) => {
                    console.error('Error marking messages as viewed:', error);
                });
        }
    }, [selectedUser, currentUser.id]);

    // Scroll to the bottom of the message box when new messages are added
    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [filteredMessages]);

    // Filter users based on search query
    const filteredUsers = sortedUsers.filter((user) =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check if a message is new (e.g., received within the last 5 minutes)
    const isNewMessage = (sentAt) => {
        const now = new Date();
        const messageTime = new Date(sentAt);
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes in milliseconds
        return messageTime > fiveMinutesAgo && sentAt; // Ensure sentAt is valid
    };

    return (
        <Box
            sx={{
                display: 'flex',
                height: '85vh',
                backgroundColor: theme.palette.mode === 'dark' ? '#1F1F1F' : '#FFFFFF',
                p: 2,
                borderRadius: 4,
            }}
        >
            {/* Left Section: Members List */}
            <Box
                sx={{
                    width: '25%',
                    display: 'flex',
                    flexDirection: 'column',
                    mr: 1,
                    height: '100%',
                    backgroundColor: theme.palette.mode === 'dark' ? '#1F1F1F' : '#FFFFFF',
                }}
            >
                {/* Members Title with Icon */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Members
                    </Typography>
                </Box>

                {/* Search Bar */}
                <TextField
                    fullWidth
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ px: 2, mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: theme.palette.text.secondary }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '20px',
                            backgroundColor: theme.palette.mode === 'dark' ? '#2D2D2D' : '#F1F1F1',
                        },
                    }}
                />

                {/* Members List */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#2D2D2D' : '#F1F1F1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#888',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#777' : '#666',
                        },
                    }}
                >
                    <List sx={{ p: 1 }}>
                        {filteredUsers.map((user) => (
                            <ListItem
                                key={user.id}
                                button
                                onClick={() => setSelectedUser(user)}
                                sx={{
                                    display: user.id === currentUser.id ? 'none' : 'flex', // Hide the current user
                                    cursor: 'pointer',
                                    mb: 1,
                                    borderRadius: '12px',
                                    backgroundColor:
                                        selectedUser?.id === user.id
                                            ? theme.palette.action.selected
                                            : 'transparent',
                                    '&:hover': {
                                        backgroundColor:
                                            user.id === currentUser.id
                                                ? 'transparent'
                                                : theme.palette.action.hover,
                                    },
                                    opacity: user.id === currentUser.id ? 0.7 : 1,
                                    pointerEvents: user.id === currentUser.id ? 'none' : 'auto',
                                }}
                            >
                                <ListItemAvatar>
                                    <Badge
                                        color="error"
                                        badgeContent={unreadMessages[user.id] || 0}
                                        invisible={!unreadMessages[user.id]}
                                    >
                                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.full_name}
                                    secondary={
                                        user.latestMessage
                                            ? user.latestMessage.subject
                                            : 'No messages yet'
                                    }
                                    primaryTypographyProps={{ fontWeight: 'medium' }}
                                    secondaryTypographyProps={{ color: 'text.secondary' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>

            {/* Right Section: Message Box */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header with Selected User Avatar and Buttons */}
                {selectedUser && (
                    <Box
                        sx={{
                            p: 2,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: '64px', // Approximate header height
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {selectedUser.full_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {selectedUser.full_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedUser.email}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={() => setOpenNewMessageDialog(true)}
                                sx={{ borderRadius: '20px' }}
                            >
                                New Message
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<Refresh />}
                                onClick={fetchMessages}
                                sx={{ borderRadius: '20px' }}
                            >
                                Reload
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Message Area */}
                <Box
                    ref={messageBoxRef}
                    sx={{
                        flex: 1,
                        minHeight: 0, // Allow flex to shrink to zero if needed
                        maxHeight: 'calc(85vh - 64px)', // Subtract header height from viewport height
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: 2,
                      
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2, // Consistent spacing between messages
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#2D2D2D' : '#F1F1F1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#555' : '#888',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#777' : '#666',
                        },
                    }}
                >
                    {selectedUser ? (
                        filteredMessages.length > 0 ? (
                            filteredMessages.map((message) => (
                                <Badge
                                    key={message.id}
                                    color="success"
                                    variant="dot"
                                    invisible={
                                        !isNewMessage(message.sent_at) ||
                                        message.status === 'viewed' ||
                                        message.sender_id === currentUser.id
                                    }
                                    sx={{
                                        position: 'relative',
                                        '& .MuiBadge-dot': {
                                            width: 10,
                                            height: 10,
                                            backgroundColor: '#4CAF50', // Green flag
                                            borderRadius: '50%',
                                            boxShadow: 'none', // Slight shadow for visibility
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                        },
                                    }}
                                >
                                    <Paper
                                        sx={{
                                            p: 2,
                                            backgroundColor:
                                                message.sender_id === currentUser.id
                                                    ? theme.palette.mode === 'dark'
                                                        ? '#005C4B'
                                                        : '#E1FEC9'
                                                    : theme.palette.mode === 'dark'
                                                    ? '#2D2D2D'
                                                    : '#FFFFFF',
                                            borderRadius: '12px',
                                            boxShadow: 'none',
                                            border:'0.5px solid rgba(0, 0, 0, 0.25)',
                                            width: '100%', // Ensure full width
                                            position: 'relative', // Ensure Badge positions correctly
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Email sx={{ color: theme.palette.primary.main }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {message.subject}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                                            From: {message.sender_id === currentUser.id ? 'You' : selectedUser.full_name} |{' '}
                                            {new Date(message.sent_at).toLocaleString()}
                                        </Typography>
                                        <Divider sx={{ mb: 1 }} />
                                        <Box
                                            sx={{ color: theme.palette.text.primary }}
                                            dangerouslySetInnerHTML={{ __html: message.message }}
                                        />
                                    </Paper>
                                </Badge>
                            ))
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    No messages found.
                                </Typography>
                            </Box>
                        )
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="h6" color="text.secondary">
                                Please select a member to view messages.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* New Message Dialog */}
            <Dialog
                open={openNewMessageDialog}
                onClose={() => setOpenNewMessageDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ color: theme.palette.primary.main }} />
                    New Message to {selectedUser?.full_name}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Subject"
                        value={newMessageSubject}
                        onChange={(e) => setNewMessageSubject(e.target.value)}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        Body
                    </Typography>
                    <Editor
                        apiKey="pu258hbqcxkxv0lgzxelam5vmcax1y7m1oir2w0ougjnc5di" // Replace with your TinyMCE API key
                        value={newMessageBody}
                        onEditorChange={(content) => setNewMessageBody(content)}
                        init={{
                            height: 400,
                            menubar: true,
                            plugins: [
                                'advlist autolink lists link image charmap print preview anchor',
                                'searchreplace visualblocks code fullscreen',
                                'insertdatetime media table paste code help wordcount',
                            ],
                            toolbar:
                                'undo redo | formatselect | bold italic underline | \
                                alignleft aligncenter alignright alignjustify | \
                                bullist numlist outdent indent | link image | removeformat | code',
                            content_style:
                                'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewMessageDialog(false)}>Cancel</Button>
                    <Button onClick={handleSendMessage} variant="contained" color="primary">
                        Send
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Toast Container for Notifications */}
            <ToastContainer />
        </Box>
    );
};

export default CommunityPage;