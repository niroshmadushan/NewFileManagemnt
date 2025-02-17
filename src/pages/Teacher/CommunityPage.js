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
    Slide,
} from '@mui/material';
import { Send, EmojiEmotions, Search, People } from '@mui/icons-material';
import { selectData, insertData, selectDataProfiles, updateData } from '../../services/dataService';
import { getUserDetails } from '../../services/userService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Picker from 'emoji-picker-react'; // Emoji picker library

const CommunityPage = () => {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState({});
    const [sortedUsers, setSortedUsers] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messageBoxRef = useRef(null);
    const apiUrl = process.env.REACT_APP_MAIN_API; // ✅ Correct
    // Fetch all users and current user details
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDetails = await getUserDetails();
                setCurrentUser(userDetails);

                const usersResponse = await selectDataProfiles();
                const allUsers = [...usersResponse.data];
                setUsers(allUsers);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // Fetch all messages for the current user (both sent and received)
    useEffect(() => {
        if (!currentUser.id) return;

        const fetchMessages = async () => {
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
            }
        };

        fetchMessages();
    }, [currentUser, users]);

    // Listen for real-time updates using SSE
    useEffect(() => {
        if (!currentUser.id) return;

        const eventSource = new EventSource(
            `http://192.168.12.50:5000/updates?userId=${currentUser.id}&accessToken=${accessToken}&refreshToken=${refreshToken}`,
            {
                withCredentials: true, // Include credentials (cookies)
            }
        );  

        eventSource.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);

            setMessages((prevMessages) => {
                const isDuplicate = prevMessages.some((message) => message.id === newMessage.id);
                if (!isDuplicate) {
                    return [...prevMessages, newMessage];
                }
                return prevMessages;
            });

            if (newMessage.receiver_id === currentUser.id && newMessage.status !== 'viewed') {
                setUnreadMessages((prevUnread) => ({
                    ...prevUnread,
                    [newMessage.sender_id]: (prevUnread[newMessage.sender_id] || 0) + 1,
                }));

                if (Notification.permission === 'granted') {
                    new Notification(`New message from ${newMessage.sender_name}`, {
                        body: newMessage.message,
                    });
                }
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [currentUser.id]);

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
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const messageData = {
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                message: newMessage,
                status: 'not_viewed',
            };

            await insertData('community', messageData);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
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

    // Handle emoji selection
    const handleEmojiClick = (emojiObject) => {
        setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    // Filter users based on search query
    const filteredUsers = sortedUsers.filter((user) =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', height: '85vh', backgroundColor: theme.palette.mode === 'dark' ? '#1F1F1F' : '#FFFFFF', p: 2, borderRadius: 4 }}>
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

                                    cursor:'pointer',
                                    mb: 1,
                                    borderRadius: '12px',
                                    backgroundColor: selectedUser?.id === user.id ? theme.palette.action.selected : 'transparent',
                                    '&:hover': {
                                        backgroundColor: user.id === currentUser.id ? 'transparent' : theme.palette.action.hover,
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
                                            ? user.latestMessage.message
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
                {/* Header with Selected User Avatar */}
                {selectedUser && (
                    <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                )}

                {/* Message Area */}
                <Box
                    ref={messageBoxRef}
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        p: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#F5F5F5',
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
                        filteredMessages.map((message) => (
                            <Slide
                                key={message.id}
                                direction={message.sender_id === currentUser.id ? 'left' : 'right'}
                                in={true}
                                mountOnEnter
                                unmountOnExit
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: message.sender_id === currentUser.id ? 'flex-end' : 'flex-start',
                                        mb: 2,
                                    }}
                                >
                                    <Paper
                                        sx={{
                                            p: 2,
                                            maxWidth: '70%',
                                            backgroundColor:
                                                message.sender_id === currentUser.id
                                                    ? theme.palette.mode === 'dark' ? '#005C4B' : '#25D366'
                                                    : theme.palette.mode === 'dark' ? '#2D2D2D' : '#ECE5DD',
                                            color:
                                                message.sender_id === currentUser.id
                                                    ? theme.palette.common.white
                                                    : theme.palette.text.primary,
                                            borderRadius: '12px',
                                            boxShadow: 'none',
                                        }}
                                    >
                                        <Typography variant="body1">{message.message}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                                            {new Date(message.sent_at).toLocaleTimeString()}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Slide>
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
                                Please select a member to start chatting.
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Input Area with Emoji Picker */}
                {selectedUser && (
                    <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ position: 'relative' }}>
                            {showEmojiPicker && (
                                <Box sx={{ position: 'absolute', bottom: '60px', right: '0', zIndex: 1 }}>
                                    <Picker onEmojiClick={handleEmojiClick} />
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    sx={{ flex: 1 }}
                                    InputProps={{
                                        sx: {
                                            borderRadius: '20px',
                                            backgroundColor: theme.palette.mode === 'dark' ? '#2D2D2D' : '#F1F1F1',
                                        },
                                    }}
                                />
                                <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                    <EmojiEmotions />
                                </IconButton>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    sx={{ borderRadius: '20px' }}
                                >
                                    <Send />
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Toast Container for In-App Notifications */}
            <ToastContainer />
        </Box>
    );
};

export default CommunityPage;