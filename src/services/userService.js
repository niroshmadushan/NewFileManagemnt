import axios from 'axios';

const BASE_URL = 'http://192.168.1.17:3000/api';

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

// Function to log out the user
export const logout = async () => {
  try {
    
    // Clear all items in local storage
    localStorage.clear();
    
    // Refresh the page
   

  } catch (error) {
    console.error('Error during logout:', error.message);
    throw new Error('Logout failed');
  }
};

// Function to get user details
export const getUserDetails = async () => {
  try {
    // Validate token and get user ID
    const validateResponse = await axiosInstance.post('/data/validate', {}, setAuthHeaders());
    const userId = validateResponse.data.user.id;

    // Fetch user profile details using user ID
    const response = await axiosInstance.get(`/user/profile/${userId}`, setAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    throw new Error('Failed to fetch user details');
  }
};

// Function to update user password
export const updatePassword = async (userId, oldPassword, newPassword) => {
  if (!userId || !oldPassword || !newPassword) {
    throw new Error('userId, oldPassword, and newPassword are required');
  }

  try {
    const response = await axiosInstance.put('/user/update-password', {
      userId,
      oldPassword,
      newPassword,
    }, setAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error.message);
    throw new Error('Failed to update password');
  }
};

// Function to reset user password
export const resetPassword = async (userId) => {
  if (!userId) {
    throw new Error('userId required');
  }

  try {
    const response = await axiosInstance.post('/user/reset-password', { userId }, setAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error.message);
    throw new Error('Failed to reset password');
  }
};

// Function to update user profile
export const updateUserProfile = async (id, profileData) => {
  if (!id || !profileData) {
    throw new Error('userId and profileData are required');
  }

  try {
    const response = await axiosInstance.put('/user/profile', {
      id,
      ...profileData,
    }, setAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    throw new Error('Failed to update user profile');
  }
};

// Function to update user email
export const updateEmail = async (userId, newEmail) => {
  if (!userId || !newEmail) {
    throw new Error('userId and newEmail are required');
  }

  try {
    const response = await axiosInstance.put('/user/update-email', {
      userId,
      newEmail,
    }, setAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating email:', error.message);
    throw new Error('Failed to update email');
  }
};