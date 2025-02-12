import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import AdminRoutes from './routes/AdminRoutes';
import Teacher from './routes/Teacher';
import AdminCom from './routes/AdminCom';
import Student from './routes/Student';
import Teammeber from './routes/Teammember'; // Import the TeamMember component
import Login from './pages/Login';

const App = () => {
  const { isAuthenticated, user } = useContext(AuthContext); // Assuming `user` contains user details like role

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />
          {/* Redirect all unauthenticated users to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          {/* Authenticated Routes */}
          {user?.role === 'admin' && <Route path="/admin/*" element={<AdminRoutes />} />}
          {user?.role === 'admin_com' && <Route path="/admin_com/*" element={<AdminCom />} />}
          {user?.role === 'student' && <Route path="/student/*" element={<Student />} />}
          {user?.role === 'teacher' && <Route path="/teacher/*" element={<Teacher />} />}

          {/* Redirect authenticated users to their role-specific dashboard */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  user?.role === 'admin'
                    ? '/admin'
                    : user?.role === 'admin_com'
                      ? '/admin_com'
                      : user?.role === 'student'
                        ? '/student'
                        : '/teacher' // Redirect team_member users to their dashboard
                }
                replace
              />
            }
          />
        </>
      )}
    </Routes>
  );
};

export default App;