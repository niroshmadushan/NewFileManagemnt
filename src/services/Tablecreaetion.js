import axios from 'axios';

const BASE_URL = 'http://192.168.12.50:3000/api';

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
      console.error('Unauthorized: Please log in again.');
    }
    return Promise.reject(error); // Reject the promise with the error
  }
);

/**
 * Service to create a table dynamically.
 * @param {string} tableName - Name of the table to create.
 * @param {Array} columns - Array of column definitions. Each column should be an object containing:
 *    - name: Column name.
 *    - type: Data type (e.g., VARCHAR(255), INT).
 *    - primaryKey: (optional) Boolean indicating if the column is a primary key.
 *    - notNull: (optional) Boolean indicating if the column should be NOT NULL.
 *    - autoIncrement: (optional) Boolean indicating if the column should auto increment.
 * @returns {Promise<Object>} - API response data.
 */
export const createTable = async (tableName, columns) => {
  try {
    // Validate input
    if (!tableName || !Array.isArray(columns) || columns.length === 0) {
      throw new Error('Table name and valid column definitions are required.');
    }

    // Send request to create table
    const response = await axiosInstance.post('/newtable', {
      tableName,
      columns,
    });

    console.log('Table creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating table:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to create table' };
  }
};

export const getTableColumns = async (tableName) => {
  try {
    const response = await axiosInstance.post('/gettablecolumn', { tableName });
    return response.data.columns; // Assuming the API returns { columns: [...] }
  } catch (error) {
    console.error(`Error fetching columns from ${tableName}:`, error.response?.data || error.message);
    throw error.response?.data || { error: `Failed to fetch columns from ${tableName}` };
  }
};

export const renameTableColumn = async (tableName, oldColumnName, newColumnName) => {
  try {
    // Validate input
    if (!tableName || !oldColumnName || !newColumnName) {
      throw new Error('Table name, old column name, and new column name are required.');
    }

    // Send request to rename the column
    const response = await axiosInstance.post('/renametablecolumn', {
      tableName,
      oldColumnName,
      newColumnName,
    });

    console.log('Column rename response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error renaming column:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to rename column' };
  }
};