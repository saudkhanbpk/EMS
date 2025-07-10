import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAuthStore } from '../lib/store';

const RoleBasedRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, loading } = useUser();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Only redirect if we're on the root path and user profile is loaded
    if (location.pathname === '/' && !loading && userProfile && user) {
      const role = userProfile.role?.toLowerCase();
      
      if (role === 'superadmin') {
        console.log('RoleBasedRedirect - Redirecting superadmin to /superadmin');
        navigate('/superadmin', { replace: true });
      } else if (role === 'admin') {
        console.log('RoleBasedRedirect - Redirecting admin to /admin');
        navigate('/admin', { replace: true });
      }
      // For regular employees, stay on the root path
    }
  }, [location.pathname, loading, userProfile, user, navigate]);

  // Show loading while user profile is being fetched
  if (loading && location.pathname === '/') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9A00FF]"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRedirect;
