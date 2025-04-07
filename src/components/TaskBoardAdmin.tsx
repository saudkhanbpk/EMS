
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusCircle, User, X, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuthStore } from '../lib/store';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AddNewTask from '../AddNewTask';
interface task {
  id: string;
  title: string;  
  created_at: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  score : number;
  devops?: Array<{ id: string, name: string }>; // Make optional
}


interface Developer {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;  
  created_at: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  score: number;
  devops?: Developer[];
  description?: string;
}

const COLUMN_IDS = {
  todo: 'todo',
  inProgress: 'inProgress',
  review: 'review',
  done: 'done'
};

function TaskBoardAdmin({ setSelectedTAB, ProjectId, devopss }) {
  const user = useAuthStore();
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // const [tasks, setTasks] = useState<task[]>([]);
  const getTasksByStatus = (status: task['status']) =>
    tasks.filter(task => task.status === status);

  const getStatusCount = (status: task['status']) =>
    tasks.filter(task => task.status === status).length;

  const totalTasks = tasks.length;
  const completedTasks = getTasksByStatus('done').length;
  const pendingTasks = totalTasks - completedTasks;

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks_of_projects")
        .select("*")
        .eq("project_id", ProjectId);

      if (!error) setTasks(data);
    };
    fetchTasks();
  }, [ProjectId]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newTasks = Array.from(tasks);
    const draggedTask = newTasks.find(task => task.id === draggableId);
    if (!draggedTask) return;

    newTasks.splice(newTasks.indexOf(draggedTask), 1);
    draggedTask.status = destination.droppableId as Task['status'];
    
    const destTasks = newTasks.filter(task => task.status === destination.droppableId);
    const insertAt = destination.index > destTasks.length ? destTasks.length : destination.index;
    newTasks.splice(insertAt, 0, draggedTask);

    setTasks(newTasks);
    
    try {
      const { error } = await supabase
        .from('tasks_of_projects')
        .update({ status: destination.droppableId })
        .eq('id', draggedTask.id);
      
      if (error) console.error('Error updating task status:', error.message);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: String(Date.now()),
      title: newTaskTitle,
      created_at: new Date().toISOString(),
      status: 'todo',
      score: 0
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleEditClick = (task: Task) => {
    setCurrentTask(task);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const { error } = await supabase
        .from('tasks_of_projects')
        .update(updatedTask)
        .eq('id', updatedTask.id);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (DeletedTask: Task) => {
    try {
      const { error } = await supabase
        .from('tasks_of_projects')
        .delete()
        .eq('id', DeletedTask.id);
  
      if (error) {
        throw error;
      }
  
      setTasks(tasks.filter(t => t.id !== DeletedTask.id)); // Remove deleted task
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };
  

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
            className="bg-[#F5F5F9] rounded-[10px] shadow-lg p-4 space-y-1 mb-3"
          >
            <div className='flex flex-row justify-between'>
              <p className="text-[10px] leading-7 font-medium text-[#C4C7CF]">
                {formatDistanceToNow(new Date(task.created_at))} ago
              </p>
              <div className="flex place-content-end space-x-2">
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(task);
                  }}
                >
                  <Pencil size={16} color='#667085' />
                </button>
                <button
                  className="text-gray-400 hover:text-red-600"
                  onClick={(e) => {
                    handleDelete(task);
                    e.stopPropagation()}}
                >
                  <Trash2 size={16} color='#667085' />
                </button>
              </div>
            </div>
            <p className="text-[13px] leading-5 font-medium text-[#404142]">{task.title}</p>
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-left space-x-2">
                <span className="text-[11px] leading-5 font-normal text-[#404142]">{task.score}</span>
                {task.devops && (
                  <span className="text-[11px] leading-5 font-normal text-[#404142]">
                    {task.devops.map((dev) => dev.name).join(", ")}
                  </span>
                )}
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={14} className="text-gray-600" />
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderColumn = (status: keyof typeof COLUMN_IDS, title: string, color: string) => {
    const tasksInColumn = tasks.filter(task => task.status === COLUMN_IDS[status]);
    
    return (
      <div className="bg-white rounded-[20px] p-4 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`font-semibold text-xl leading-7 text-${color}`}>{title}</h2>
          <span className="text-gray-600">{tasksInColumn.length}</span>
        </div>
        <Droppable droppableId={COLUMN_IDS[status]}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="min-h-[100px] space-y-4"
            >
              {tasksInColumn.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-8">
      <div className="max-w-7xl mx-auto">
        {selectedTab === "addtask" && (
          <AddNewTask setselectedtab={setSelectedTab} ProjectId={ProjectId} devopss={devopss}/>
        )}

        {selectedTab === "tasks" && (
          <>
            <div className="flex items-center ml-6 mb-8">
              <Link 
                to={localStorage.getItem("user_email")?.endsWith("@admin.com") ? "/admin" : "/"} 
                className="mr-4 text-gray-600 hover:text-gray-800"
                onClick={(e) => {
                  e.preventDefault();
                  const isAdmin = localStorage.getItem("user_email")?.endsWith("@admin.com");
                  navigate(isAdmin ? "/admin" : "/");
                }}
              >
                <ArrowLeft className='hover:bg-gray-300 rounded-2xl' size={24} onClick={() => setSelectedTAB("Projects")} />
              </Link>
              <div className="flex-1 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Work Planner</h1>
                <div className='bg-[#ffffff] w-[70%] p-3 rounded-2xl flex justify-between font-semibold font-medium'>
                 <h1 className='text-[#9A00FF] '>TO DO: {getStatusCount('todo')}</h1>
                 <h1 className='text-orange-600'>In Progress: {getStatusCount('inProgress')}</h1>
                 <h1 className='text-yellow-600'>Review: {getStatusCount('review')}</h1>
                 <h1 className='text-[#05C815]'>Done: {getStatusCount('done')}</h1>
               </div>
                <div className="text-sm text-gray-600">
                  <button
                    className="bg-[#9A00FF] text-white px-4 py-2 rounded-lg flex items-center"
                    onClick={() => setSelectedTab("addtask")}
                  >
                    <PlusCircle size={20} className="mr-2" /> New Task
                  </button>
                </div>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-4 gap-6">
                {renderColumn('todo', 'To do', '[#9A00FF]')}
                {renderColumn('inProgress', 'In Progress', 'orange-600')}
                {renderColumn('review', 'Review', 'yellow-600')}
                {renderColumn('done', 'Done', '[#05C815]')}
              </div>
            </DragDropContext>
          </>
        )}

        {/* Edit Task Modal */}
        {isEditModalOpen && currentTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Task</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTask(currentTask);
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={currentTask.title}
                    onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={currentTask.description || ''}
                    onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                  <input
                    type="number"
                    value={currentTask.score}
                    onChange={(e) => setCurrentTask({...currentTask, score: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={currentTask.status}
                    onChange={(e) => setCurrentTask({...currentTask, status: e.target.value as Task['status']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="todo">To Do</option>
                    <option value="inProgress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Developers</label>
                  <div className="flex flex-wrap gap-2">
                    {currentTask.devops?.map(dev => (
                      <div key={dev.id} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
                        <span className="mr-2">{dev.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentTask({
                              ...currentTask,
                              devops: currentTask.devops?.filter(d => d.id !== dev.id)
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <select
                    onChange={(e) => {
                      const devId = e.target.value;
                      if (devId && currentTask.devops?.every(d => d.id !== devId)) {
                        const dev = devopss.find((d: Developer) => d.id === devId);
                        if (dev) {
                          setCurrentTask({
                            ...currentTask,
                            devops: [...(currentTask.devops || []), dev]
                          });
                        }
                      }
                    }}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                    value=""
                  >
                    <option value="">Add Developer</option>
                    {devopss?.map((dev: Developer) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#9A00FF] text-white rounded-md hover:bg-[#9900ffe3]"
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskBoardAdmin;