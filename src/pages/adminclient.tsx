import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
} from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import AddClientModal from '../components/addclientModal';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { AttendanceContext } from './AttendanceContext';
import TaskBoardAdmin from '../components/TaskBoardAdmin';
import Employeeprofile from './Employeeprofile';

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Navigation state management
  const [selectedTAB, setSelectedTAB] = useState('');
  const [clientview, setClientView] = useState<'generalview' | 'detailview'>(
    'generalview'
  );
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientId, setClientId] = useState<string>('');

  // Task board state for project navigation
  const [devopss, setDevopss] = useState<any[]>([]);
  const [ProjectId, setProjectId] = useState<string>('');

  const { openTaskBoard } = useContext(AttendanceContext);

  // Navigation handlers
  const handleClientClick = (client: Client) => {
    setCurrentClient(client);
    setClientId(client.id);
    setClientView('detailview');
  };

  const handleOpenTaskBoard = async (projectId: string) => {
    try {
      // Fetch project details including devops
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('id, title, devops')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return;
      }

      setProjectId(projectId);
      setDevopss(projectData?.devops || []);
      setSelectedTAB('TaskBoard');
    } catch (error) {
      console.error('Error navigating to task board:', error);
    }
  };

  // Fetch clients and their projects - optimized with single query
  const fetchClients = useCallback(async () => {
    // Don't fetch if no organization_id
    if (!userProfile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Single query to fetch clients with their projects
      const { data: clientsData, error: clientError } = await supabase
        .from('users')
        .select(
          `
                    id,
                    full_name,
                    email,
                    created_at,
                    projects!product_owner (
                        id,
                        title,
                        description,
                        created_at
                    )
                `
        )
        .eq('role', 'client')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false });

      if (clientError) {
        console.error('Error fetching clients:', clientError);
        setError('Failed to fetch clients. Please try again.');
        return;
      }

      // Transform the data to match our interface
      const transformedClients: Client[] = (clientsData || []).map(
        (client) => ({
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          created_at: client.created_at,
          projects: client.projects || [],
        })
      );

      setClients(transformedClients);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred while fetching clients.');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.organization_id]);

  // Delete client with optimistic update
  const handleDeleteClient = useCallback(
    async (clientId: string) => {
      if (
        !confirm(
          'Are you sure you want to delete this client? This will also delete all their projects and remove them from authentication.'
        )
      ) {
        return;
      }

      setIsDeleting(clientId);

      // Optimistic update - remove client from UI immediately
      const previousClients = clients;
      setClients((prev) => prev.filter((client) => client.id !== clientId));

      try {
        // Delete from users table (this will cascade to related data)
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', clientId);

        if (userError) {
          // Revert optimistic update on error
          setClients(previousClients);
          setError('Failed to delete client from users table');
          return;
        }

        // Delete from authentication table using admin client
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          clientId
        );

        if (authError) {
          console.error('Auth deletion error:', authError);
          setError(
            'Client deleted from database but failed to remove from authentication'
          );
        }

        // Success - no need to refetch as we already updated the UI
      } catch (error) {
        console.error('Delete error:', error);
        // Revert optimistic update on error
        setClients(previousClients);
        setError('An error occurred while deleting the client');
      } finally {
        setIsDeleting(null);
      }
    },
    [clients]
  );

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.full_name.toLowerCase().includes(lowerSearchTerm) ||
        client.email.toLowerCase().includes(lowerSearchTerm)
    );
  }, [clients, searchTerm]);

  // Handle client added - optimized to only add the new client
  const handleClientAdded = useCallback(
    async (newClientId?: string) => {
      if (!newClientId || !userProfile?.organization_id) {
        // If no ID provided, refetch all
        await fetchClients();
        return;
      }

      try {
        // Fetch only the new client
        const { data: newClient, error } = await supabase
          .from('users')
          .select(
            `
                    id,
                    full_name,
                    email,
                    created_at,
                    projects!product_owner (
                        id,
                        title,
                        description,
                        created_at
                    )
                `
          )
          .eq('id', newClientId)
          .eq('organization_id', userProfile.organization_id)
          .single();

        if (!error && newClient) {
          const transformedClient: Client = {
            id: newClient.id,
            full_name: newClient.full_name,
            email: newClient.email,
            created_at: newClient.created_at,
            projects: newClient.projects || [],
          };

          // Add to the beginning of the list
          setClients((prev) => [transformedClient, ...prev]);
        } else {
          // Fallback to full refetch if single fetch fails
          await fetchClients();
        }
      } catch (error) {
        console.error('Error adding new client:', error);
        await fetchClients();
      }
    },
    [fetchClients, userProfile?.organization_id]
  );

  // Load clients on component mount and when organization changes
  useEffect(() => {
    if (userProfile?.organization_id) {
      fetchClients();
    }
  }, [userProfile?.organization_id, fetchClients]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-x-scroll bg-gray-50 p-4 sm:p-6">
      {selectedTAB === 'TaskBoard' ? (
        <TaskBoardAdmin
          devopss={devopss}
          ProjectId={ProjectId}
          setSelectedTAB={setSelectedTAB}
          selectedTAB={selectedTAB}
        />
      ) : clientview === 'detailview' ? (
        <Employeeprofile
          employeeid={clientId}
          employeeview={clientview}
          employee={currentClient}
          setemployeeview={setClientView}
        />
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Client Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    View and manage your Client here
                  </p>
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
                    onClientAdded={handleClientAdded}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="text-sm text-red-700">{error}</div>
                    <button
                      onClick={() => setError(null)}
                      className="ml-auto text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Count
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {searchTerm
                          ? 'No clients found matching your search.'
                          : 'No clients found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleClientClick(client)}
                      >
                        {/* Client */}
                        <td className="px-6 py-4 whitespace-nowrap flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold uppercase mr-4">
                            {client.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors">
                              {client.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.email}
                            </div>
                          </div>
                        </td>

                        {/* Projects */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {client.projects.length > 0 ? (
                              <div className="space-y-1">
                                {client.projects.slice(0, 2).map((project) => (
                                  <button
                                    key={project.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTaskBoard(project.id);
                                    }}
                                    className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded transition-colors cursor-pointer block"
                                  >
                                    {project.title}
                                  </button>
                                ))}
                                {client.projects.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{client.projects.length - 2} more
                                  </div>
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
                            disabled={isDeleting === client.id}
                            className={`text-red-600 hover:text-red-900 transition-colors ${
                              isDeleting === client.id
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                            title="Delete Client"
                          >
                            {isDeleting === client.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
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
      )}
    </div>
  );
};

export default AdminClient;
