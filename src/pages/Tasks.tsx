// import React, { useState, useEffect } from 'react';
// import { format } from 'date-fns';
// import { useAuthStore } from '../lib/store';
// import { supabase, withRetry, handleSupabaseError } from '../lib/supabase';
// import {
//   ListTodo,
//   Plus,
//   User,
//   Calendar,
//   MessageSquare,
//   X,
//   GripVertical
// } from 'lucide-react';

// interface Task {
//   id: string;
//   title: string;
//   description: string | null;
//   status_id: string;
//   priority_id: string;
//   assignee_id: string | null;
//   reporter_id: string;
//   due_date: string | null;
//   created_at: string;
//   updated_at: string;
//   status: { name: string; color: string };
//   priority: { name: string; color: string };
//   assignee: { full_name: string } | null;
//   reporter: { full_name: string };
//   comments: TaskComment[];
// }

// interface TaskStatus {
//   id: string;
//   name: string;
//   color: string;
//   order_position: number;
// }

// interface TaskPriority {
//   id: string;
//   name: string;
//   color: string;
//   order_position: number;
// }

// interface TaskComment {
//   id: string;
//   content: string;
//   user_id: string;
//   created_at: string;
//   user: { full_name: string };
// }

// interface User {
//   id: string;
//   full_name: string;
// }

// const Tasks: React.FC = () => {
//   const [tasks1, setTasks1] = useState<Task[]>([
//     {
//       id: '1',
//       title: 'Make the card functional in the end of the page.',
//       createdAt: '6 month ago',
//       status: 'todo'
//     },
//     {
//       id: '2',
//       title: 'Implement drag and drop functionality.',
//       createdAt: '6 month ago',
//       status: 'inProgress'
//     },
//     {
//       id: '3',
//       title: 'Review the new design system.',
//       createdAt: '6 month ago',
//       status: 'review'
//     },
//     {
//       id: '4',
//       title: 'Complete the landing page.',
//       createdAt: '6 month ago',
//       status: 'done'
//     }
//   ]);

//   const getTasksByStatus = (status: Task['status']) =>
//     tasks.filter(task => task.status === status);

//   const getStatusCount = (status: Task['status']) =>
//     tasks.filter(task => task.status === status).length;

//   const totalTasks = tasks.length;
//   const completedTasks = getTasksByStatus('done').length;
//   const pendingTasks = totalTasks - completedTasks;

//   const handleDragEnd = (result: DropResult) => {
//     const { destination, source, draggableId } = result;

//     if (!destination) return;

//     if (
//       destination.droppableId === source.droppableId &&
//       destination.index === source.index
//     ) {
//       return;
//     }

//     const updatedTasks = tasks.map(task => {
//       if (task.id === draggableId) {
//         return {
//           ...task,
//           status: destination.droppableId as Task['status']
//         };
//       }
//       return task;
//     });

//     setTasks(updatedTasks);
//   };
//   const user = useAuthStore((state) => state.user);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [statuses, setStatuses] = useState<TaskStatus[]>([]);
//   const [priorities, setPriorities] = useState<TaskPriority[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showNewTaskModal, setShowNewTaskModal] = useState(false);
//   const [draggedTask, setDraggedTask] = useState<Task | null>(null);
//   const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
//   const [newTask, setNewTask] = useState({
//     title: '',
//     description: '',
//     status_id: '',
//     priority_id: '',
//     assignee_id: '',
//     due_date: ''
//   });

//   useEffect(() => {
//     loadData();
//   }, [user]);

//   const loadData = async () => {
//     if (!user) return;

//     try {
//       setLoading(true);
//       setError(null);

//       // Load tasks with related data
//       const { data: tasksData, error: tasksError } = await withRetry(() =>
//         new Promise((resolve, reject) => {
//           supabase
//             .from('tasks')
//             .select(`
//               *,
//               status:task_statuses(name, color),
//               priority:task_priorities(name, color),
//               assignee:users!tasks_assignee_id_fkey(full_name),
//               reporter:users!tasks_reporter_id_fkey(full_name),
//               comments:task_comments(
//                 id,
//                 content,
//                 user_id,
//                 created_at,
//                 user:users(full_name)
//               )
//             `)
//             .order('created_at', { ascending: false })
//             .then(resolve)
//             .catch(reject);
//         })
//       );

//       if (tasksError) throw tasksError;
//       if (tasksData) setTasks(tasksData);

//       // Load statuses
//       const { data: statusesData, error: statusesError } = await withRetry(() =>
//         new Promise((resolve, reject) => {
//           supabase
//             .from('task_statuses')
//             .select('*')
//             .order('order_position', { ascending: true })
//             .then(resolve)
//             .catch(reject);
//         })
//       );

//       if (statusesError) throw statusesError;
//       if (statusesData) setStatuses(statusesData);

//       // Load priorities
//       const { data: prioritiesData, error: prioritiesError } = await withRetry(() =>
//         supabase
//           .from('task_priorities')
//           .select('*')
//           .order('order_position', { ascending: true })
//       );

//       if (prioritiesError) throw prioritiesError;
//       if (prioritiesData) setPriorities(prioritiesData);

//       // Load users
//       const { data: usersData, error: usersError } = await withRetry(() =>
//         supabase
//           .from('users')
//           .select('id, full_name')
//           .order('full_name', { ascending: true })
//       );

//       if (usersError) throw usersError;
//       if (usersData) setUsers(usersData);

//     } catch (err) {
//       console.error('Error loading tasks:', err);
//       setError(handleSupabaseError(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateTask = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!user) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const { data, error: createError } = await withRetry(() =>
//         supabase
//           .from('tasks')
//           .insert([
//             {
//               ...newTask,
//               reporter_id: user.id,
//               due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
//             }
//           ])
//           .select()
//           .single()
//       );

//       if (createError) throw createError;

//       setShowNewTaskModal(false);
//       setNewTask({
//         title: '',
//         description: '',
//         status_id: '',
//         priority_id: '',
//         assignee_id: '',
//         due_date: ''
//       });

//       await loadData();
//     } catch (err) {
//       setError(handleSupabaseError(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateTaskStatus = async (taskId: string, newStatusId: string) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const { error: updateError } = await withRetry(() =>
//         supabase
//           .from('tasks')
//           .update({ status_id: newStatusId })
//           .eq('id', taskId)
//       );

//       if (updateError) throw updateError;

//       await loadData();
//     } catch (err) {
//       setError(handleSupabaseError(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDragStart = (task: Task) => {
//     setDraggedTask(task);
//   };

//   const handleDragOver = (e: React.DragEvent, statusId: string) => {
//     e.preventDefault();
//     setDragOverStatus(statusId);
//   };

//   const handleDrop = async (e: React.DragEvent, statusId: string) => {
//     e.preventDefault();
//     if (draggedTask && draggedTask.status_id !== statusId) {
//       await handleUpdateTaskStatus(draggedTask.id, statusId);
//     }
//     setDraggedTask(null);
//     setDragOverStatus(null);
//   };

//   const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
//     <div
//       draggable
//       onDragStart={() => handleDragStart(task)}
//       className="bg-white rounded-lg shadow-sm p-4 mb-4 cursor-move hover:shadow-md transition-shadow duration-200"
//     >
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex items-center space-x-2">
//           <GripVertical className="w-5 h-5 text-gray-400" />
//           <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
//         </div>
//         <span
//           className="px-2 py-1 text-xs font-medium rounded-full"
//           style={{ backgroundColor: task.priority.color + '20', color: task.priority.color }}
//         >
//           {task.priority.name}
//         </span>
//       </div>

//       {task.description && (
//         <p className="text-gray-600 text-sm mb-4">{task.description}</p>
//       )}

// <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 text-sm text-gray-500">
//   {/* Left Section */}
//   <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
//     <div className="flex items-center min-w-[120px]">
//       <User className="w-4 h-4 mr-1 flex-shrink-0" />
//       <span className="truncate">{task.assignee?.full_name || 'Unassigned'}</span>
//     </div>

//     {task.due_date && (
//       <div className="flex items-center">
//         <Calendar className="w-4 h-4 mr-1 flex-shrink-0" style={{ color: task.priority.color }} />
//         <span
//           className="whitespace-nowrap font-medium"
//           style={{ color: task.priority.color }}
//         >
//           {format(new Date(task.due_date), 'MMM d, yyyy')}
//         </span>
//       </div>
//     )}

//     <div className="flex items-center">
//       <MessageSquare className="w-4 h-4 mr-1 flex-shrink-0" />
//       <span>{task.comments.length}</span>
//     </div>
//     <div className="flex items-center justify-start sm:justify-end">
//     <span className="text-xs whitespace-nowrap truncate">
//       Created {format(new Date(task.created_at), 'MMM d, yyyy')}
//     </span>
//   </div>
//   </div>
// </div>
//     </div>
//   );

//   if (loading && !tasks.length) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center">
//           <ListTodo className="w-6 h-6 text-blue-600 mr-2" />
//           <h1 className="text-2xl font-bold">Tasks</h1>
//         </div>
//         <button
//           onClick={() => setShowNewTaskModal(true)}
//           className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//         >
//           <Plus className="w-5 h-5 mr-2" />
//           New Task
//         </button>
//       </div>

//       {error && (
//         <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
//           {error}
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         {statuses.map((status) => (
//           <div
//             key={status.id}
//             onDragOver={(e) => handleDragOver(e, status.id)}
//             onDrop={(e) => handleDrop(e, status.id)}
//             className={`p-4 rounded-lg ${
//               dragOverStatus === status.id ? 'bg-blue-50' : 'bg-gray-50'
//             }`}
//           >
//             <h2
//               className="text-sm font-medium mb-4 flex items-center"
//               style={{ color: status.color }}
//             >
//               <span
//                 className="w-2 h-2 rounded-full mr-2"
//                 style={{ backgroundColor: status.color }}
//               ></span>
//               {status.name}
//             </h2>
//             <div>
//               {tasks
//                 .filter((task) => task.status_id === status.id)
//                 .map((task) => (
//                   <TaskCard key={task.id} task={task} />
//                 ))}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* New Task Modal */}
//       {showNewTaskModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-semibold">Create New Task</h2>
//                 <button
//                   onClick={() => setShowNewTaskModal(false)}
//                   className="text-gray-400 hover:text-gray-500"
//                 >
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               <form onSubmit={handleCreateTask}>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Title
//                     </label>
//                     <input
//                       type="text"
//                       required
//                       value={newTask.title}
//                       onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Description
//                     </label>
//                     <textarea
//                       value={newTask.description}
//                       onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
//                       rows={3}
//                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                     ></textarea>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Status
//                       </label>
//                       <select
//                         required
//                         value={newTask.status_id}
//                         onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                       >
//                         <option value="">Select Status</option>
//                         {statuses.map((status) => (
//                           <option key={status.id} value={status.id}>
//                             {status.name}
//                           </option>
//                         ))}
//                       </select>
// {/* <select
//   required
//   value={newTask.status_id}
//   onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
//   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
// >
//   <option value="">Select Status</option>
//   <option value="1">Pending</option>
//   <option value="2">In Progress</option>
//   <option value="3">Completed</option>
//   <option value="4">Cancelled</option>
// </select> */}

//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Priority
//                       </label>
//                       <select
//                         required
//                         value={newTask.priority_id}
//                         onChange={(e) => setNewTask({ ...newTask, priority_id: e.target.value })}
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                       >
//                         <option value="">Select Priority</option>
//                         {priorities.map((priority) => (
//                           <option key={priority.id} value={priority.id}>
//                             {priority.name}
//                           </option>
//                         ))}
//                       </select>

// {/* <select
//   required
//   value={newTask.status_id}
//   onChange={(e) => setNewTask({ ...newTask, status_id: e.target.value })}
//   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
// >
//   <option value="">Select Status</option>
//   <option value="1">Pending</option>
//   <option value="2">In Progress</option>
//   <option value="3">Completed</option>
//   <option value="4">Cancelled</option>
// </select> */}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Assignee
//                       </label>
//                       <select
//                         value={newTask.assignee_id}
//                         onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                       >
//                         <option value="">Unassigned</option>
//                         {users.map((user) => (
//                           <option key={user.id} value={user.id}>
//                             {user.full_name}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Due Date
//                       </label>
//                       <input
//                         type="date"
//                         value={newTask.due_date}
//                         onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
//                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-6 flex justify-end space-x-3">
//                   <button
//                     type="button"
//                     onClick={() => setShowNewTaskModal(false)}
//                     className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={loading}
//                     className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//                   >
//                     {loading ? 'Creating...' : 'Create Task'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Tasks;



// import React, { useState } from 'react';
// import { PlusCircle, User, X } from 'lucide-react';
// import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// interface Task {
//   id: string;
//   title: string;
//   createdAt: string;
//   status: 'todo' | 'inProgress' | 'review' | 'done';
// }

// const COLUMN_IDS = {
//   todo: 'todo',
//   inProgress: 'inProgress',
//   review: 'review',
//   done: 'done'
// };

// function Task() {
//   const [tasks, setTasks] = useState<Task[]>([
//     // {
//     //   id: '1',
//     //   title: 'Make the card functional in the end of the page.',
//     //   createdAt: '6 month ago',
//     //   status: 'todo'
//     // },
//     // {
//     //   id: '2',
//     //   title: 'Implement drag and drop functionality.',
//     //   createdAt: '6 month ago',
//     //   status: 'inProgress'
//     // },
//     // {
//     //   id: '3',
//     //   title: 'Review the new design system.',
//     //   createdAt: '6 month ago',
//     //   status: 'review'
//     // },
//     // {
//     //   id: '4',
//     //   title: 'Complete the landing page.',
//     //   createdAt: '6 month ago',
//     //   status: 'done'
//     // }
//   ]);

//   const [isAddingTask, setIsAddingTask] = useState(false);
//   const [newTaskTitle, setNewTaskTitle] = useState('');

//   const getTasksByStatus = (status: Task['status']) =>
//     tasks.filter(task => task.status === status);

//   const getStatusCount = (status: Task['status']) =>
//     tasks.filter(task => task.status === status).length;

//   const totalTasks = tasks.length;
//   const completedTasks = getTasksByStatus('done').length;
//   const pendingTasks = totalTasks - completedTasks;

//   const handleDragEnd = (result: DropResult) => {
//     const { destination, source, draggableId } = result;

//     if (!destination) return;

//     if (
//       destination.droppableId === source.droppableId &&
//       destination.index === source.index
//     ) {
//       return;
//     }

//     // Create a new array of tasks
//     const newTasks = Array.from(tasks);

//     // Find the task being dragged
//     const draggedTask = newTasks.find(task => task.id === draggableId);
//     if (!draggedTask) return;

//     // Remove the task from its original position
//     newTasks.splice(newTasks.indexOf(draggedTask), 1);

//     // Find the insertion index based on the destination status
//     const tasksInDestination = newTasks.filter(task => task.status === destination.droppableId);
//     const insertIndex = newTasks.findIndex(task => task.status === destination.droppableId) + destination.index;

//     // Update the task's status and insert it at the correct position
//     draggedTask.status = destination.droppableId as Task['status'];
//     newTasks.splice(insertIndex, 0, draggedTask);

//     setTasks(newTasks);
//   };

//   const handleAddTask = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newTaskTitle.trim()) return;

//     const newTask: Task = {
//       id: String(Date.now()),
//       title: newTaskTitle,
//       createdAt: 'Just now',
//       status: 'todo'
//     };

//     setTasks([...tasks, newTask]);
//     setNewTaskTitle('');
//     setIsAddingTask(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex justify-between items-center mb-8">
//           <h1 className="text-[28px] leading-[38px] text-[#000000] font-bold">Work Planner</h1>
//           <div className="text-sm text-gray-600">
//             <span className='font-semibold text-[15px] leading-7 text-[#404142]'>Total Tasks: {totalTasks}</span>
//             <span className="mx-3 className='font-semibold text-[15px] leading-7 text-[#404142]'">Completed Tasks: {completedTasks}</span>
//             <span className='font-semibold text-[15px] leading-7 text-[#404142]'>Pending Tasks: {String(pendingTasks).padStart(2, '0')}</span>
//           </div>
//         </div>

//         <DragDropContext onDragEnd={handleDragEnd}>
//           <div className="grid grid-cols-4 gap-6">
//             {/* Todo Column */}
//             <div className="bg-white rounded-lg p-4 shadow-sm">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="font-semibold text-violet-600">To do</h2>
//                 <button
//                   onClick={() => setIsAddingTask(true)}
//                   className="bg-violet-600 text-white p-1 rounded-lg flex items-center text-sm"
//                 >
//                   <PlusCircle size={16} className="mr-1" /> New Task
//                 </button>
//               </div>
//               {isAddingTask && (
//                 <form onSubmit={handleAddTask} className="mb-4">
//                   <div className="bg-gray-50 rounded-lg p-4 space-y-3">
//                     <div className="flex justify-between items-start">
//                       <input
//                         type="text"
//                         value={newTaskTitle}
//                         onChange={(e) => setNewTaskTitle(e.target.value)}
//                         placeholder="Enter task title..."
//                         className="w-full bg-transparent text-sm focus:outline-none"
//                         autoFocus
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setIsAddingTask(false)}
//                         className="text-gray-400 hover:text-gray-600"
//                       >
//                         <X size={16} />
//                       </button>
//                     </div>
//                     <div className="flex justify-end space-x-2">
//                       <button
//                         type="button"
//                         onClick={() => setIsAddingTask(false)}
//                         className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
//                       >
//                         Cancel
//                       </button>
//                       <button
//                         type="submit"
//                         className="px-3 py-1 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700"
//                       >
//                         Add Task
//                       </button>
//                     </div>
//                   </div>
//                 </form>
//               )}
//               <Droppable droppableId={COLUMN_IDS.todo}>
//                 {(provided) => (
//                   <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="space-y-4"
//                   >
//                     {getTasksByStatus('todo').map((task, index) => (
//                       <TaskCard key={task.id} task={task} index={index} />
//                     ))}
//                     {provided.placeholder}
//                   </div>
//                 )}
//               </Droppable>
//             </div>

//             {/* In Progress Column */}
//             <div className="bg-white rounded-lg p-4 shadow-sm">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="font-semibold text-orange-600">In Progress</h2>
//                 <span className="text-gray-600">{getStatusCount('inProgress')}</span>
//               </div>
//               <Droppable droppableId={COLUMN_IDS.inProgress}>
//                 {(provided) => (
//                   <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="space-y-4"
//                   >
//                     {getTasksByStatus('inProgress').map((task, index) => (
//                       <TaskCard key={task.id} task={task} index={index} />
//                     ))}
//                     {provided.placeholder}
//                   </div>
//                 )}
//               </Droppable>
//             </div>

//             {/* Review Column */}
//             <div className="bg-white rounded-lg p-4 shadow-sm">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="font-semibold text-yellow-600">Review</h2>
//                 <span className="text-gray-600">{String(getStatusCount('review')).padStart(2, '0')}</span>
//               </div>
//               <Droppable droppableId={COLUMN_IDS.review}>
//                 {(provided) => (
//                   <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="space-y-4"
//                   >
//                     {getTasksByStatus('review').map((task, index) => (
//                       <TaskCard key={task.id} task={task} index={index} />
//                     ))}
//                     {provided.placeholder}
//                   </div>
//                 )}
//               </Droppable>
//             </div>

//             {/* Done Column */}
//             <div className="bg-white rounded-lg p-4 shadow-sm">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="font-semibold text-green-600">Done</h2>
//                 <span className="text-gray-600">{getStatusCount('done')}</span>
//               </div>
//               <Droppable droppableId={COLUMN_IDS.done}>
//                 {(provided) => (
//                   <div
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     className="space-y-4"
//                   >
//                     {getTasksByStatus('done').map((task, index) => (
//                       <TaskCard key={task.id} task={task} index={index} />
//                     ))}
//                     {provided.placeholder}
//                   </div>
//                 )}
//               </Droppable>
//             </div>
//           </div>
//         </DragDropContext>
//       </div>
//     </div>
//   );
// }

// function TaskCard({ task, index }: { task: Task; index: number }) {
//   return (
//     <Draggable draggableId={task.id} index={index}>
//       {(provided) => (
//         <div
//           ref={provided.innerRef}
//           {...provided.draggableProps}
//           {...provided.dragHandleProps}
//           className="bg-[#F5F5F9] rounded-[10px] shadow-lg p-4 space-y-3"
//         >
//           <p className="text-[#C4C7CF] font-medium text-xs leading-7">{task.createdAt}</p>
//           <p className="text-[13px] font-medium leading-5 text-[#404142]">{task.title}</p>
//           <div className="flex justify-between items-center">
//             <div className="flex items-center space-x-2">
//               <span className="text-xs text-gray-500">15</span>
//             </div>
//             <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
//               <User size={14} className="text-gray-600" />
//             </div>
//           </div>
//         </div>
//       )}
//     </Draggable>
//   );
// }

// export default Task;



import React, { useState , useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, User, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { AttendanceContext } from './AttendanceContext';
interface devops {
  id : string;
  full_name : string;
}
interface Project {
  id: string;
  title: string;
  type: 'Front-End Developer' | 'Back End Developer';
  devops: { id: string; name: string }[];
  created_at: string;
  start_date?: string;
} 
 

function Task() {
  const navigate = useNavigate();
  const [Loading , setLoading] = useState (false);
  const  [ProjectId , setProjectId] = useState('');
  const [devops , setdevops] = useState<devops[]>([]);
  // const [setDevs] = useContext(AttendanceContext)
  


  const [projects, setProjects] = useState<Project[]>([

  ]);
    // Fetch projects
    useEffect(() => {
      const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("projects")
          .select("*");

          if (data && data.length) {
            const userId = localStorage.getItem("user_id");
            console.log("User_Id:", userId);
            
            const filteredTasks = data.filter(task => {
              // Check if devops array includes the current user by ID
              return Array.isArray(task.devops) && task.devops.some(dev => dev.id === userId);
            }); 
            setProjects(filteredTasks);
          } else {
            console.log("No tasks found");
          }

        setLoading(false);
      };
      fetchProjects();
    }, []);

    



  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[26px] font-bold">Your Project</h1>
        </div>
        {projects.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">You are Not Assigned To Any Project.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-[20px] w-[316px] min-h-[238px] p-6 shadow-xl cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {navigate(`/board/${project.id}`)
                  //  setDevs(project.devops)
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center px-4 py-1  bg-[#F4F6FC] rounded-full ">
                  <span className={`w-2 h-2 rounded-full bg-[#9A00FF]
                    }`}></span>&nbsp;&nbsp;
                  <span className="text-sm font-semibold text-[#9A00FF]">{project.type}</span>
                </div>      
              </div>
              <h3 className="text-[22px] font-semibold text-[#263238] mb-4">{project.title}</h3>
              <div className="flex gap-10 flex-col items-start justify-between">
              <div className="mb-2">
                      <span className='leading-7 text-[#686a6d]'>
                        <label className='font-semibold'>DevOps: </label>
                        <ul className='ml-2 list-disc list-inside'>
                          {project.devops.map((dev) => (
                            <li key={dev.id}>{dev.name}</li>
                          ))}
                        </ul>
                      </span>
                    </div>
                <div>
                  <span className='font-medium text-base leading-7 text-[#C4C7CF]'>  {formatDistanceToNow(new Date(project.created_at))} ago</span>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Task;