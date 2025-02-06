import React, { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import for checking the current path
import { login, validateToken } from '../services/authService';

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds user information
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Tracks authentication status
  const [loading, setLoading] = useState(true); // Tracks loading state for session validation
  const location = useLocation(); // Get current path

  // Function to log in a user
  const handleLogin = async (username, password) => {
    try {
      const userData = await login(username, password);
      setUser({ username: userData.username, role: userData.role });
      setIsAuthenticated(true);

      // Save user role and username in localStorage for routing and session handling
      localStorage.setItem(
        'user',
        JSON.stringify({ username: userData.username, role: userData.role })
      );
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  };

  // Function to log out a user

  // Function to validate the user's session
  const validateSession = async () => {
    if (location.pathname === '/login') {
      setLoading(false); // Skip validation on the login page
      return;
    }

    try {
      const data = await validateToken();
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      console.error('Session validation failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Validate the session on app load
  useEffect(() => {
    validateSession();
  }, [location.pathname]); // Re-run validation when the path changes

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        handleLogin,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
