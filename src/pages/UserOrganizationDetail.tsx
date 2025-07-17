import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  ArrowLeft,
  Building2,
  Users,
  FolderOpen,
  Plus,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  User,
  Settings
} from 'lucide-react';

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
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  organization_id: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  devops: string[];
  type: string;
  created_by: string;
  product_owner: string;
  organization_id: string;
}

const UserOrganizationDetail: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    full_name: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    adminUsers: 0
  });

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationData();
    }
  }, [organizationId]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at, organization_id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, description, start_date, end_date, created_at, devops, type, created_by, product_owner, organization_id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const totalProjects = projectsData?.length || 0;
      const activeProjects = projectsData?.filter(p =>
        new Date(p.end_date) > new Date() || !p.end_date
      ).length || 0;
      const adminUsers = usersData?.filter(u => u.role === 'admin').length || 0;

      setStats({
        totalUsers,
        totalProjects,
        activeProjects,
        adminUsers
      });

    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError('Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email.trim() || !newAdmin.full_name.trim() || !newAdmin.password.trim()) {
      setError('All fields are required');
      return;
    }

    // Check if admin already exists
    if (users.some(user => user.role === 'admin')) {
      setError('An admin user already exists for this organization');
      return;
    }

    try {
      setIsCreatingAdmin(true);
      setError(null);

      // Create user with Supabase Admin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newAdmin.email.trim(),
        password: newAdmin.password,
        email_confirm: true,
        user_metadata: {
          full_name: newAdmin.full_name.trim()
        }
      });

      if (authError) throw authError;

      // Check if user already exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      // Only insert if user doesn't exist
      if (!existingUser) {
        // Insert user into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: newAdmin.email.trim(),
            full_name: newAdmin.full_name.trim(),
            role: 'admin',
            organization_id: organizationId
          }]);

        if (insertError) throw insertError;
      } else {
        const { error: updateerror } = await supabase
          .from('users')
          .update([{

            email: newAdmin.email.trim(),
            full_name: newAdmin.full_name.trim(),
            role: 'admin',
            organization_id: organizationId
          }])
          .eq('id', authData.user.id);


        if (updateerror) throw updateerror;
      }

      // Refresh users list
      await fetchOrganizationData();

      setSuccess('Admin user created successfully!');
      setShowAddAdminModal(false);
      setNewAdmin({ email: '', full_name: '', password: '' });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error creating admin:', err);
      if (err.message?.includes('already registered')) {
        setError('User with this email already exists');
      } else {
        setError('Failed to create admin user');
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'developer':
        return 'bg-green-100 text-green-800';
      case 'client':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9A00FF]"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization not found</h2>
          <button
            onClick={() => navigate('/user')}
            className="text-[#9A00FF] hover:underline"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/user')}
            className="flex items-center text-gray-600 hover:text-[#9A00FF] mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Organizations
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#9A00FF] rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600">@{organization.slug}</p>
                <p className="text-gray-500 mt-2">{organization.description || 'No description provided'}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm ${organization.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </span>
                <p className="text-gray-500 text-sm mt-2">
                  Created {formatDate(organization.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={20} />
            <span className="text-green-700">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                  ? 'border-[#9A00FF] text-[#9A00FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Settings className="inline mr-2" size={16} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                  ? 'border-[#9A00FF] text-[#9A00FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Users className="inline mr-2" size={16} />
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'projects'
                  ? 'border-[#9A00FF] text-[#9A00FF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FolderOpen className="inline mr-2" size={16} />
                Projects ({projects.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Organization Overview</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Total Users</p>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      </div>
                      <Users className="text-purple-200" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Projects</p>
                        <p className="text-3xl font-bold">{stats.totalProjects}</p>
                      </div>
                      <FolderOpen className="text-blue-200" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Active Projects</p>
                        <p className="text-3xl font-bold">{stats.activeProjects}</p>
                      </div>
                      <CheckCircle className="text-green-200" size={32} />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Admin Users</p>
                        <p className="text-3xl font-bold">{stats.adminUsers}</p>
                      </div>
                      <Shield className="text-orange-200" size={32} />
                    </div>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{organization.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Slug:</span>
                        <span className="font-medium">@{organization.slug}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${organization.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {organization.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDate(organization.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab('users')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <Users className="text-gray-500 mr-3" size={20} />
                          <span>Manage Users</span>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('projects')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <FolderOpen className="text-gray-500 mr-3" size={20} />
                          <span>View Projects</span>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>

                      <button
                        onClick={() => setShowAddAdminModal(true)}
                        disabled={users.some(user => user.role === 'admin')}
                        className={`w-full flex items-center justify-between p-3 ${users.some(user => user.role === 'admin') ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#9A00FF] hover:bg-purple-700'} text-white rounded-lg transition-colors`}
                        title={users.some(user => user.role === 'admin') ? 'Admin already exists' : 'Add Admin User'}
                      >
                        <div className="flex items-center">
                          <Plus className="mr-3" size={20} />
                          <span>Add Admin User</span>
                        </div>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      {users.slice(0, 3).map((user) => (
                        <div key={user.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="text-gray-600" size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{user.full_name}</span> joined as {user.role}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(user.created_at)}</p>
                          </div>
                        </div>
                      ))}

                      {projects.slice(0, 2).map((project) => (
                        <div key={project.id} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FolderOpen className="text-blue-600" size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              Project <span className="font-medium">{project.title}</span> was created
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(project.created_at)}</p>
                          </div>
                        </div>
                      ))}

                      {users.length === 0 && projects.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Organization Users</h2>
                  <button
                    onClick={() => setShowAddAdminModal(true)}
                    disabled={users.some(user => user.role === 'admin')}
                    className={`${users.some(user => user.role === 'admin') ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#9A00FF] hover:bg-purple-700'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                    title={users.some(user => user.role === 'admin') ? 'Admin already exists' : 'Add Admin'}
                  >
                    <Plus size={16} />
                    <span>Add Admin</span>
                  </button>
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500 mb-4">Add the first admin user to get started</p>
                    <button
                      onClick={() => setShowAddAdminModal(true)}
                      disabled={users.some(user => user.role === 'admin')}
                      className={`${users.some(user => user.role === 'admin') ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#9A00FF] hover:bg-purple-700'} text-white px-4 py-2 rounded-lg transition-colors`}
                      title={users.some(user => user.role === 'admin') ? 'Admin already exists' : 'Add Admin'}
                    >
                      Add Admin
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="text-gray-500" size={20} />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.full_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Mail className="text-gray-400 mr-2" size={16} />
                                <span className="text-sm text-gray-900">{user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                <Shield className="inline mr-1" size={12} />
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="text-gray-400 mr-2" size={16} />
                                {formatDate(user.created_at)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Organization Projects</h2>

                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500">This organization doesn't have any projects yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div key={project.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {project.description || 'No description provided'}
                        </p>
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="mr-2" size={14} />
                            <span>Created {formatDate(project.created_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-2" size={14} />
                            <span>{project.devops?.length || 0} developers</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && !users.some(user => user.role === 'admin') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Admin User</h2>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAdmin}
                  className="px-4 py-2 bg-[#9A00FF] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isCreatingAdmin ? 'Creating...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserOrganizationDetail;
