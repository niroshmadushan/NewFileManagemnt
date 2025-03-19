import axios from 'axios';
import { logout, getUserDetails } from './userService';
import { initializeWebSocket } from './ws'; // Import WebSocket initialization function

import API_URL from "../api"; // Import the API URL

const BASE_URL = API_URL+'/fmscdb';


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

// Generic insert function
export const insertData = async (tableName, data) => {
  try {
    const requestBody = {
      table: tableName, // Include the table name in the request body
      data: data,       // Include the data to be inserted
    };

    // Make the POST request to the new API endpoint
    const response = await axiosInstance.post('/data/insert', requestBody, setAuthHeaders());

    // Return the response data
    return response.data;
  } catch (error) {
    console.error(`Error inserting data into ${tableName}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Failed to insert data into ${tableName}` };
  }
};

// Generic update function
export const updateData = async (tableName, data, conditions) => {
  try {
    const requestBody = {
      table: tableName, // Include the table name in the request body
      data: data,       // Include the data to be updated
      conditions: conditions, // Include the conditions for the update
    };

    // Make the PUT request to the new API endpoint
    const response = await axiosInstance.put('/data/update', requestBody, setAuthHeaders());

    // Return the response data
    return response.data;
  } catch (error) {
    console.error(`Error updating data in ${tableName}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Failed to update data in ${tableName}` };
  }
};

// Generic select function
export const selectData = async (tableName, conditions = {}) => {
  try {
    const requestBody = {
      table: tableName, // Include the table name in the request body
    };

    if (Object.keys(conditions).length > 0) {
      requestBody.conditions = conditions;
    }

    // Make the POST request to the API endpoint
    const response = await axiosInstance.post('/data/select', requestBody, setAuthHeaders());

    if (!response.data) {
      throw new Error('No data returned from the server');
    }

    // Return the response data in a consistent format
    return {
      success: true,
      data: response.data || [], // Ensure data is always an array
      message: response.data.message || 'Data fetched successfully',
    };
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw {
      success: false,
      error: error.response?.data?.error || `Failed to fetch data from ${tableName}`,
      message: error.response?.data?.message || error.message,
    };
  }
};

export const selectDataProfiles = async (conditions = {}) => {
  try {
    const requestBody = {};

    if (Object.keys(conditions).length > 0) {
      requestBody.conditions = conditions;
    }

    const response = await axiosInstance.post('/data/selectprofiles', requestBody, setAuthHeaders());

    if (!response.data) {
      throw new Error('No data returned from the server');
    }

    return {
      success: true,
      data: response.data || [], // Ensure data is always an array
      message: response.data.message || 'Data fetched successfully',
    };
  } catch (error) {
    console.error(`Error fetching data from profile:`, {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw {
      success: false,
      error: error.response?.data?.error || `Failed to fetch data from profile`,
      message: error.response?.data?.message || error.message,
    };
  }
};

export const selectDataWithWebSocket = async (tableName, conditions = {}, onUpdateCallback) => {
  try {
    const requestBody = {
      table: tableName,
    };

    if (Object.keys(conditions).length > 0) {
      requestBody.conditions = conditions;
    }

    // Fetch initial data using REST
    const response = await axiosInstance.post('/data/select', requestBody, setAuthHeaders());
    const initialData = response.data;

    // Initialize WebSocket to listen for updates
    const websocketUrl = 'ws://10.33.121.162:5000'; // Replace with your WebSocket URL
    initializeWebSocket(websocketUrl, (update) => {
      if (update.table === tableName) {
        console.log('Real-time update for table:', tableName, update);

        // Invoke the callback with the updated data
        onUpdateCallback(update);
      }
    });

    // Return the initial data
    return initialData;
  } catch (error) {
    console.error(`Error fetching data with WebSocket from ${tableName}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Failed to fetch data from ${tableName}` };
  }
};

export const insertDataWithWebSocket = async (tableName, data) => {
  try {
    const requestBody = {
      table: tableName,
      data: data,
    };

    const response = await axiosInstance.post('/data/insert', requestBody, setAuthHeaders());

    // Return the inserted data details
    return response.data;
  } catch (error) {
    console.error(`Error inserting data into ${tableName}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Failed to insert data into ${tableName}` };
  }
};