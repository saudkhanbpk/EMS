import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Building2,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Calendar,
  Users,
  Home
} from 'lucide-react';
import { useAuthStore } from '../lib/store';

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

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq("created_by", user?.id || ""); // Fixed the string

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.name.trim() || !newOrg.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    // Check if user already has an organization
    if (organizations.length > 0) {
      setError('You can only create one organization');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newOrg.name.trim(),
          slug: newOrg.slug.trim(),
          description: newOrg.description.trim() || null,
          is_active: true,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setOrganizations(prev => [data, ...prev]);
      setSuccess('Organization added successfully!');
      setShowAddModal(false);
      setNewOrg({ name: '', slug: '', description: '' });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding organization:', err);
      if (err.code === '23505') {
        setError('Organization slug already exists');
      } else {
        setError('Failed to add organization');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewOrganization = (org: Organization) => {
    navigate(`/user/${org.id}`);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building2 className="mr-3 text-[#9A00FF]" size={32} />
              Organizations
            </h1>
            <p className="text-gray-600 mt-1">Browse and manage organizations</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-2 flex items-center text-[#9A00FF] hover:text-purple-700 transition-colors"
            >
              <Home size={16} className="mr-1" />
              <span>Back to Home</span>
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={organizations.length > 0}
            className={`${organizations.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#9A00FF] hover:bg-purple-700'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
            title={organizations.length > 0 ? 'You can only create one organization' : 'Add Organization'}
          >
            <Plus size={20} />
            <span>Add Organization</span>
          </button>
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9A00FF]"></div>
          </div>
        ) : (
          /* Organizations Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <div key={org.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#9A00FF] rounded-lg flex items-center justify-center">
                      <Building2 className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-500">@{org.slug}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewOrganization(org)}
                      className="p-2 text-gray-600 hover:text-[#9A00FF] hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {org.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>Created {formatDate(org.created_at)}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${org.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {org.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No organizations found' : 'No organizations yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first organization'
              }
            </p>
            {!searchTerm && organizations.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#9A00FF] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Organization
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Organization Modal */}
      {showAddModal && organizations.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Organization</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter organization slug"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrg.description}
                  onChange={(e) => setNewOrg(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter organization description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-[#9A00FF] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Adding...' : 'Add Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
