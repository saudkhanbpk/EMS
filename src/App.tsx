import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import EmployeeLayout from './components/EmployeeLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Tasks from './pages/Tasks';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Employee Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <EmployeeLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leave" element={<Leave />} />
          <Route path="tasks" element={<Tasks />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;