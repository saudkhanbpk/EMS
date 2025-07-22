import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Sparkles, Code2, Database, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    setTitle: (val: string) => void;
    type: string;
    setType: (val: string) => void;
    onCreate: (projectData: any) => void;
    loading?: boolean;
}

export default function CreateProjectModal({
    open,
    onClose,
    title,
    setTitle,
    type,
    setType,
    onCreate,
    loading: externalLoading = false,
}: CreateProjectModalProps) {
    const { userProfile } = useUser();
    const [loading, setLoading] = useState(externalLoading);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const getProjectIcon = (projectType: string) => {
        switch (projectType) {
            case "Front-End Developer":
                return <Code2 className="w-5 h-5 text-gray-400" />;
            case "Back End Developer":
                return <Database className="w-5 h-5 text-gray-400" />;
            case "Full Stack Developer":
                return <Layers className="w-5 h-5 text-gray-400" />;
            default:
                return <Code2 className="w-5 h-5 text-gray-400" />;
        }
    };

    const handleCreateProject = async () => {
        try {
            // Reset states
            setError(null);
            setSuccess(false);
            setLoading(true);

            // Validate inputs
            if (!title.trim()) {
                setError("Project title is required");
                setLoading(false);
                return;
            }

            // Create project data
            const projectData = {
                title,
                type,
                devops: [
                    {
                        id: userProfile?.id || '',
                        name: userProfile?.full_name || '',
                        full_name: userProfile?.full_name || ''
                    }
                ],
                product_owner: userProfile?.id || null,
                created_by: userProfile?.id || ''
            };

            // Insert into Supabase
            const { data, error } = await supabase
                .from('projects')
                .insert([projectData]);

            if (error) {
                console.error('Insert error:', error);
                setError(error.message || 'Failed to create project');
                setLoading(false);
            } else {
                setSuccess(true);
                // Call the onCreate callback with the created project data
                onCreate(data?.[0] || projectData);

                // Close modal after a short delay to show success message
                setTimeout(() => {
                    setLoading(false);
                    onClose();
                    // Reset states after closing
                    setTimeout(() => {
                        setSuccess(false);
                        setTitle('');
                    }, 300);
                }, 1500);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                                            Create New Project
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Form */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Project Title
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400"
                                            placeholder="Enter your amazing project title"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Project Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                                                value={type}
                                                onChange={e => setType(e.target.value)}
                                            >
                                                <option value="Front-End Developer">Front-End Developer</option>
                                                <option value="Back End Developer">Back End Developer</option>
                                                <option value="Full Stack Developer">Full Stack Developer</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                {getProjectIcon(type)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-800">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {success && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Project created successfully!</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                                        onClick={handleCreateProject}
                                        disabled={loading || !title.trim() || success}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Creating...
                                            </span>
                                        ) : (
                                            'Create Project'
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}