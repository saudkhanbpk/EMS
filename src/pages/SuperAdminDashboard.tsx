import React from 'react';
import { 
  Construction, 
  Shield, 
  Building2, 
  Users, 
  Settings,
  TrendingUp
} from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="text-[#9A00FF]" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage organizations and system-wide settings</p>
        </div>

        {/* Under Development Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-100 rounded-full">
              <Construction className="text-yellow-600" size={48} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Dashboard Under Development
          </h2>
          
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We're working hard to bring you comprehensive analytics and management tools. 
            This dashboard will soon include system metrics, organization insights, and more.
          </p>

          {/* Coming Soon Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <TrendingUp className="text-[#9A00FF]" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">
                System-wide performance metrics and usage statistics
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <Building2 className="text-[#9A00FF]" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Organization Insights</h3>
              <p className="text-sm text-gray-600">
                Detailed analytics for each organization and their activities
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <Settings className="text-[#9A00FF]" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">System Settings</h3>
              <p className="text-sm text-gray-600">
                Global configuration and system-wide preferences
              </p>
            </div>
          </div>

          {/* Quick Stats Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-[#9A00FF] text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Organizations</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <Building2 size={24} />
              </div>
            </div>

            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <Users size={24} />
              </div>
            </div>

            <div className="bg-green-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Active Organizations</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-orange-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">System Health</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <Shield size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
