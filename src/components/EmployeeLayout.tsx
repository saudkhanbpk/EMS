import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar,
  LogOut,
  User,
  ListTodo
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

const EmployeeLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Leave', href: '/leave', icon: Calendar },
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center h-16 px-4 border-b">
              <h1 className="text-xl font-bold text-gray-800">ETAMS</h1>
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
                      ${location.pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'}
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
                <span className="text-sm text-gray-600">{user?.email}</span>
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
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLayout;