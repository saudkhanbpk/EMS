import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FiX,
  FiCheckCircle,
  FiClock,
  FiCircle,
  FiTrendingUp,
  FiCalendar,
  FiClipboard,
  FiHash
} from 'react-icons/fi';
import { HiOutlineExclamation } from 'react-icons/hi';
import { MdOutlineLowPriority } from 'react-icons/md';

interface TaskModalAdminProps {
  isOpen: boolean;
  onClose: () => void;
  taskIds: string[];
  projectId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

const TaskModalAdmin: React.FC<TaskModalAdminProps> = ({
  isOpen,
  onClose,
  taskIds,
  projectId
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectname, setprojectname] = useState<null | string>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && taskIds.length > 0) {
      fetchTasks();
    }
  }, [isOpen, taskIds]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks_of_projects')
        .select('id, title, description, status, priority, created_at')
        .in('id', taskIds);
      const { data: projectdata, error: projecterror } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId);

      if (error) throw error;
      if (projecterror) throw projecterror;
      setprojectname(projectdata[0].title)
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'in_progress':
        return <FiClock className="w-5 h-5" />;
      default:
        return <FiCircle className="w-5 h-5" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <HiOutlineExclamation className="w-4 h-4" />;
      case 'medium':
        return <FiTrendingUp className="w-4 h-4" />;
      default:
        return <MdOutlineLowPriority className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{projectname}</h2>
              <p className="text-blue-100 mt-1">the person is working on {tasks.length} tasks of this project</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors duration-200"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute inset-0"></div>
              </div>
              <p className="mt-4 text-gray-500">Loading tasks...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group relative bg-gradient-to-br from-white to-gray-50 border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${selectedTask === task.id ? 'ring-2 ring-purple-500 shadow-lg' : ''
                      }`}
                    onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                  >
                    {/* Task Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                          {task.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${task.status === 'completed'
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                          : task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
                            : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                          }`}>
                          {getStatusIcon(task.status)}
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Task Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>

                    {/* Task Footer */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${task.priority === 'high'
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          : task.priority === 'medium'
                            ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                            : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          }`}>
                          {getPriorityIcon(task.priority)}
                          {task.priority} priority
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <FiCalendar className="w-4 h-4" />
                        {new Date(task.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Expanded Details (when selected) */}
                    {selectedTask === task.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium flex items-center gap-1">
                              <FiHash className="w-4 h-4" />
                              Task ID
                            </p>
                            <p className="text-gray-700 font-mono text-xs mt-1 ml-5">{task.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              Created
                            </p>
                            <p className="text-gray-700 mt-1 ml-5">
                              {new Date(task.created_at).toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <FiClipboard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No tasks found</p>
                  <p className="text-gray-400 mt-1">This project doesn't have any tasks yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default TaskModalAdmin;