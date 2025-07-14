import React from 'react';
import { FiArrowLeft, FiMail, FiCalendar, FiFolder } from 'react-icons/fi';

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

interface ClientprofileProps {
    clientid: string;
    clientview: "generalview" | "detailview";
    client: Client | null;
    setclientview: (view: "generalview" | "detailview") => void;
}

const Clientprofile: React.FC<ClientprofileProps> = ({
    clientid,
    clientview,
    client,
    setclientview
}) => {
    if (!client) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-gray-500">Client not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => setclientview('generalview')}
                        className="flex items-center text-purple-600 hover:text-purple-800 mb-4 transition-colors"
                    >
                        <FiArrowLeft className="mr-2" />
                        Back to Clients
                    </button>
                    
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-20 w-20 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl uppercase mr-8">
                                {client.full_name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">{client.full_name}</h1>
                                <div className="flex items-center text-gray-600 mb-2">
                                    <FiMail className="mr-2" />
                                    {client.email}
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <FiCalendar className="mr-2" />
                                    Joined {new Date(client.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Client Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-6 text-gray-900">Client Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                                    <p className="text-gray-900 font-medium">{client.full_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900">{client.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Role</label>
                                    <p className="text-gray-900 capitalize">Client</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                                    <p className="text-gray-900">{new Date(client.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Projects</label>
                                    <p className="text-gray-900 font-semibold">{client.projects.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                                <div className="flex items-center text-gray-500">
                                    <FiFolder className="mr-2" />
                                    {client.projects.length} Project{client.projects.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            
                            {client.projects.length > 0 ? (
                                <div className="space-y-4">
                                    {client.projects.map((project) => (
                                        <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                                                    {project.description && (
                                                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                                                    )}
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <FiCalendar className="mr-1" />
                                                        Created {new Date(project.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FiFolder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects</h3>
                                    <p className="text-gray-500">This client hasn't been assigned to any projects yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Clientprofile;