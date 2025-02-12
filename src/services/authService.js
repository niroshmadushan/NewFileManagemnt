import axios from 'axios';
import { logout, getUserDetails } from './userService';

const BASE_URL = 'http://172.20.10.2:3000/api';

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

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Ensure cookies are sent with requests
});

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

// Login function
export const login = async (email, password) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      { email, password },
      { withCredentials: true }
    );

    const { accessToken, refreshToken } = response.data;

    // Store tokens in localStorage (or sessionStorage if preferred)
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Login failed' };
  }
};

// Validate token
export const validateToken = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/data/validate`,
      {},
      setAuthHeaders() // Use the helper function to set headers
    );

    if (response.data?.message === 'Token is valid') {
      return response.data;
    } else {
      await handleInvalidToken();
      throw new Error('Invalid token data');
    }
  } catch (error) {
    await handleInvalidToken();
    throw error.response?.data || { error: 'Token validation failed' };
  }
};

// Function to handle invalid token scenarios
const handleInvalidToken = async () => {
  try {
    await logout();
    localStorage.clear();
    // window.location.href = '/app/login';
  } catch (logoutError) {
    console.error('Error during logout:', logoutError.message);
  }
};

// Create a new user
export const createUser = async (userData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/register`,
      userData,
      setAuthHeaders() // Use the helper function to set headers
    );
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error.response?.data || { error: 'User creation failed' };
  }
};

// Change password
export const changePassword = async (oldPassword, newPassword) => {
  try {
    const userDetails = await getUserDetails();
    const id = userDetails.id;

    if (!id) {
      throw new Error('Unable to fetch user ID. Please try again.');
    }

    const response = await axios.put(
      `${BASE_URL}/auth/updatepass`,
      { id, oldPassword, newPassword },
      setAuthHeaders() // Use the helper function to set headers
    );

    return response.data;
  } catch (error) {
    console.error('Error changing password:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Password update failed' };
  }
};

// Change username
export const changeUsername = async (newUsername) => {
  try {
    const userDetails = await getUserDetails();
    const oldUsername = userDetails.username;

    if (!oldUsername) {
      throw new Error('Unable to fetch old username. Please try again.');
    }

    const response = await axios.put(
      `${BASE_URL}/auth/updateuser`,
      { oldUsername, newUsername },
      setAuthHeaders() // Use the helper function to set headers
    );

    return response.data;
  } catch (error) {
    console.error('Error changing username:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Username update failed' };
  }
};

// Create a new user service
export const createNewUser = async (userData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/create-user`,
      userData,
      setAuthHeaders() // Use the helper function to set headers
    );

    return response.data;
  } catch (error) {
    console.error('Error creating new user:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create new user' };
  }
};

// Update user status
export const updateUserStatus = async (username, status) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/auth/updatestatus`,
      { username, status },
      setAuthHeaders() // Use the helper function to set headers
    );

    return response.data;
  } catch (error) {
    console.error('Error updating user status:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to update user status' };
  }
};