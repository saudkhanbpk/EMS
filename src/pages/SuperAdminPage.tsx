import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import SuperAdminSidebar from '../components/SuperAdminSidebar';

const SuperAdminPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/organizations')) {
      setActiveTab('organizations');
    } else if (path.includes('/dashboard')) {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar activeTab={activeTab} />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminPage;
