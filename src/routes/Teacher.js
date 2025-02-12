import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserDashboardLayout from '../pages/Teacher/UserDashboardLayout';
import UserDashboard from '../pages/Teacher/UserDashboard';

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<UserDashboardLayout />}>
        <Route index element={<UserDashboard />} /> {/* Default /admin */}
      
        
      </Route>
    </Routes>
  );
};

export default UserRoutes;