import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    setTitle: (val: string) => void;
    type: string;
    setType: (val: string) => void;
    onCreate: () => void;
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
    loading = false,
}: CreateProjectModalProps) {
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-bold">
                                        Create New Project
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F1B318]"
                                            placeholder="Enter project title"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                        <select
                                            className="w-full border rounded-md px-3 py-2"
                                            value={type}
                                            onChange={e => setType(e.target.value)}
                                        >
                                            <option value="Front-End Developer">Front-End Developer</option>
                                            <option value="Back End Developer">Back End Developer</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
                                        onClick={onClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md bg-[#8000FF] text-white font-semibold hover:bg-[#6b21a8]"
                                        onClick={onCreate}
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating...' : 'Create Project'}
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