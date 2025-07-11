import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        {projectManager ? (
          <ProjectManager />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Projects</h1>
            </div>

            {loading ? (
              <div className="text-center mt-12 text-gray-500 text-lg">Loading...</div>
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 mt-20 text-lg">
                You are not assigned to any projects.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                  const isProductOwner = project.product_owner === userId;
                  const createdDate = new Date(project.created_at);
                  const relativeTime = formatDistanceToNow(createdDate);
                  const absoluteTime = format(createdDate, 'MMM d, yyyy');

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-[20px] w-full min-h-[238px] p-6 shadow-xl transition-shadow hover:shadow-md cursor-pointer flex flex-col justify-between"
                      onClick={() => navigate(`/board/${project.id}`)}
                    >
                      {/* Header */}
                      <div className="flex flex-col mb-4">
                        <div className="flex items-center px-4 py-1 bg-[#F4F6FC] rounded-full whitespace-nowrap self-start">
                          <span className="w-2 h-2 rounded-full bg-[#9A00FF] mr-2 flex-shrink-0"></span>
                          <span className="text-sm font-semibold text-[#9A00FF] truncate">{project.type}</span>
                        </div>

                        {isProductOwner && (
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-3 py-0.5 shadow-sm whitespace-nowrap self-start mt-2">
                            Product Owner
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-[#263238] mb-4 text-ellipsis overflow-hidden whitespace-nowrap">
                        {project.title}
                      </h3>

                      {/* Content */}
                      <div className="flex flex-col justify-between flex-grow">
                        {/* Developers */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 font-semibold">Developers:</p>
                          <ul className="ml-4 mt-1 list-disc text-sm text-gray-700">
                            {project.devops?.length > 0 ? (
                              project.devops.map((dev) => (
                                <li key={dev.id}>{dev.name}</li>
                              ))
                            ) : (
                              <li className="text-gray-400 italic">No developers</li>
                            )}
                          </ul>
                        </div>

                        {/* Time Info */}
                        <div className="text-sm text-gray-400 font-medium mt-auto pt-2">
                          {relativeTime} ago &bull; <span className="italic">{absoluteTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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