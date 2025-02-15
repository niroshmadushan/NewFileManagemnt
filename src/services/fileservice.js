import axios from 'axios';
import { logout } from './userService'; // Assuming you have a logout function in userService
import { initializeWebSocket } from './ws'; // Import WebSocket initialization function

const BASE_URL = 'http://localhost:3000/api';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Ensure cookies are sent with requests
});

// Helper function to get and set the new tokens in headers
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

// Axios interceptor for handling 401 responses
axiosInstance.interceptors.response.use(
  (response) => response, // Return the response if it's successful
  async (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized: Logging out user.');
      await logout(); // Call the logout function
      window.location.href = '/app/login'; // Redirect to login page
    }
    return Promise.reject(error); // Reject the promise with the error
  }
);

// Function to upload a file
export const uploadFile = async (file, userId, folderId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('folderId', folderId);

    const response = await axiosInstance.post('/files/upload', formData, setAuthHeaders());

    // Return the response data
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to upload file' };
  }
};

// Function to download a file
export const downloadFile = async (fileId) => {
  try {
    const response = await axiosInstance.get(`/files/download/${fileId}`, {
      responseType: 'blob', // Important for handling binary data
      ...setAuthHeaders(),
    });

    // Create a URL for the file and download it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', response.headers['content-disposition'].split('filename=')[1]);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to download file' };
  }
};

// Function to view a file's details
export const viewFile = async (fileId) => {
  try {
    const response = await axiosInstance.get(`/files/${fileId}`, setAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error viewing file:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to view file' };
  }
};

// Function to fetch files with WebSocket support for real-time updates
export const fetchFilesWithWebSocket = async (conditions = {}, onUpdateCallback) => {
  try {
    const requestBody = {};

    if (Object.keys(conditions).length > 0) {
      requestBody.conditions = conditions;
    }

    // Fetch initial data using REST
    const response = await axiosInstance.post('/files', requestBody, setAuthHeaders());
    const initialData = response.data;

    // Initialize WebSocket to listen for updates
    const websocketUrl = 'ws://10.33.121.162:5000'; // Replace with your WebSocket URL
    initializeWebSocket(websocketUrl, (update) => {
      if (update.table === 'Files') {
        console.log('Real-time update for files:', update);

        // Invoke the callback with the updated data
        onUpdateCallback(update);
      }
    });

    // Return the initial data
    return initialData;
  } catch (error) {
    console.error('Error fetching files with WebSocket:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch files' };
  }
};