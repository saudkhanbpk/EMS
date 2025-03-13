import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  LogOut,
  User,
  ListTodo,
  CloudCog,
  Building2,
  Menu,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { toDate } from 'date-fns';

const EmployeeLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//Checking For Session Expiry 
  useEffect(() => {
    const checksession = () => {
      const sessionsExpiry = localStorage.getItem('sessionExpiresAt');
      if (sessionsExpiry && Date.now() >= Number(sessionsExpiry)) {
        handleSignOut();
      }
    }
    checksession();
    const interval = setInterval(checksession, 4 * 60 * 1000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [navigate]);
  



  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 795);
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  
  // Close sidebar on small screens when route changes
  useEffect(() => {
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isSmallScreen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.clear();
    navigate('/login');
  };



  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Over Time', href: '/overtime', icon: Clock },
    { name: 'Leave', href: '/leave', icon: Calendar },
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Software Complaint', href: '/software-complaint', icon: CloudCog },
    { name: 'Office Complaint', href: '/office-complaint', icon: Building2 },
  ];

  return (
    <div >
      <div className="min-h-screen bg-gray-100 overflow-hidden">
      <div className='w-full overflow-hidden bg-[#a36fd4] py-2 flex items-center'>
  <p className='text-lg font-[400] text-white animate-marquee whitespace-nowrap'>
  📢 Alert! Office Timing Update ⏰ Please note that our official office hours are from 9:00 AM to 4:00 PM.
  Break time is scheduled from 1:00 PM to 1:30 PM.
  </p>
</div>
      <div className="flex ">
        
        {/* Sidebar Toggle Button (Only for Small Screens) */}
        {isSmallScreen && (
          <button
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-md rounded-md"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            <Menu size={24} />
          </button>
        )}

        {/* Overlay (Only for Small Screens when Sidebar is Open) */}
        {isSmallScreen && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-white bg-opacity-50 lg:hidden z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div  className={`bg-white p-4 shadow-lg
          ${
            isSmallScreen
              ? isSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'
              : 'translate-x-0 w-64'
          }`}></div>
        <div
          className={`bg-white w-64 p-4 shadow-lg fixed left-0 top-0 bottom-0 transform transition-transform duration-300 ease-in-out z-50
          ${
            isSmallScreen
              ? isSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'
              : 'translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center h-16 px-4 border-b">
              <h1 className="text-xl font-bold text-gray-800">TalentSync</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-4 py-2 text-sm rounded-lg
                      ${
                        location.pathname === item.href
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 mr-3 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {JSON.parse(localStorage.getItem('supabaseSession')).user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
       <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out
             `}>
          <div className={`w-full ${isSmallScreen && !isSidebarOpen ? "pt-8 px-2" : "p-8"}`}>
            <Outlet isSmallScreen={isSmallScreen } isSidebarOpen={isSidebarOpen} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EmployeeLayout;