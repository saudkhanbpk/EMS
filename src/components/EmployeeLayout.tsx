import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Chatbutton from './chatbtn';
import Chatlayout from './chatlayout';
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
  Banknote,
  Notebook 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { toDate } from 'date-fns';
import Header from './Header';
import TimeTrackerWidget from './TimeTrackerWidget';
import Updateview from './updateview';

const EmployeeLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // //Checking For Session Expiry
  // useEffect(() => {
  //   const checksession = () => {
  //     const sessionsExpiry = localStorage.getItem('sessionExpiresAt');
  //     if (sessionsExpiry && Date.now() >= Number(sessionsExpiry)) {
  //       handleSignOut();
  //     }
  //   }
  //   checksession();
  //   const interval = setInterval(checksession, 4 * 60 * 1000); // Check every 30 seconds
  //   return () => clearInterval(interval);
  // }, [navigate]);




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
    { name: "Salary Breakdown", href: "/salary-breakdown", icon: Banknote },
    { name: "DailyLogs", href: "/Dailylogs", icon: Notebook },
    // { name: "Widget Demo", href: "/widget-demo", icon: Clock }
  ];

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  return (

    <div className="min-h-screen bg-gray-100">
      <Header

        setIsSidebarOpen={setIsSidebarOpen}
        handleSignOut={handleSignOut}
      />
      {/* <div className="flex h-screen"> */}
      <div >
        <div className="min-h-screen bg-gray-100 overflow-hidden ">
          <Updateview />
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
            <div className={`bg-white p-4 shadow-lg
          ${isSmallScreen
                ? isSidebarOpen
                  ? 'translate-x-0'
                  : '-translate-x-full'
                : 'translate-x-0 w-64'
              }`}></div>
            <div
              className={`bg-[#000000] w-64 p-4 z-40 shadow-lg fixed left-0 top-0 bottom-0 transform transition-transform duration-300 ease-in-out
          ${isSmallScreen
                  ? isSidebarOpen
                    ? 'translate-x-0'
                    : '-translate-x-full'
                  : 'translate-x-0'
                }`}
            >
              <div className="flex flex-col h-full overflow-y-scroll sidebar-scroll  ">
                <div className="flex items-center justify-center">
                  <h1 className="text-2xl font-poppins font-bold text-[white] mt-2">TalentSync</h1>
                </div>

                <nav className="flex-1 px-4 py-8 space-y- ">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleScrollToTop}
                        className={`
                      flex items-center px-4 py-4 text-sm rounded-lg
                      ${location.pathname === item.href
                            ? 'bg-[#9A00FF] text-[white]'
                            : 'text-[white] '
                          }
                    `}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* <div className="p-4 border-t">
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
            </div> */}
              </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 overflow-auto transition-all duration-300 ease-in-out
             `}>
              <div className={`w-full ${isSmallScreen && !isSidebarOpen ? "pt-8 px-2" : "sm:p-8"}`}>
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Chatlayout><Chatbutton></Chatbutton></Chatlayout>

      {/* Add TimeTrackerWidget */}
      {/* <TimeTrackerWidget /> */}
    </div>
    // </div>
  );
};

export default EmployeeLayout;