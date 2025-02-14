import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserDashboardLayout from '../pages/Administration/UserDashboardLayout';
import UserDashboard from '../pages/Administration/UserDashboard';

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