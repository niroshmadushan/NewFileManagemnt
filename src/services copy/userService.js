import axios from 'axios';
import { updateData, insertData, selectData } from './dataService';
const BASE_URL = 'http://10.33.73.193:3000/api';


// Insert user information into `userinfo` table
export const insertUserInfo = async (userInfo) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/insert/userinfo`,
      userInfo,
      { withCredentials: true } // Include cookies
    );
    return response.data;
  } catch (error) {
    console.error('Error inserting user info:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to insert user info' };
  }
};

// Get user information
export const getUserInfo = async (tableName) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/select/${tableName}`,
      { withCredentials: true } // Include cookies
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch user info' };
  }
};

// Disable a user by updating their status
export const disableUser = async (userId) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/update/credentials`,
      {
        updates: { status: 'Disabled' },
        where: { id: userId },
      },
      { withCredentials: true } // Include cookies
    );
    return response.data;
  } catch (error) {
    console.error('Error disabling user:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to disable user' };
  }
};

// Get user details using /validate API
export const getUserDetails = async () => {
  try {
    const validateResponse = await axios.get(`${BASE_URL}/validate`, {
      withCredentials: true, // Ensure cookies are sent
    });
    const username = validateResponse.data.user.username; // Extract the username

    const userInfoResponse = await axios.get(`${BASE_URL}/select/user_accounts?email=${username}`, {
      withCredentials: true, // Ensure cookies are sent
    });

    return userInfoResponse.data; // Return the full user data
  } catch (error) {
    console.error('Error fetching user details:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch user details' };
  }
};

// Logout user
export const logout = async () => {
  return await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
};

export const updateApiKey = async (apiKey) => {
  try {
    // Fetch the current user's details to get the username
    const userDetails = await getUserDetails();
    const username = userDetails.data[0]?.email; // Assuming the username is stored in the email field

    if (!username) {
      throw new Error('Unable to fetch username. Please try again.');
    }

    // Check if the user already has an API key in the database
    const existingRecord = await selectData(`apikey?username=${username}`);

    if (existingRecord.data.length > 0) {
      // If the user exists, update the API key
      const updates = { apikey: apiKey, updated_at: new Date().toISOString() };
      const where = { username };
      const result = await updateData('apikey', updates, where);
      return result; // Returns success message or data
    } else {
      // If the user doesn't have an API key, insert a new record
      const newRecord = {
        username,
        apikey: apiKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const result = await insertData('apikey', newRecord);
      return result; // Returns success message or data
    }
  } catch (error) {
    console.error('Error updating or adding API key:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to update or add API key' };
  }
};