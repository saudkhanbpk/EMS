import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  Eye,
  Search,
  AlertCircle,
  CheckCircle,
  X
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

interface OrganizationsProps {
  onSelectOrganization: (org: Organization) => void;
}

const Organizations: React.FC<OrganizationsProps> = ({ onSelectOrganization }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, description, logo_url, is_active, created_by, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganization = async () => {
    if (!newOrg.name.trim() || !newOrg.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: newOrg.name.trim(),
          slug: newOrg.slug.trim(),
          description: newOrg.description.trim(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setOrganizations([data, ...organizations]);
      setNewOrg({ name: '', slug: '', description: '' });
      setShowAddModal(false);
      setSuccess('Organization created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Failed to create organization');
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrganizations(organizations.filter(org => org.id !== id));
      setSuccess('Organization deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError('Failed to delete organization');
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building2 className="mr-3 text-[#9A00FF]" size={32} />
              Organizations
            </h1>
            <p className="text-gray-600 mt-1">Manage all organizations in the system</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#9A00FF] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700 transition-colors"
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

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div key={org.uuid} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
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
                    onClick={() => onSelectOrganization(org)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteOrganization(org.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Organization"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {org.description || 'No description provided'}
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${org.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {org.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-gray-500">
                  {new Date(org.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first organization'}
            </p>
          </div>
        )}
      </div>

      {/* Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Organization</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => {
                    setNewOrg({
                      ...newOrg,
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  placeholder="organization-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  rows={3}
                  placeholder="Enter organization description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrganization}
                className="px-4 py-2 bg-[#9A00FF] text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
