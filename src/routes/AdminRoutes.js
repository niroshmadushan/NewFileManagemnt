import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboardLayout from '../pages/admin/AdminDashboardLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboardLayout />}>
        <Route index element={<AdminDashboard />} /> {/* Default /admin */}
      
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
