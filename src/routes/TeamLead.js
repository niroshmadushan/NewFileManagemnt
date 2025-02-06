import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserDashboardLayout from '../pages/TeamLead/UserDashboardLayout';
import UserDashboard from '../pages/TeamLead/UserDashboard';

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