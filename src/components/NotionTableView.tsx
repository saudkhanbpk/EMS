import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { User, Calendar, Clock, FileText, Plus } from "lucide-react";

interface Developer {
    id: string;
    name?: string;
    full_name?: string;
}

interface Task {
    id: string;
    title: string;
    created_at: string;
    status: 'todo' | 'inProgress' | 'review' | 'done';
    score: number;
    devops?: Developer[];
    description?: string;
    priority?: string;
    deadline?: string;
    imageurl?: string;
    commentCount?: number;
}

interface NotionTableViewProps {
    tasks: Task[];
    developers: Developer[];
    onAddTask?: () => void;
    onTaskStatusChange?: (taskId: string, newStatus: 'done' | Task['status']) => void;
    onQuickAddTask?: (title: string) => void; // New prop for quick task creation
}

const NotionTableView: React.FC<NotionTableViewProps> = ({
    tasks,
    developers,
    onAddTask,
    onTaskStatusChange,
    onQuickAddTask,
}) => {
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Check if the table view is visible and focused
            if (!tableRef.current || !document.activeElement) return;

            // Check if user is not typing in an input field
            const activeElement = document.activeElement;
            if (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.getAttribute('contenteditable') === 'true'
            ) {
                return;
            }

            // Prevent default paste behavior
            e.preventDefault();

            // Get pasted text
            const pastedText = e.clipboardData?.getData('text/plain');
            if (pastedText && pastedText.trim() && onQuickAddTask) {
                onQuickAddTask(pastedText.trim());
            }
        };

        // Add paste event listener
        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [onQuickAddTask]);

    return (
        <div
            ref={tableRef}
            className="bg-white text-gray-900 rounded-xl overflow-x-auto p-4 border border-gray-200"
            tabIndex={0} // Make div focusable
        >
            {/* Add a visual hint for paste functionality */}
            <div className="text-xs text-gray-500 mb-2">
                Tip: Paste text anywhere to quickly create a new task
            </div>

            <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-gray-600 text-sm">
                        <th className="px-2 py-2 font-normal text-left w-8">
                            Status
                        </th>
                        <th className="px-2 py-2 font-normal text-left w-12">
                            <span className="flex items-center gap-1">
                                <span className="text-lg">★</span>
                            </span>
                        </th>
                        <th className="px-2 py-2 font-normal text-left">
                            <span className="flex items-center gap-1">
                                <FileText size={16} /> Task name
                            </span>
                        </th>
                        <th className="px-2 py-2 font-normal text-left">
                            <span className="flex items-center gap-1">
                                <User size={16} /> Assign
                            </span>
                        </th>
                        <th className="px-2 py-2 font-normal text-left">
                            <span className="flex items-center gap-1">
                                <Calendar size={16} /> Due
                            </span>
                        </th>
                        <th className="px-2 py-2 font-normal text-left">
                            <span className="flex items-center gap-1">
                                <Clock size={16} /> Estimates
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task) => (
                        <tr
                            key={task.id}
                            className="hover:bg-gray-50 transition-colors group"
                        >
                            <td className="px-2 py-2 align-top">
                                <input
                                    type="checkbox"
                                    className="accent-[#9A00FF]"
                                    checked={task.status === 'done'}
                                    disabled={task.status === 'done'}
                                    onChange={() => onTaskStatusChange?.(task.id, 'done')}
                                />
                            </td>
                            <td className="px-2 py-2 align-top">
                                {/* Status indicator */}
                                {task.status === "todo" && (
                                    <span className="inline-block w-4 h-4 rounded bg-gray-200 border border-gray-400" />
                                )}
                                {task.status === "inProgress" && (
                                    <span className="inline-block w-4 h-4 rounded bg-blue-600" />
                                )}
                                {task.status === "review" && (
                                    <span className="inline-block w-4 h-4 rounded bg-yellow-500" />
                                )}
                                {task.status === "done" && (
                                    <span className="inline-block w-4 h-4 rounded bg-green-600" />
                                )}
                            </td>
                            <td className="px-2 py-2 align-top">
                                <div className="flex items-start gap-2">
                                    <FileText size={16} className="mt-1 text-gray-500" />
                                    <div>
                                        <div className="font-medium">{task.title}</div>
                                        <div className="text-xs text-gray-600">{task.description}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-2 py-2 align-top">
                                {task.devops && task.devops.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {task.devops.map((dev) => (
                                            <span
                                                key={dev.id}
                                                className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700"
                                            >
                                                {dev.name || dev.full_name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                )}
                            </td>
                            <td className="px-2 py-2 align-top">
                                {task.deadline ? (
                                    <span>
                                        {format(new Date(task.deadline), "MMMM d, yyyy")}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                )}
                            </td>
                            <td className="px-2 py-2 align-top">
                                <span className="text-gray-400 text-xs">—</span>
                            </td>
                        </tr>
                    ))}
                    {/* New Task Row */}
                    <tr>
                        <td colSpan={6} className="px-2 py-2">
                            <button
                                onClick={onAddTask}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm w-full text-left"
                            >
                                <Plus size={16} /> New task
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default NotionTableView;