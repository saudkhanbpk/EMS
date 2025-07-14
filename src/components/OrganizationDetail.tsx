import React, { useState, useEffect } from 'react';
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
  Trash2
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
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  devops: Array<{
    id: string;
    name: string;
    full_name?: string;
  }>;
  type: string;
  created_by: string;
  product_owner: string | null;
  organization_id: string;
}

interface OrganizationDetailProps {
  organization: Organization;
  onBack: () => void;
}

const OrganizationDetail: React.FC<OrganizationDetailProps> = ({ organization, onBack }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
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

  useEffect(() => {
    fetchOrganizationData();
  }, [organization.id]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at, organization_id')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, description, start_date, end_date, created_at, devops, type, created_by, product_owner, organization_id')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.warn('Projects table might not have organization_id field:', projectsError);
        setProjects([]);
      } else {
        console.error("project added successfullly")
        setProjects(projectsData || []);
      }
    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError('Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email.trim() || !newAdmin.full_name.trim() || !newAdmin.password.trim()) {
      setError('Email, full name, and password are required');
      return;
    }

    if (newAdmin.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsCreatingAdmin(true);
      // Get the current user's token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`https://ems-server-0bvq.onrender.com/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          email: newAdmin.email.trim(),
          password: newAdmin.password,
          full_name: newAdmin.full_name.trim(),
          organization_id: organization.id,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      // Success - refresh the users list
      setNewAdmin({ email: '', full_name: '', password: '' });
      setShowAddAdminModal(false);
      setSuccess('Admin user created successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchOrganizationData();

    } catch (err) {
      console.error('Error creating admin user:', err);
      setError(err.message || 'Failed to create admin user');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;

      // Delete from Supabase Auth using admin client
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('Failed to delete from auth:', authError);
      }

      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchOrganizationData();

    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9A00FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#9A00FF] hover:text-purple-700 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
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
                  Created: {new Date(organization.created_at).toLocaleDateString()}
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
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Organization Users</h2>
                  <button
                    onClick={() => setShowAddAdminModal(true)}
                    className="bg-[#9A00FF] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Admin</span>
                  </button>
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">This organization doesn't have any users yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-[#9A00FF] rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {user.full_name.charAt(0).toUpperCase()}
                                  </span>
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
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'manager'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                                }`}>
                                <Shield className="mr-1" size={12} />
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </button>
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Organization Projects</h2>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500">This organization doesn't have any projects yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <div key={project.id} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {project.description || 'No description provided'}
                        </p>
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {project.type}
                          </span>
                        </div>
                        {project.devops && project.devops.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">DevOps:</p>
                            <div className="flex flex-wrap gap-1">
                              {project.devops.map((dev) => (
                                <span key={dev.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                  {dev.full_name || dev.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Created: {new Date(project.created_at).toLocaleDateString()}
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
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Admin User</h2>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter password (minimum 6 characters)"
                  minLength={6}
                />
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Note:</strong> This will create an admin user for {organization.name} with login credentials.
                  The user will be able to login immediately using the provided email and password.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={isCreatingAdmin}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${isCreatingAdmin
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-[#9A00FF] hover:bg-purple-700'
                  }`}
              >
                {isCreatingAdmin && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                )}
                <span>{isCreatingAdmin ? 'Creating...' : 'Create Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetail;
