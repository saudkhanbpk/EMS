
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import EmployeeLayout from './components/EmployeeLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Tasks from './pages/Tasks';
import AdminPage from './pages/AdminPage';
import SoftwareComplaintSection from './components/SoftwareComplaintSection';
import OfficeComplaintSection from './components/OfficeComplaintSection';
import LeaveRequestsAdmin from './pages/LeaveRequestsAdmin';
import { useNavigate } from 'react-router-dom';
import ExtraHours from './pages/ExtraHours2';
import SalaryBreakdown from './components/SalaryBreakdown';



const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};


function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
    setTimeout(() => setLoading(false), 1000); // Simulate async loading
  }, []);

  if (loading) return <div>Loading...</div>; // Prevents flickering on refresh

  return (
    <Router>
      <Routes>
        {/* Public Route: Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Route (Protected) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <AdminPage />
            </PrivateRoute>
          }
        />

        {/* Employee Routes (Protected & Nested under EmployeeLayout) */}
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
          <Route path="software-complaint" element={<SoftwareComplaintSection />} />
          <Route path="office-complaint" element={<OfficeComplaintSection />} />
          <Route path="leaveRequests" element={<LeaveRequestsAdmin />} />
          <Route path="overtime" element={<ExtraHours />} />
          <Route path="salary-breakdown" element={<SalaryBreakdown />} />
        </Route>

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
