import React, { useState , useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusCircle, User, X, ArrowLeft, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuthStore } from '../lib/store';
import AdminDashboard from './AdminDashboard';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AttendanceContext } from '../pages/AttendanceContext';

interface task {
  id: string;
  title: string;  
  created_at: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  score: number;
  // Devs?: Array<{ id:string , name: string }>; // Make optional if not always present
}

const COLUMN_IDS = {
  todo: 'todo',
  inProgress: 'inProgress',
  review: 'review',
  done: 'done'
};

function TaskBoard({setSelectedTAB }) {
  const user = useAuthStore();
  const { id } = useParams();
  const [tasks, setTasks] = useState<task[]>([]);
  // const [Devs]= useContext(AttendanceContext)
  
  useEffect(() => {
    const fetchtasks = async () => {
      const { data, error } = await supabase
        .from("tasks_of_projects")
        .select("*") // Include related devops data if needed
        .eq("project_id", id)
        .order('created_at', { ascending: true });
  
      if (!error) {
        setTasks(data);
      } else {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchtasks();
  }, []);

  const navigate = useNavigate();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const getTasksByStatus = (status: task['status']) =>
    tasks.filter(task => task.status === status);

  const getStatusCount = (status: task['status']) =>
    tasks.filter(task => task.status === status).length;

  const totalTasks = tasks.length;
  const completedTasks = getTasksByStatus('done').length;
  const pendingTasks = totalTasks - completedTasks;

  const handleDragEnd = async (result: DropResult) => {
      const { destination, source, draggableId } = result;
  
      if (!destination) return;
  
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }
  
      const newTasks = Array.from(tasks);
      const draggedTask = newTasks.find(task => task.id === draggableId);
      if (!draggedTask) return;
  
      newTasks.splice(newTasks.indexOf(draggedTask), 1);
      const tasksInDestination = newTasks.filter(task => task.status === destination.droppableId);
      const insertIndex = newTasks.findIndex(task => task.status === destination.droppableId) + destination.index;
  
      draggedTask.status = destination.droppableId as task['status'];
      newTasks.splice(insertIndex, 0, draggedTask);
  
      setTasks(newTasks);
      try {
        const { error } = await supabase
          .from('tasks_of_projects')  // Table Name
          .update({ status: destination.droppableId }) // Update status column
          .eq('id', draggedTask.id); // Find task by ID
    
        if (error) {
          console.error('Error updating task status:', error.message);
          // Optionally, revert the UI state if needed
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
      
    };
  
    const handleAddTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskTitle.trim()) return;
  
      const newTask: task = {
        id: String(Date.now()),
        title: newTaskTitle,
        created_at: 'Just now',
        status: 'todo'
      };
  
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setIsAddingTask(false);
    };
  

  return (
    <div className="min-h-screen  p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center ml-6 mb-8">
        <Link 
            to={"/"} 
            className="mr-4 text-gray-600 hover:text-gray-800"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            } }
          >
          <ArrowLeft className='hover:bg-gray-300  rounded-2xl' size={24} onClick={() => setSelectedTAB("Projects")} />
        </Link>
          <div className="flex-1 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Work Planner</h1>
            <div className="text-sm text-gray-600">
              <span className='font-semibold text-[13px] '>Total Tasks: <strong>{totalTasks}</strong></span>
              <span className="mx-3 font-semibold text-[13px]">Completed Tasks: <strong>{completedTasks}</strong></span>
              <span className='font-semibold text-[13px] '>Pending Tasks: <strong>{String(pendingTasks).padStart(2, '0')}</strong></span>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-6">
            {/* Todo Column */}
            <div className="bg-white rounded-[20px] p-4 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl leading-7 text-[#9A00FF]">To do</h2>
                {
                  user?.user.role === "admin" && (
                    <>
                      <button
                        onClick={() => setIsAddingTask(true)}
                        className="bg-[#9A00FF] text-white p-2 rounded-[9px] flex items-center text-[10px] font-bold"
                      >
                        <Plus size={16} className="mr-1" /> New Task
                      </button>
                    </>
                  )
                }
              </div>
              {isAddingTask && (
                <form onSubmit={handleAddTask} className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title..."
                        className="w-full bg-transparent text-sm focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </form>
              )}
         <Droppable droppableId={COLUMN_IDS.todo}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[100px] ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                    }`}
                  >
                    {getTasksByStatus('todo').length > 0 ? (
                      getTasksByStatus('todo').map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        {snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* In Progress Column */}
            <div className="bg-white rounded-[20px] p-4 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl leading-7 text-orange-600">In Progress</h2>
                <span className="text-gray-600">{getStatusCount('inProgress')}</span>
              </div>
              <Droppable droppableId={COLUMN_IDS.inProgress}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[100px] ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                    }`}
                  >
                    {getTasksByStatus('inProgress').length > 0 ? (
                      getTasksByStatus('inProgress').map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        {snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Review Column */}
            <div className="bg-white rounded-[20px] p-4 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold  text-xl leading-7 text-yellow-600">Review</h2>
                <span className="text-gray-600">{String(getStatusCount('review')).padStart(2, '0')}</span>
              </div>
              <Droppable droppableId={COLUMN_IDS.review}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[100px] ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                    }`}
                  >
                    {getTasksByStatus('review').length > 0 ? (
                      getTasksByStatus('review').map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        {snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Done Column */}
            <div className="bg-white rounded-[20px] p-4 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl leading-7 text-[#05C815]">Done</h2>
                <span className="text-gray-600">{getStatusCount('done')}</span>
              </div>
              <Droppable droppableId={COLUMN_IDS.done}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[100px] ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''
                    }`}
                  >
                    {getTasksByStatus('done').length > 0 ? (
                      getTasksByStatus('done').map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        {snapshot.isDraggingOver ? 'Drop here' : 'No tasks'}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}



function TaskCard({ task, index }: { task: task; index: number }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style} // Add this
          className="bg-[#F5F5F9] rounded-[10px] shadow-lg p-4 space-y-1 mb-3"
        >
          <p className="text-[13px] leading-5 font-medium text-[#404142]">{task.title}</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[11px]">{task.score}</span>
             
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={14} className="text-gray-600" />
            </div>
          </div>
          <p className="text-[10px] text-[#C4C7CF]">
            {formatDistanceToNow(new Date(task.created_at))} ago
          </p>
        </div>
      )}
    </Draggable>
  );
}


export default TaskBoard;
 {/* {task.devops && (
                <span className="text-[11px]">
                  {task.devops.map(dev => dev.name).join(", ")}
                </span>
              )}*/}