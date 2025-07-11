/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Settings, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  title: string;
  count: number;
  color: string;
  bgColor: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, count, color, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-4 md:p-6 flex flex-col items-center justify-center min-h-[120px] shadow-sm`}>
    <h3 className={`text-xs md:text-sm font-medium mb-2 md:mb-3 ${color} text-center`}>{title}</h3>
    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-4 ${color.replace('text-', 'border-')} flex items-center justify-center`}>
      <span className={`text-xl md:text-2xl font-bold ${color}`}>{count}</span>
    </div>
  </div>
);

interface ProjectRowProps {
  name: string;
  inReview: number;
  inProgress: number;
  highPriority: number;
  pendingTask: number;
  done: string;
  totalTask: number;
  productivity: number;
  status: string;
  projectId: string;
}

const ProjectRow: React.FC<ProjectRowProps> = ({
  name,
  inReview,
  inProgress,
  highPriority,
  pendingTask,
  done,
  totalTask,
  productivity,
  status,
  projectId
}) => {
  const navigate = useNavigate();

  const handleOpenProject = () => {
    navigate(`/board/${projectId}`);
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 px-2 text-left">
        <h3 className="font-medium text-gray-900 text-sm md:text-base">{name}</h3>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="text-purple-600 font-medium text-sm md:text-base">{inReview}</span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="text-yellow-600 font-medium text-sm md:text-base">{inProgress}</span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="text-red-600 font-medium text-sm md:text-base">{highPriority.toString().padStart(2, '0')}</span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="text-red-500 font-medium text-sm md:text-base">{pendingTask}</span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="text-green-600 font-medium text-sm md:text-base">{done}</span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="text-blue-600 font-medium text-sm md:text-base">{totalTask}</span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
          {productivity}%
        </span>
      </td>
      <td className="py-4 px-2 text-center">
        <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
          {status}
        </span>
      </td>
      <td className="py-4 px-2 text-center">
        <button
          onClick={handleOpenProject}
          className="bg-black text-white px-8 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
          Open Project
        </button>
      </td>
    </tr>
  );
};

// Mobile version of ProjectRow
const ProjectRowMobile: React.FC<ProjectRowProps> = ({
  name,
  inReview,
  inProgress,
  highPriority,
  pendingTask,
  done,
  totalTask,
  productivity,
  status,
  projectId
}) => {
  const navigate = useNavigate();

  const handleOpenProject = () => {
    navigate(`/board/${projectId}`);
  };

  return (
    <div className="border-b border-gray-100 py-4">
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 text-base">{name}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">In Review:</span>
          <span className="text-purple-600 font-medium text-sm">{inReview}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">In Progress:</span>
          <span className="text-yellow-600 font-medium text-sm">{inProgress}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">High Priority:</span>
          <span className="text-red-600 font-medium text-sm">{highPriority.toString().padStart(2, '0')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Pending Task:</span>
          <span className="text-red-500 font-medium text-sm">{pendingTask}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Done:</span>
          <span className="text-green-600 font-medium text-sm">{done}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Total Task:</span>
          <span className="text-blue-600 font-medium text-sm">{totalTask}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Productivity:</span>
          <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
            {productivity}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Status:</span>
          <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
            {status}
          </span>
        </div>
      </div>
      <button
        onClick={handleOpenProject}
        className="w-full bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
        Open Project
      </button>
    </div>
  );
};

interface TeamMemberProps {
  name: string;
  project: string;
  completedTasks: number;
  assignTasks: number;
  inProgress: number;
  status: string;
}

const TeamMemberRow: React.FC<TeamMemberProps> = ({
  name,
  project,
  completedTasks,
  assignTasks,
  inProgress,
  status
}) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-4 px-2 text-left">
      <span className="text-gray-900 font-medium text-sm md:text-base">{name}</span>
    </td>
    <td className="py-4 px-2 text-center">
      <span className="text-gray-600 text-sm md:text-base">{project}</span>
    </td>
    <td className="py-4 px-2 text-center">
      <span className="text-green-600 font-medium text-sm md:text-base">{completedTasks}</span>
    </td>
    <td className="py-4 px-2 text-center">
      <div className="flex flex-col items-center space-y-1">
        <span className="text-red-500 font-medium text-sm">Assign ({assignTasks})</span>
        <span className="text-yellow-600 font-medium text-sm">In Progress ({inProgress})</span>
      </div>
    </td>
    <td className="py-4 px-2 text-center">
      <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
        {status}
      </span>
    </td>
  </tr>
);

// Mobile version of TeamMemberRow
const TeamMemberRowMobile: React.FC<TeamMemberProps> = ({
  name,
  project,
  completedTasks,
  assignTasks,
  inProgress,
  status
}) => (
  <div className="border-b border-gray-100 py-4">
    <div className="mb-3">
      <span className="text-gray-900 font-medium text-base">{name}</span>
    </div>
    <div className="grid grid-cols-1 gap-2 mb-4">
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">Project:</span>
        <span className="text-gray-600 text-sm">{project}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">Completed Tasks:</span>
        <span className="text-green-600 font-medium text-sm">{completedTasks}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">Assigned Tasks:</span>
        <span className="text-red-500 font-medium text-sm">{assignTasks}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">In Progress:</span>
        <span className="text-yellow-600 font-medium text-sm">{inProgress}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">Status:</span>
        <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
          {status}
        </span>
      </div>
    </div>
  </div>
);

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  inReview: number;
  done: number;
}

const ClientDashboard: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);

  interface Project {
    id: string;
    title: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    created_at: string;
    created_by: string;
    devops: Array<{ id: string, name: string }>;
    type: string;
    product_owner: string | null;
    [key: string]: any;
  }

  interface TeamMember {
    id: string;
    name: string;
    project_id?: string;
    project_title?: string;
    [key: string]: any;
  }

  interface UserProfile {
    id: string;
    full_name?: string;
    email?: string;
    [key: string]: any;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    inReview: 0,
    done: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to calculate project statistics
  const calculateProjectStats = async (projectId: string) => {
    try {
      // Fetch tasks for this specific project from the tasks_of_projects table
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks_of_projects')
        .select('*')
        .eq('project_id', projectId);

      if (tasksError) {
        console.warn('Error fetching tasks for project:', projectId, tasksError);
        return {
          inReview: 0,
          inProgress: 0,
          highPriority: 0,
          pendingTask: 0,
          done: '0/0',
          totalTask: 0,
          productivity: 0,
          status: 'Unknown',
          projectId: projectId
        };
      }

      const taskList = tasks || [];
      const totalTasks = taskList.length;
      const doneTasks = taskList.filter(t => t.status === 'done').length;
      const inProgressTasks = taskList.filter(t => t.status === 'inProgress').length;
      const inReviewTasks = taskList.filter(t => t.status === 'review').length;
      const pendingTasks = taskList.filter(t => t.status === 'todo').length;
      const highPriorityTasks = taskList.filter(t => t.priority === 'High').length;

      const productivity = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      let status = 'Good';
      if (productivity >= 80) status = 'Excellent';
      else if (productivity >= 60) status = 'Good';
      else if (productivity >= 40) status = 'Average';
      else status = 'Poor';

      return {
        inReview: inReviewTasks,
        inProgress: inProgressTasks,
        highPriority: highPriorityTasks,
        pendingTask: pendingTasks,
        done: `${doneTasks}/${totalTasks}`,
        totalTask: totalTasks,
        productivity,
        status,
        projectId: projectId
      };
    } catch (err) {
      console.error('Error calculating project stats:', err);
      return {
        inReview: 0,
        inProgress: 0,
        highPriority: 0,
        pendingTask: 0,
        done: '0/0',
        totalTask: 0,
        productivity: 0,
        status: 'Unknown',
        projectId: projectId
      };
    }
  };

  const calculateMemberStats = async (userId: string, projectId: string) => {
    try {
      // Fetch tasks for this specific project
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks_of_projects')
        .select('*')
        .eq('project_id', projectId);

      if (tasksError) {
        console.warn('Error fetching member tasks:', tasksError);
        return {
          completedTasks: 0,
          assignTasks: 0,
          inProgress: 0
        };
      }

      // Filter tasks where this user is in the devops array
      const userTasks = tasks?.filter(task => {
        if (!task.devops) return false;

        // Handle devops whether it's already an array or a string that needs parsing
        let devopsArray;
        if (typeof task.devops === 'string') {
          try {
            devopsArray = JSON.parse(task.devops);
          } catch (e) {
            return false;
          }
        } else {
          devopsArray = task.devops;
        }

        return Array.isArray(devopsArray) && devopsArray.some((dev: any) => dev.id === userId);
      }) || [];

      const completedTasks = userTasks.filter(t => t.status === 'done').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'inProgress').length;
      const assignedTasks = userTasks.filter(t => t.status === 'todo').length;

      return {
        completedTasks,
        assignTasks: assignedTasks,
        inProgress: inProgressTasks
      };
    } catch (err) {
      console.error('Error calculating member stats:', err);
      return {
        completedTasks: 0,
        assignTasks: 0,
        inProgress: 0
      };
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile fetch error:', profileError);
      }

      setUserProfile(profile);

      // Fetch projects where user is the creator or product owner
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .or(`created_by.eq.${currentUser.id},product_owner.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (projectsError) {
        throw new Error('Projects fetch error: ' + projectsError.message);
      }

      setProjects(projectsData || []);

      // Extract team members from projects' devops arrays
      const allTeamMembers: TeamMember[] = [];

      projectsData?.forEach(project => {
        if (project.devops && Array.isArray(project.devops)) {
          project.devops.forEach((member: { id: string; name: string }) => {
            allTeamMembers.push({
              id: member.id,
              name: member.name,
              project_id: project.id,
              project_title: project.title
            } as TeamMember);
          });
        }
      });

      setTeamMembers(allTeamMembers);

      // Fetch task statistics for all projects
      const projectIds = projectsData?.map(p => p.id) || [];
      await fetchTaskStats(projectIds);

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async (projectIds: string[]) => {
    try {
      if (projectIds.length === 0) {
        setTaskStats({
          total: 0,
          pending: 0,
          inProgress: 0,
          inReview: 0,
          done: 0
        });
        return;
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks_of_projects')
        .select('status, priority')
        .in('project_id', projectIds);

      if (tasksError) {
        console.warn('Tasks fetch error:', tasksError);
        return;
      }

      const taskList = tasks || [];
      const stats = {
        total: taskList.length,
        pending: taskList.filter(t => t.status === 'todo').length,
        inProgress: taskList.filter(t => t.status === 'inProgress').length,
        inReview: taskList.filter(t => t.status === 'review').length,
        done: taskList.filter(t => t.status === 'done').length
      };

      setTaskStats(stats);

    } catch (err) {
      console.error('Error fetching task stats:', err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  // Transform projects data with calculated statistics
  const [projectsWithStats, setProjectsWithStats] = useState<any[]>([]);
  const [membersWithStats, setMembersWithStats] = useState<any[]>([]);

  useEffect(() => {
    const loadProjectStats = async () => {
      if (projects.length > 0) {
        const projectsWithCalculatedStats = await Promise.all(
          projects.map(async (project) => {
            const stats = await calculateProjectStats(project.id);
            return {
              name: project.title || 'Unnamed Project',
              ...stats,
              projectId: project.id
            };
          })
        );
        setProjectsWithStats(projectsWithCalculatedStats);
      }
    };

    loadProjectStats();
  }, [projects]);

  useEffect(() => {
    const loadMemberStats = async () => {
      if (teamMembers.length > 0) {
        const membersWithCalculatedStats = await Promise.all(
          teamMembers.map(async (member) => {
            const stats = await calculateMemberStats(member.id, member.project_id || '');
            return {
              name: member.name || 'Unknown',
              project: member.project_title || 'Unknown Project',
              ...stats,
              status: 'Active' // Assuming all devops members are active
            };
          })
        );
        setMembersWithStats(membersWithCalculatedStats);
      }
    };

    loadMemberStats();
  }, [teamMembers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchUserData}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="relative mb-6">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full px-4 py-2 shadow-sm">
            <div className="relative">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-sm font-medium text-blue-700">Under Development</span>
            <div className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
              Beta
            </div>
          </div>
        </div>

        <div className="max-w-full lg:max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome {userProfile?.full_name || 'User'}!
            </h1>
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <span className="text-gray-600 text-sm md:text-base text-center md:text-left">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <button className="flex items-center justify-center md:justify-start space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">Table View</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Task Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
            <TaskCard
              title="Total Task"
              count={taskStats.total}
              color="text-blue-600"
              bgColor="bg-white"
            />
            <TaskCard
              title="Pending Task"
              count={taskStats.pending}
              color="text-red-500"
              bgColor="bg-white"
            />
            <TaskCard
              title="In Progress"
              count={taskStats.inProgress}
              color="text-yellow-600"
              bgColor="bg-white"
            />
            <TaskCard
              title="In Review"
              count={taskStats.inReview}
              color="text-purple-600"
              bgColor="bg-white"
            />
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <TaskCard
                title="Done Task"
                count={taskStats.done}
                color="text-green-600"
                bgColor="bg-white"
              />
            </div>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-lg p-4 md:p-6 mb-6 md:mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Projects</h2>
              </div>
              <button className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">All Projects</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
              <h3 className="text-base md:text-lg font-medium text-gray-900">Active Projects</h3>
              <button className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-lg px-6 md:px-8 py-2 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700">Today</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {projectsWithStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-2">No projects found</p>
                <p className="text-gray-400 text-sm">Create your first project to get started!</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Project</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-purple-600">In Review</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-yellow-600">In Progress</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-red-600">High Priority</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-red-500">Pending Task</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-green-600">Done</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-blue-600">Total Task</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Productivity</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectsWithStats.map((project, index) => (
                        <ProjectRow key={index} {...project} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {projectsWithStats.map((project, index) => (
                    <ProjectRowMobile key={index} {...project} />
                  ))}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-center items-center space-x-4 mt-6">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">Page 1 of 1</span>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4 md:mb-6">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Team Members</h2>
            </div>

            {membersWithStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg mb-2">No team members found</p>
                <p className="text-gray-400 text-sm">Add team members to your projects to see their activity!</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Project</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Completed Tasks</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Tasks</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersWithStats.map((member, index) => (
                        <TeamMemberRow key={index} {...member} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {membersWithStats.map((member, index) => (
                    <TeamMemberRowMobile key={index} {...member} />
                  ))}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-center items-center space-x-4 mt-6">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">Page 1 of 1</span>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;