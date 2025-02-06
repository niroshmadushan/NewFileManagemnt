import axios from 'axios';
import { logout,getUserDetails } from './userService';

const BASE_URL = 'http://10.33.73.193:3000/api';

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
      
    }
    return Promise.reject(error); // Reject the promise with the error
  }
);

// Generic insert function
export const insertData = async (tableName, data) => {
  try {
    // Prepare the request body according to the new API specification
    const requestBody = {
      table: tableName, // Include the table name in the request body
      data: data,       // Include the data to be inserted
    };

    // Make the POST request to the new API endpoint
    const response = await axiosInstance.post('/api/data/insert', requestBody);

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
    // Prepare the request body according to the new API specification
    const requestBody = {
      table: tableName, // Include the table name in the request body
      data: data,       // Include the data to be updated
      conditions: conditions, // Include the conditions for the update
    };

    // Make the POST request to the new API endpoint
    const response = await axiosInstance.post('/api/data/update', requestBody);

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
    // Prepare the request body according to the new API specification
    const requestBody = {
      table: tableName, // Include the table name in the request body
    };

    // Add conditions to the request body if provided
    if (Object.keys(conditions).length > 0) {
      requestBody.conditions = conditions;
    }

    // Make the POST request to the new API endpoint
    const response = await axiosInstance.post('/api/data/select', requestBody);

    // Return the response data
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Failed to fetch data from ${tableName}` };
  }
};