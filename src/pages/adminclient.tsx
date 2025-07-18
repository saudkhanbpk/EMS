import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import AddClientModal from '../components/addclientModal';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

interface Client {
    id: string;
    full_name: string;
    email: string;
    projects: Project[];
    created_at: string;
}

interface Project {
    id: string;
    title: string;
    description?: string;
    created_at: string;
}

const AdminClient: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { userProfile } = useUser();
    const [error, setError] = useState<string | null>(null);

    // Fetch clients and their projects
    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch users with client role
            const { data: clientUsers, error: clientError } = await supabase
                .from('users')
                .select('id, full_name, email, created_at')
                .eq('role', 'client')
                .eq("organization_id", userProfile?.organization_id)
                .order('created_at', { ascending: false });

            if (clientError) {
                setError('Failed to fetch clients. Please try again.');
                setLoading(false);
                return;
            }

            if (!clientUsers || clientUsers.length === 0) {
                setClients([]);
                setLoading(false);
                return;
            }

            // Fetch projects for each client (where client is product_owner)
            const clientsWithProjects = await Promise.all(
                clientUsers.map(async (client) => {
                    const { data: projects } = await supabase
                        .from('projects')
                        .select('id, title, description, created_at')
                        .eq('product_owner', client.id)
                        .order('created_at', { ascending: false });

                    return {
                        ...client,
                        projects: projects || []
                    };
                })
            );

            setClients(clientsWithProjects);
        } catch (error) {
            setError('An unexpected error occurred while fetching clients.');
        } finally {
            setLoading(false);
        }
    };

    // Delete client and all associated data
    const handleDeleteClient = async (clientId: string) => {
        if (!confirm('Are you sure you want to delete this client? This will also delete all their projects and remove them from authentication.')) {
            return;
        }

        try {
            // First, delete from users table (this will cascade to related data due to foreign keys)
            const { error: userError } = await supabase
                .from('users')
                .delete()
                .eq('id', clientId);

            if (userError) {
                alert('Failed to delete client from users table');
                return;
            }

            // Delete from authentication table using admin client
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(clientId);

            if (authError) {
                alert('Client deleted from database but failed to remove from authentication');
            } else {
                alert('Client deleted successfully');
            }

            // Refresh the clients list
            await fetchClients();
        } catch (error) {
            alert('An error occurred while deleting the client');
        }
    };

    // Filter clients based on search term
    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) {
            return clients;
        }
        return clients.filter(client =>
            client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    // Load clients on component mount
    useEffect(() => {
        fetchClients();
    }, []); // Empty dependency array - only run on mount

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                    <p className="mt-1 text-sm text-gray-500">View and manage your Client here</p>
                </div>
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        placeholder="Search Client"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        onClick={() => setModalOpen(true)}
                    >
                        + Add Client
                    </button>
                    <AddClientModal 
                        isOpen={modalOpen} 
                        onClose={() => setModalOpen(false)} 
                        onClientAdded={fetchClients} 
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <div className="text-sm text-red-700">
                            {error}
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-400 hover:text-red-600"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="mt-8">
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Count</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="border-b">
                                        {/* Client */}
                                        <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold uppercase mr-4">
                                                {client.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                                                <div className="text-sm text-gray-500">{client.email}</div>
                                            </div>
                                        </td>

                                        {/* Projects */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {client.projects.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {client.projects.slice(0, 2).map((project) => (
                                                            <div key={project.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                {project.title}
                                                            </div>
                                                        ))}
                                                        {client.projects.length > 2 && (
                                                            <div className="text-xs text-gray-500">+{client.projects.length - 2} more</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No projects</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Project Count */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {client.projects.length}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClient(client.id);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <FiTrash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminClient;