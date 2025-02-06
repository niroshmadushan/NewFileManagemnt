import axios from 'axios';
import { logout,getUserDetails } from './userService';
const BASE_URL = 'http://10.33.73.193:3000/api';

// Login function
export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      { username, password },
      { withCredentials: true } // Ensures cookies are sent/received
    );
    return response.data; // Returns the API response with message, role, and username
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Login failed' };
  }
};

// Validate token


export const validateToken = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/validate`, {
      withCredentials: true, // Include cookies
    });

    // Check if the response status is 200 and contains the expected data structure
    if (
      response.data?.message === 'Token is valid' &&
      response.data?.user?.username
    ) {
      return response.data; // Token validation successful
    } else {
      console.warn('Invalid token data. Logging out...');
      await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
      throw new Error('Invalid token data');
    }
  } catch (error) {
    console.error('Error validating token:', error.response?.data || error.message);
    await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true }); // Logout on error
    throw error.response?.data || { error: 'Token validation failed' };
  }
};

// Function to handle invalid token scenarios
const handleInvalidToken = async () => {
  try {
    await logout(); // Log out the user
    localStorage.clear(); // Clear stored user data
    
    window.location.href = '/login'; // Redirect to login page
  } catch (logoutError) {
    console.error('Error during logout:', logoutError.message);
  }
};


// Create a new user
export const createUser = async (userData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/register`,
      userData,
      { withCredentials: true } // Include cookies
    );
    return response.data; // Returns success message
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error.response?.data || { error: 'User creation failed' };
  }
};
// Change password
export const changePassword = async (oldPassword, newPassword) => {
  try {
    // Fetch current user details to get the username
    const userDetails = await getUserDetails();
    const username = userDetails.data[0]?.email;

    if (!username) {
      throw new Error('Unable to fetch username. Please try again.');
    }

    // Send the update password request
    const response = await axios.put(
      `${BASE_URL}/auth/updatepass`,
      { username, oldPassword, newPassword }, // Include the username in the payload
      { withCredentials: true } // Include cookies
    );

    return response.data; // Returns success message
  } catch (error) {
    console.error('Error changing password:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Password update failed' };
  }
};


// Change username
export const changeUsername = async (newUsername) => {
  try {
    // Fetch current user details to get the old username
    const userDetails = await getUserDetails();
    const oldUsername = userDetails.data[0]?.username;

    if (!oldUsername) {
      throw new Error('Unable to fetch old username. Please try again.');
    }

    // Send the update username request
    const response = await axios.put(
      `${BASE_URL}/auth/updateuser`,
      { oldUsername, newUsername }, // Include both old and new usernames in the payload
      { withCredentials: true } // Include cookies
    );

    return response.data; // Returns success message
  } catch (error) {
    console.error('Error changing username:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Username update failed' };
  }
};

export const changeUsernameusers = async (newUsername,Oldusername) => {
  try {
    // Fetch current user details to get the old username
    
    const oldUsername = Oldusername;

    if (!oldUsername) {
      throw new Error('Unable to fetch old username. Please try again.');
    }

    // Send the update username request
    const response = await axios.put(
      `${BASE_URL}/auth/updateuser`,
      { oldUsername, newUsername }, // Include both old and new usernames in the payload
      { withCredentials: true } // Include cookies
    );

    return response.data; // Returns success message
  } catch (error) {
    console.error('Error changing username:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Username update failed' };
  }
};
// Create a new user service

export const createNewUser = async (userData) => {
  try {

    console.log(userData)
    const response = await axios.post(
      `${BASE_URL}/auth/create-user`,
      userData,
      { withCredentials: true } // Include cookies for authentication
    );

    return response.data; // Return success message or data
  } catch (error) {
    console.error('Error creating new user:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create new user' };
  }
};

// Update user status
export const updateUserStatus = async (username, status) => {
  try {
    // Send the update status request
    const response = await axios.put(
      `${BASE_URL}/auth/updatestatus`,
      { username, status }, // Include username and status in the payload
      { withCredentials: true } // Include cookies for authentication
    );

    return response.data; // Returns success message or data
  } catch (error) {
    console.error('Error updating user status:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to update user status' };
  }
};

