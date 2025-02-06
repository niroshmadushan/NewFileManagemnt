import React from 'react';
import ReactDOM from 'react-dom/client'; // Import createRoot from react-dom/client
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter for routing
import App from './App';
import AuthContextProvider from './context/AuthContext';
import ThemeContextProvider from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root')); // Use createRoot
root.render(
  <Router>
    <ThemeContextProvider>
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    </ThemeContextProvider>
  </Router>
);
