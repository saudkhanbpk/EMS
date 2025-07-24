import React, { useEffect, useState } from 'react';
import {
  Construction,
  Shield,
  Building2,
  Users,
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
// Adjust the import path based on your project structure

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email?: string;
  created_at?: string;
  // Add other user fields as needed
}

const SuperAdminDashboard: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      setOrganizations(orgsData || []);
      setUsers(usersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeOrganizations = organizations.filter(org => org.is_active);
  const systemHealth = organizations.length > 0 ? 'Good' : 'N/A';

  // Skeleton component for loading state
  const StatSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-gray-300 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-400 rounded w-24"></div>
            <div className="h-8 bg-gray-400 rounded w-16"></div>
          </div>
          <div className="h-6 w-6 bg-gray-400 rounded"></div>
        </div>
      </div>
    </div>
  );

  const ContentSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
    </div>
  );

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

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Under Development Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">


          {/* Coming Soon Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <TrendingUp className="text-[#9A00FF]" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              {loading ? (
                <ContentSkeleton />
              ) : (
                <p className="text-sm text-gray-600">
                  System-wide performance metrics and usage statistics
                </p>
              )}
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <Building2 className="text-[#9A00FF]" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Organization Insights</h3>
              {loading ? (
                <ContentSkeleton />
              ) : (
                <p className="text-sm text-gray-600">
                  Detailed analytics for each organization and their activities
                </p>
              )}
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <Settings className="text-[#9A00FF]" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">System Settings</h3>
              {loading ? (
                <ContentSkeleton />
              ) : (
                <p className="text-sm text-gray-600">
                  Global configuration and system-wide preferences
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {loading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <div className="bg-[#9A00FF] text-white p-4 rounded-lg transform transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">Total Organizations</p>
                      <p className="text-2xl font-bold">{organizations.length}</p>
                    </div>
                    <Building2 size={24} />
                  </div>
                </div>

                <div className="bg-blue-500 text-white p-4 rounded-lg transform transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm">Total Users</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                    <Users size={24} />
                  </div>
                </div>

                <div className="bg-green-500 text-white p-4 rounded-lg transform transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-200 text-sm">Active Organizations</p>
                      <p className="text-2xl font-bold">{activeOrganizations.length}</p>
                    </div>
                    <Activity size={24} />
                  </div>
                </div>

                <div className="bg-orange-500 text-white p-4 rounded-lg transform transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-200 text-sm">System Health</p>
                      <p className="text-2xl font-bold">{systemHealth}</p>
                    </div>
                    <Shield size={24} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Organizations Section */}
          {!loading && organizations.length > 0 && (
            <div className="mt-12 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Organizations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.slice(0, 3).map((org) => (
                  <div key={org.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900">{org.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">@{org.slug}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${org.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}>
                        {org.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;