import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuthStore } from '../lib/store';
import { supabase, withRetry, handleSupabaseError } from '../lib/supabase';
import { 
  ListTodo, 
  Plus,
  User,
  Calendar,
  MessageSquare,
  X,
  GripVertical
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status_id: string;
  priority_id: string;
  assignee_id: string | null;
  reporter_id: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  status: { name: string; color: string };
  priority: { name: string; color: string };
  assignee: { full_name: string } | null;
  reporter: { full_name: string };
  comments: TaskComment[];
}

interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order_position: number;
}

interface TaskPriority {
  id: string;
  name: string;
  color: string;
  order_position: number;
}

interface TaskComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: { full_name: string };
}

interface User {
  id: string;
  full_name: string;
}

const Tasks: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status_id: '',
    priority_id: '',
    assignee_id: '',
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load tasks with related data
      const { data: tasksData, error: tasksError } = await withRetry(() => 
        new Promise((resolve, reject) => {
          supabase
            .from('tasks')
            .select(`
              *,
              status:task_statuses(name, color),
              priority:task_priorities(name, color),
              assignee:users!tasks_assignee_id_fkey(full_name),
              reporter:users!tasks_reporter_id_fkey(full_name),
              comments:task_comments(
                id,
                content,
                user_id,
                created_at,
                user:users(full_name)
              )
            `)
            .order('created_at', { ascending: false })
            .then(resolve)
            .catch(reject);
        })
      );

      if (tasksError) throw tasksError;
      if (tasksData) setTasks(tasksData);

      // Load statuses
      const { data: statusesData, error: statusesError } = await withRetry(() =>
        new Promise((resolve, reject) => {
          supabase
            .from('task_statuses')
            .select('*')
            .order('order_position', { ascending: true })
            .then(resolve)
            .catch(reject);
        })
      );

      if (statusesError) throw statusesError;
      if (statusesData) setStatuses(statusesData);

      // Load priorities
      const { data: prioritiesData, error: prioritiesError } = await withRetry(() =>
        supabase
          .from('task_priorities')
          .select('*')
          .order('order_position', { ascending: true })
      );

      if (prioritiesError) throw prioritiesError;
      if (prioritiesData) setPriorities(prioritiesData);

      // Load users
      const { data: usersData, error: usersError } = await withRetry(() =>
        supabase
          .from('users')
          .select('id, full_name')
          .order('full_name', { ascending: true })
      );

      if (usersError) throw usersError;
      if (usersData) setUsers(usersData);

    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await withRetry(() =>
        supabase
          .from('tasks')
          .insert([
            {
              ...newTask,
              reporter_id: user.id,
              due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
            }
          ])
          .select()
          .single()
      );

      if (createError) throw createError;

      setShowNewTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        status_id: '',
        priority_id: '',
        assignee_id: '',
        due_date: ''
      });

      await loadData();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatusId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await withRetry(() =>
        supabase
          .from('tasks')
          .update({ status_id: newStatusId })
          .eq('id', taskId)
      );

      if (updateError) throw updateError;

      await loadData();
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverStatus(statusId);
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status_id !== statusId) {
      await handleUpdateTaskStatus(draggedTask.id, statusId);
    }
    setDraggedTask(null);
    setDragOverStatus(null);
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(task)}
      className="bg-white rounded-lg shadow-sm p-4 mb-4 cursor-move hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
        </div>
        <span
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{ backgroundColor: task.priority.color + '20', color: task.priority.color }}
        >
          {task.priority.name}
        </span>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm mb-4">{task.description}</p>
      )}

<div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 text-sm text-gray-500">
  {/* Left Section */}
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
    <div className="flex items-center min-w-[120px]">
      <User className="w-4 h-4 mr-1 flex-shrink-0" />
      <span className="truncate">{task.assignee?.full_name || 'Unassigned'}</span>
    </div>

    {task.due_date && (
      <div className="flex items-center">
        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" style={{ color: task.priority.color }} />
        <span 
          className="whitespace-nowrap font-medium"
          style={{ color: task.priority.color }}
        >
          {format(new Date(task.due_date), 'MMM d, yyyy')}
        </span>
      </div>
    )}

    <div className="flex items-center">
      <MessageSquare className="w-4 h-4 mr-1 flex-shrink-0" />
      <span>{task.comments.length}</span>
    </div>
    <div className="flex items-center justify-start sm:justify-end">
    <span className="text-xs whitespace-nowrap truncate">
      Created {format(new Date(task.created_at), 'MMM d, yyyy')}
    </span>
  </div>
  </div>
</div>
    </div>
  );

  if (loading && !tasks.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ListTodo className="w-6 h-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statuses.map((status) => (
          <div
            key={status.id}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDrop={(e) => handleDrop(e, status.id)}
            className={`p-4 rounded-lg ${
              dragOverStatus === status.id ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <h2 
              className="text-sm font-medium mb-4 flex items-center"
              style={{ color: status.color }}
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: status.color }}
              ></span>
              {status.name}
            </h2>
            <div>
              {tasks
                .filter((task) => task.status_id === status.id)
                .map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Create New Task</h2>
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        required
                        value={newTask.status_id}
                        onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      >
                        <option value="">Select Status</option>
                        {statuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
{/* <select
  required
  value={newTask.status_id}
  onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
>
  <option value="">Select Status</option> 
  <option value="1">Pending</option>
  <option value="2">In Progress</option>
  <option value="3">Completed</option>
  <option value="4">Cancelled</option>
</select> */}

                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        required
                        value={newTask.priority_id}
                        onChange={(e) => setNewTask({ ...newTask, priority_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      >
                        <option value="">Select Priority</option>
                        {priorities.map((priority) => (
                          <option key={priority.id} value={priority.id}>
                            {priority.name}
                          </option>
                        ))}
                      </select>

{/* <select
  required
  value={newTask.status_id}
  onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
>
  <option value="">Select Status</option> 
  <option value="1">Pending</option>
  <option value="2">In Progress</option>
  <option value="3">Completed</option>
  <option value="4">Cancelled</option>
</select> */}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Assignee
                      </label>
                      <select
                        value={newTask.assignee_id}
                        onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;