import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
// import { formatDistanceToNow, format } from 'date-fns';
import ProjectManager from '../components/ProjectManager';

interface Project {
  id: string;
  title: string;
  type: 'Front-End Developer' | 'Back End Developer';
  devops: { id: string; name: string }[];
  created_at: string;
  start_date?: string;
  product_owner?: string;
}

function Task() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [projectManager, setProjectManager] = useState(false);

  const userId = localStorage.getItem('user_id');

  // Check if logged-in user is a project manager
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (data?.role === 'project manager') {
        setProjectManager(true);
      } else if (error) {
        console.error('Error fetching user role:', error.message);
      }
    };

    fetchUserRole();
  }, [userId]);

  // Fetch projects where user is a dev OR product owner
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      if (!userId) {
        console.error("Missing user ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("projects").select("*");

      if (error) {
        console.error("Error fetching projects:", error.message);
        setLoading(false);
        return;
      }

      const filteredProjects = (data || []).filter((project) => {
        const isDev = Array.isArray(project.devops) &&
          project.devops.some((dev: { id: string }) => dev.id === userId);
        const isProductOwner = project.product_owner === userId;
        return isDev || isProductOwner;
      });

      setProjects(filteredProjects);
      setLoading(false);
    };

    fetchProjects();
  }, [userId]);

  // Calculate task counts (placeholder logic - you can modify based on your actual task data)
  const getTaskCounts = (project: Project) => {
    // This is placeholder logic - replace with actual task counting from your database
    const totalTasks = project.devops?.length || 0;
    const inProgress = Math.floor(totalTasks * 0.6);
    const pending = totalTasks - inProgress;
    return { inProgress, pending };
  };

  // Determine project status based on tasks
  const getProjectStatus = (project: Project) => {
    const { inProgress, pending } = getTaskCounts(project);
    if (pending === 0) return 'COMPLETED';
    if (inProgress > 0) return 'GOOD';
    return 'PENDING';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        {projectManager ? (
          <ProjectManager />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Projects</h1>
              <button className="bg-[#F1B318] hover:bg-[#C78E2C] text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                Create Project
              </button>
            </div>

            {loading ? (
              <div className="text-center mt-12 text-gray-500 text-lg">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 mt-20 text-lg">
                You are not assigned to any projects.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-[#1a1f37] text-white">
                  <div className="grid grid-cols-7 gap-4 p-4 font-semibold text-sm">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-[#C78E2C] mr-2 fill-current stroke-current" />
                      Name
                    </div>
                    <div>Type</div>
                    <div>Team Members</div>
                    <div>In-Progress</div>
                    <div>Pending</div>
                    <div>Status</div>
                    <div></div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {projects.map((project) => {
                    const isProductOwner = project.product_owner === userId;
                    const { inProgress, pending } = getTaskCounts(project);
                    const status = getProjectStatus(project);
                    const statusColor = status === 'COMPLETED' ? 'text-[#24D72D]' : status === 'GOOD' ? 'text-[#24D72D]' : 'text-yellow-600';

                    return (
                      <div
                        key={project.id}
                        className="grid grid-cols-7 gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/board/${project.id}`)}
                      >
                        {/* Name */}
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-[#979797] mr-2 fill-current stroke-current" />
                          <div>
                            <div className="font-medium text-gray-900">{project.title}</div>
                            {isProductOwner && (
                              <span className="text-xs text-blue-600 bg-blue-100 rounded-full px-2 py-0.5 mt-1 inline-block">
                                Product Owner
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Type */}
                        <div className="flex items-center">
                          <span className="text-sm text-gray-700">
                            {project.type === 'Front-End Developer' ? 'Software Project' :
                              project.type === 'Back End Developer' ? 'Service Management' :
                                project.type || 'Software Project'}
                          </span>
                        </div>

                        {/* Team Members */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {project.devops?.length.toString().padStart(2, '0') || '00'}
                          </span>
                        </div>

                        {/* In-Progress */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-[#C78E2C]">
                            {inProgress.toString().padStart(2, '0')}
                          </span>
                        </div>

                        {/* Pending */}
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-[#FF0F3C]">
                            {pending.toString().padStart(2, '0')}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center">
                          <span className={`text-sm font-bold ${statusColor}`}>
                            {status}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add edit functionality here
                            }}
                            className="text-[#C78E2C] hover:text-yellow-700 p-1"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Description Modal */}
      {descriptionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Task Description</h2>
                <button
                  onClick={() => setDescriptionOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600">Task description goes here...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Task;