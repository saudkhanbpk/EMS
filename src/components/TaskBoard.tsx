import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusCircle, User, X, ArrowLeft, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuthStore } from '../lib/store';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AttendanceContext } from '../pages/AttendanceContext';
import Comments from '../pages/Comments';

interface Task {
  id: string;
  title: string;
  created_at: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  score: number;
  priority?: string;
  devops?: Array<{ id: string, name: string }>;
  description?: string;
  imageurl?: string;
  comments?: Array<any>;
  commentCount?: number;
}

const COLUMN_IDS = {
  todo: 'todo',
  inProgress: 'inProgress',
  review: 'review',
  done: 'done'
};

function TaskBoard({ setSelectedTAB }) {
  const { projectIdd, devopsss } = useContext(AttendanceContext);
  const user = useAuthStore();
  const { id } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalKPI, setTotalKPI] = useState(0);
  const [earnedKPI, setEarnedKPI] = useState(0);
  const [assignedKPIs, setAssignedKPIs] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentByTaskID, setCommentByTaskID] = useState({});
  const navigate = useNavigate();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(false);


  useEffect(() => {
    const fetchTasks = async () => {
      const { data: taskData, error: taskError } = await supabase
        .from("tasks_of_projects")
        .select("*")
        .eq("project_id", id || projectIdd[0])
        .order("created_at", { ascending: true });

      if (taskData && !taskError) {
        const userId = localStorage.getItem("user_id");

        // Filter tasks based on devops condition
        const filteredTasks = taskData.filter((task) => {
          return (
            (Array.isArray(task.devops) &&
              task.devops.some((dev) => dev.id === userId)) ||
            !task.devops ||
            task.devops.length === 0
          );
        });

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("*");

        if (commentsData && !commentsError) {
          // Fetch users for commentor names
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, full_name");

          if (usersData && !usersError) {
            // Create user map
            const userMap = {};
            usersData.forEach((user) => {
              userMap[user.id] = user.full_name;
            });

            // Add commentor_name to each comment
            const enrichedComments = commentsData.map((comment) => ({
              ...comment,
              commentor_name: userMap[comment.user_id] || "Unknown User",
            }));

            setComments(enrichedComments);

            // Map comments to each task
            const tasksWithComments = filteredTasks.map((task) => {
              const taskComments = enrichedComments.filter(
                (comment) => comment.task_id === task.id
              );
              return {
                ...task,
                comments: taskComments,
                commentCount: taskComments.length,
              };
            });

            setTasks(tasksWithComments);

            // Group comments by task_id
            const commentsByTask = enrichedComments.reduce((acc, comment) => {
              if (!acc[comment.task_id]) acc[comment.task_id] = [];
              acc[comment.task_id].push(comment);
              return acc;
            }, {});

            setCommentByTaskID(commentsByTask);
          }
        }
      }
    };

    fetchTasks();
  }, [id, projectIdd]);

  useEffect(() => {
    const fetchKPI = async () => {
      const { data, error } = await supabase
        .from('tasks_of_projects')
        .select("score, status, devops")
        .eq("project_id", id);

      if (data && !error) {
        const userId = localStorage.getItem("user_id");

        const earnedScores = data
          .filter(task => task.status === "done" && task.devops?.some(devop => devop.id === userId))
          .map(task => task.score || 0);
        const totalEarnedScore = earnedScores.reduce((sum, score) => sum + score, 0);
        setEarnedKPI(totalEarnedScore);

        const assignedScores = data
          .filter(task => task.devops?.some(devop => devop.id === userId))
          .map(task => task.score || 0);
        const totalAssignedScore = assignedScores.reduce((sum, score) => sum + score, 0);
        setAssignedKPIs(totalAssignedScore);

        const totalScores = data.map(task => task.score || 0);
        const total = totalScores.reduce((sum, score) => sum + score, 0);
        setTotalKPI(total);
      }
    };

    fetchKPI();
  }, [id]);

  const getTasksByStatus = (status: Task['status']) =>
    tasks.filter(task => task.status === status);

  const getStatusCount = (status: Task['status']) =>
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

    draggedTask.status = destination.droppableId as Task['status'];
    newTasks.splice(insertIndex, 0, draggedTask);

    setTasks(newTasks);

    try {
      const { error } = await supabase
        .from('tasks_of_projects')
        .update({ status: destination.droppableId })
        .eq('id', draggedTask.id);

      if (error) {
        console.error('Error updating task status:', error.message);
      }
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center ml-6 mb-8">
          <Link
            to={localStorage.getItem("user_email")?.endsWith("@admin.com") ? "/admin" : "/"}
            className="text-gray-600 hover:text-gray-800"
            onClick={(e) => {
              e.preventDefault();
              const isAdmin = localStorage.getItem("user_email")?.endsWith("@admin.com");
              navigate(isAdmin ? "/admin" : "/tasks");
            }}
          >
            <ArrowLeft
              className="hover:bg-gray-300 rounded-2xl"
              size={24}
              onClick={() => setSelectedTAB("Projects")}
            />
          </Link>

          <div className="flex-1 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Work Planner</h1>
            <div className="text-sm text-gray-600">
              <span className='font-semibold text-[13px] text-red-500 mr-2'>Total Tasks: <strong>{totalTasks}</strong></span>
              <span className='font-semibold text-[13px] text-yellow-600'>Pending Tasks: <strong>{String(pendingTasks).padStart(2, '0')}</strong></span>
              <span className="mx-3 font-semibold text-[13px] text-green-500">Completed Tasks: <strong>{completedTasks}</strong></span>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-6">
            {/* Todo Column */}
            <div className="bg-white rounded-[20px] p-4 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl leading-7 text-[#9A00FF]">To do</h2>
                {user?.user.role === "admin" && (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="bg-[#9A00FF] text-white p-2 rounded-[9px] flex items-center text-[10px] font-bold"
                  >
                    <Plus size={16} className="mr-1" /> New Task
                  </button>
                )}
              </div>
              <Droppable droppableId={COLUMN_IDS.todo}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''}`}
                  >
                    {getTasksByStatus('todo').length > 0 ? (
                      getTasksByStatus('todo').map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          commentByTaskID={commentByTaskID}
                          descriptionOpen={descriptionOpen}
                          setDescriptionOpen={setDescriptionOpen}
                        />
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
                    className={`space-y-4 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''}`}
                  >
                    {getTasksByStatus('inProgress').length > 0 ? (
                      getTasksByStatus('inProgress').map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          commentByTaskID={commentByTaskID}
                          descriptionOpen={descriptionOpen}
                          setDescriptionOpen={setDescriptionOpen}
                        />
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
                <h2 className="font-semibold text-xl leading-7 text-yellow-600">Review</h2>
                <span className="text-gray-600">{String(getStatusCount('review')).padStart(2, '0')}</span>
              </div>
              <Droppable droppableId={COLUMN_IDS.review}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-4 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''}`}
                  >
                    {getTasksByStatus('review').length > 0 ? (
                      getTasksByStatus('review').map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          commentByTaskID={commentByTaskID}
                          descriptionOpen={descriptionOpen}
                          setDescriptionOpen={setDescriptionOpen}
                        />
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

  <div className="space-y-4 min-h-[100px]">
    <p className='text-sm text-gray-400 font-semibold text-center'>Completed Tasks</p>
    
    {getTasksByStatus('done').length > 0 ? (
      getTasksByStatus('done').map((task, index) => (
        // Render a simplified version of TaskCard without Draggable
        <div 
          key={task.id}
          className="group bg-[#F5F5F9] rounded-[10px] shadow-lg px-4 pt-4 pb-3 space-y-2 mb-3"
          onClick={() => {
            setOpenedTask(task);
            setDescriptionOpen(true);
          }}
        >
          {/* Title */}
          <p className="text-[14px] leading-5 font-semibold text-[#404142]">{task.title}</p>

          {/* Priority & Score */}
          <div className="flex flex-row items-center gap-3">
            {task.priority && (
              <span className={`text-[12px] text-white font-semibold rounded px-2 py-[2px] capitalize
                ${task.priority === "High" ? "bg-red-500" :
                  task.priority === "Medium" ? "bg-yellow-600" :
                  task.priority === "Low" ? "bg-green-400" : ""}`}>
                {task.priority}
              </span>
            )}
            <span className="text-[13px] text-[#404142] font-medium">{task.score}</span>
          </div>

          {/* Devops Info + Comments */}
          {task.devops?.length > 0 && (
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#9A00FF] text-white font-medium font-semibold flex items-center justify-center">
                  {task.devops.map((dev) => dev.name[0].toUpperCase()).join("")}
                </div>
                <span className="text-[13px] text-[#404142]">
                  {task.devops.map((dev) => dev.name.charAt(0).toUpperCase() + dev.name.slice(1)).join(", ")}
                </span>
              </div>
              {task.commentCount > 0 && (
                <span className="text-sm text-gray-600">
                  {task.commentCount} {task.commentCount === 1 ? "comment" : "comments"}
                </span>
              )}
            </div>
          )}

          {/* Time */}
          <div className="flex justify-between items-center">
            <p className="text-[12px] text-[#949597]">{formatDistanceToNow(new Date(task.created_at))} ago</p>
          </div>

          {/* Comments Section */}
          <div>
            <Comments taskid={task.id} />
          </div>
        </div>
      ))
    ) : (
      <div className="p-4 text-center text-gray-400">
        No completed tasks
      </div>
    )}
  </div>
</div>

          </div>
        </DragDropContext>
      </div>
      <div className={` ${descriptionOpen ? "hidden" : ""} fixed bottom-6 flex flex-row right-16 bg-[#ffffff] rounded-2xl shadow-lg p-4 mr-5 text-right gap-3 z-50`}>
        <p className='font-bold text-[13px] text-red-500'>Total KPIs: {totalKPI}</p>
        <p className='font-bold text-[13px] text-yellow-600'>Assigned KPIs: {assignedKPIs}</p>
        <p className='font-bold text-[13px] text-green-600'>Earned KPIs: {earnedKPI}</p>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  index: number;
  commentByTaskID: Record<string, any[]>;
  descriptionOpen: boolean;
  setDescriptionOpen: (open: boolean) => void;
}

const TaskCard = ({ task, index, commentByTaskID, descriptionOpen, setDescriptionOpen }: TaskCardProps) => {
  const [openedTask, setOpenedTask] = useState<Task | null>(null);
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className="group bg-[#F5F5F9] rounded-[10px] shadow-lg px-4 pt-4 pb-3 space-y-2 mb-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
          onClick={() => {
            setOpenedTask(task);
            setDescriptionOpen(true);
          }}
        >
          {/* Title */}
          <p className="text-[14px] leading-5 font-semibold text-[#404142]">{task.title}</p>

          {/* Priority & Score */}
          <div className="flex flex-row items-center gap-3">
            {task.priority && (
              <span
                className={`text-[12px] text-white font-semibold rounded px-2 py-[2px] capitalize
                  ${task.priority === "High"
                    ? "bg-red-500"
                    : task.priority === "Medium"
                      ? "bg-yellow-600"
                      : task.priority === "Low"
                        ? "bg-green-400"
                        : ""
                  }`}
              >
                {task.priority}
              </span>
            )}
            <span className="text-[13px] text-[#404142] font-medium">{task.score}</span>
          </div>

          {/* Devops Info + Comments */}
          {task.devops?.length > 0 && (
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#9A00FF] text-white font-medium font-semibold flex items-center justify-center">
                  {task.devops.map((dev) => dev.name[0].toUpperCase()).join("")}
                </div>
                <span className="text-[13px] text-[#404142]">
                  {task.devops.map((dev) => dev.name.charAt(0).toUpperCase() + dev.name.slice(1)).join(", ")}
                </span>
              </div>
              {task.commentCount > 0 && (
                <span className="text-sm text-gray-600">
                  {task.commentCount} {task.commentCount === 1 ? "comment" : "comments"}
                </span>
              )}
            </div>
          )}

          {/* Time */}
          <div className="flex justify-between items-center">
            <p className="text-[12px] text-[#949597]">{formatDistanceToNow(new Date(task.created_at))} ago</p>
          </div>

          {/* Comments Section */}
          <div>
            <Comments taskid={task.id} />
          </div>

          {/* Modal Description View */}
          {descriptionOpen && openedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in p-6 relative">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{openedTask.title}</h2>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDescriptionOpen(false);
                    }}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Image View */}
                {openedTask.imageurl && (
                  <>
                    <img
                      src={openedTask.imageurl}
                      alt="Task"
                      className="max-w-full p-2 border-2 border-gray-200 rounded-2xl mb-4 max-h-[60vh] object-contain rounded cursor-pointer"
                      onClick={() => {
                        setFullImageUrl(openedTask.imageurl || "");
                        setIsFullImageOpen(true);
                      }}
                    />
                    {isFullImageOpen && (
                      <div
                        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
                        onClick={() => setIsFullImageOpen(false)}
                      >
                        <button
                          className="absolute top-5 right-5 text-white hover:text-gray-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFullImageOpen(false);
                          }}
                        >
                          <X className="w-7 h-7" />
                        </button>
                        <img
                          src={fullImageUrl}
                          alt="Full"
                          className="max-w-[95vw] max-h-[90vh] object-contain"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Description */}
                {openedTask.description && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{openedTask.description}</p>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-6">
                  <div><span className="font-semibold">KPIs:</span> {openedTask.score}</div>
                  <div>
                    <span className="font-semibold">Developer:</span> {openedTask.devops?.map((dev) => dev.name).join(", ")}
                  </div>
                  {openedTask.priority && (
                    <div>
                      <span className="font-semibold">Priority:</span>{" "}
                      <span
                        className={`${openedTask.priority === "High"
                          ? "bg-red-500"
                          : openedTask.priority === "Medium"
                            ? "bg-yellow-600"
                            : openedTask.priority === "Low"
                              ? "bg-green-400"
                              : ""
                          } text-[14px] text-white font-semibold rounded px-2 py-[2px] capitalize`}
                      >
                        {openedTask.priority}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="flex flex-col gap-4">
                  <Comments taskid={openedTask.id} />
                  {commentByTaskID[openedTask.id]?.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {commentByTaskID[openedTask.id].map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="flex items-start space-x-2 bg-gray-50 border rounded-lg p-2 shadow-sm"
                        >
                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold uppercase">
                            {comment.commentor_name?.[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-semibold">{comment.commentor_name}</p>
                              <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskBoard;