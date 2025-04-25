import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import TaskBoardAdmin from './TaskBoardAdmin';
import Select from "react-select";



interface Project {
  id: string;
  title: string;
  type: 'Front-End Developer' | 'Back End Developer' | 'Full Stack Developer';
  devops: { id: string; full_name?: string; name?: string }[];
  created_at: string;
  start_date?: string;
  created_by?: string;
  creatorName?: string; // Added to store the creator's full name
  manager_id?: string; // Added to store the manager's ID
  managerName?: string; // Added to store the manager's name
  completedScore: number;
  pendingScore: number;
  totalScore: number;
}

interface Dev {
  id: string;
  full_name: string;
}
interface devopss {
  id: string;
  name?: string;
  full_name?: string;
}

function ProjectsAdmin() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ProjectId, setProjectId] = useState("");
  const [Devs, setDevs] = useState<Dev[]>([]);
  const [selectedDevs, setSelectedDevs] = useState<{ id: string; name?: string; full_name?: string }[]>([]);
  // Removed unused projectmanager state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTAB, setSelectedTAB] = useState("Projects")
  const [devopss, setdevops] = useState<devopss[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'Front-End Developer' as 'Front-End Developer' | 'Back End Developer' | 'Full Stack Developer',
    manager_id: '',
    managerName: ''
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeesearch, setDataEmployeesearch] = useState(null);


  const filteredEmployees = Devs.filter(Dev =>
    Dev.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch developers
  useEffect(() => {
    const fetchDevs = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, id");
      if (!error) setDevs(data);
    };
    fetchDevs();
  }, []);


  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);

      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*");

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        setLoading(false);
        return;
      }

      // Fetch all users to get creator names
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name");

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      // Create a map of user IDs to full names for quick lookup
      const userMap: Record<string, string> = {};
      if (usersData) {
        usersData.forEach(user => {
          userMap[user.id] = user.full_name;
        });
      }

      // Fetch all tasks for these projects
      const projectsWithScores = await Promise.all(
        projectsData.map(async (project) => {
          // Fetch tasks for this project
          const { data: tasksData, error: tasksError } = await supabase
            .from("tasks_of_projects")
            .select("score, status")
            .eq("project_id", project.id);

          if (tasksError) {
            console.error(`Error fetching tasks for project ${project.id}:`, tasksError);
            return {
              ...project,
              completedScore: 0,
              pendingScore: 0,
              totalScore: 0,
              creatorName: project.created_by ? userMap[project.created_by] || "Unknown" : "Unknown"
            };
          }

          // Calculate scores
          const completedScore = tasksData
            .filter(task => task.status === "done")
            .reduce((sum, task) => sum + (Number(task.score) || 0), 0);

          const pendingScore = tasksData
            .filter(task => task.status !== "done")
            .reduce((sum, task) => sum + (Number(task.score) || 0), 0);

          const totalScore = completedScore + pendingScore;

          // Ensure developers have both name and full_name properties
          const normalizedDevops = project.devops ? project.devops.map((dev: { id: string; name?: string; full_name?: string }) => {
            // If the developer has neither name nor full_name, try to get it from userMap
            if (!dev.name && !dev.full_name && dev.id) {
              const userName = userMap[dev.id];
              return {
                ...dev,
                name: userName || "Unknown",
                full_name: userName || "Unknown"
              };
            }
            // If the developer has full_name but not name, copy full_name to name
            else if (dev.full_name && !dev.name) {
              return {
                ...dev,
                name: dev.full_name
              };
            }
            // If the developer has name but not full_name, copy name to full_name
            else if (dev.name && !dev.full_name) {
              return {
                ...dev,
                full_name: dev.name
              };
            }
            // Otherwise, return the developer as is
            return dev;
          }) : [];

          console.log("Normalized devops for project", project.id, ":", normalizedDevops);

          return {
            ...project,
            devops: normalizedDevops,
            completedScore,
            pendingScore,
            totalScore,
            creatorName: project.created_by ? userMap[project.created_by] || "Unknown" : "Unknown"
          };
        })
      );

      setProjects(projectsWithScores);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const handleChange = (selectedEmployee: { id: string, full_name: string }) => {
    if (!selectedDevs.some(dev => dev.id === selectedEmployee.id)) {
      setSelectedDevs([
        ...selectedDevs,
        {
          id: selectedEmployee.id,
          name: selectedEmployee.full_name,
          full_name: selectedEmployee.full_name,
        },
      ]);
    }
  };

  const handlemanagerchange = (selectedEmployee: { id: string, full_name: string }) => {
    // Update the newProject state with the selected manager
    setNewProject({
      ...newProject,
      manager_id: selectedEmployee.id,
      managerName: selectedEmployee.full_name
    });
  };


  const handleRemove = (id: string) => {
    setSelectedDevs(selectedDevs.filter(dev => dev.id !== id));
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm("Are you sure you want to delete this project?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      setProjects(projects.filter(project => project.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }

    const { error } = await supabase
      .from("tasks_of_projects")
      .delete()
      .eq("project_id", id);
    if (error) throw error;
  };


  const openAddModal = () => {
    setNewProject({
      title: '',
      type: 'Front-End Developer' as 'Front-End Developer' | 'Back End Developer' | 'Full Stack Developer',
      manager_id: '',
      managerName: ''
    });
    setSelectedDevs([]);
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewProject({
      title: project.title,
      type: project.type,
      manager_id: project.created_by || '',
      managerName: project.creatorName || ''
    });

    // Convert devops format to include both name and full_name
    const formattedDevs = (project.devops || []).map(dev => ({
      id: dev.id,
      name: dev.full_name,
      full_name: dev.full_name
    }));
    setSelectedDevs(formattedDevs);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      if (editingProject) {
        // Ensure all developers have both name and full_name properties
        const normalizedDevs = selectedDevs.map(dev => ({
          id: dev.id,
          name: dev.name || dev.full_name || "Unknown",
          full_name: dev.full_name || dev.name || "Unknown"
        }));

        console.log("Normalized developers for updated project:", normalizedDevs);

        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            title: newProject.title,
            type: newProject.type,
            devops: normalizedDevs,
            created_by: newProject.manager_id || editingProject.created_by // Use selected manager or keep existing
          })
          .eq("id", editingProject.id);

        if (error) throw error;
      } else {
        // Ensure all developers have both name and full_name properties
        const normalizedDevs = selectedDevs.map(dev => ({
          id: dev.id,
          name: dev.name || dev.full_name || "Unknown",
          full_name: dev.full_name || dev.name || "Unknown"
        }));

        console.log("Normalized developers for new project:", normalizedDevs);

        // Create new project
        const { error } = await supabase
          .from("projects")
          .insert([{
            title: newProject.title,
            type: newProject.type,
            devops: normalizedDevs,
            created_at: new Date().toISOString(),
            created_by: newProject.manager_id || localStorage.getItem('user_id') // Use selected manager or current user
          }]);

        if (error) throw error;
      }

      // Refresh projects list - use the same fetch logic as in the useEffect
      const { data: projectsData, error } = await supabase.from("projects").select("*");

      if (!error) {
        // Fetch all users to get creator names
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name");

        if (usersError) {
          console.error("Error fetching users:", usersError);
        }

        // Create a map of user IDs to full names for quick lookup
        const userMap: Record<string, string> = {};
        if (usersData) {
          usersData.forEach(user => {
            userMap[user.id] = user.full_name;
          });
        }

        // Process projects with the same logic as in useEffect
        const projectsWithScores = await Promise.all(
          projectsData.map(async (project) => {
            // Fetch tasks for this project
            const { data: tasksData, error: tasksError } = await supabase
              .from("tasks_of_projects")
              .select("score, status")
              .eq("project_id", project.id);

            if (tasksError) {
              console.error(`Error fetching tasks for project ${project.id}:`, tasksError);
              return {
                ...project,
                completedScore: 0,
                pendingScore: 0,
                totalScore: 0,
                creatorName: project.created_by ? userMap[project.created_by] || "Unknown" : "Unknown"
              };
            }

            // Calculate scores
            const completedScore = tasksData
              .filter(task => task.status === "done")
              .reduce((sum, task) => sum + (Number(task.score) || 0), 0);

            const pendingScore = tasksData
              .filter(task => task.status !== "done")
              .reduce((sum, task) => sum + (Number(task.score) || 0), 0);

            const totalScore = completedScore + pendingScore;

            // Ensure developers have both name and full_name properties
            const normalizedDevops = project.devops ? project.devops.map((dev: { id: string; name?: string; full_name?: string }) => {
              // If the developer has neither name nor full_name, try to get it from userMap
              if (!dev.name && !dev.full_name && dev.id) {
                const userName = userMap[dev.id];
                return {
                  ...dev,
                  name: userName || "Unknown",
                  full_name: userName || "Unknown"
                };
              }
              // If the developer has full_name but not name, copy full_name to name
              else if (dev.full_name && !dev.name) {
                return {
                  ...dev,
                  name: dev.full_name
                };
              }
              // If the developer has name but not full_name, copy name to full_name
              else if (dev.name && !dev.full_name) {
                return {
                  ...dev,
                  full_name: dev.name
                };
              }
              // Otherwise, return the developer as is
              return dev;
            }) : [];

            return {
              ...project,
              devops: normalizedDevops,
              completedScore,
              pendingScore,
              totalScore,
              creatorName: project.created_by ? userMap[project.created_by] || "Unknown" : "Unknown"
            };
          })
        );

        setProjects(projectsWithScores);
      }

      closeModal();
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };
  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {selectedTAB === "taskBoard" && (
            <TaskBoardAdmin
              setSelectedTAB={setSelectedTAB}
              selectedTAB={selectedTAB}
              ProjectId={ProjectId}
              devopss={devopss}
            />
          )}

          {selectedTAB == "Projects" && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h1 className="xs:text-[26px] text-[18px] font-bold">Your Projects</h1>
                <button
                  onClick={openAddModal}
                  className="bg-[#9A00FF] xs:text-xl text-[13px] text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <PlusCircle size={20} className="mr-2" /> New Project
                </button>
              </div>

              {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">
                        {editingProject ? "Edit Project" : "Create New Project"}
                      </h2>
                      <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Title
                          </label>
                          <input
                            type="text"
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Enter project title"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Type
                          </label>
                          <select
                            value={newProject.type}
                            onChange={(e) => setNewProject({ ...newProject, type: e.target.value as 'Front-End Developer' | 'Back End Developer' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <option value="Front-End Developer">Front-End Developer</option>
                            <option value="Back End Developer">Back End Developer</option>
                            <option value="Back End Developer">Full Stack Developer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add Manager
                          </label>

                          <Select
                            options={filteredEmployees.map((dev) => ({
                              value: dev.id,
                              label: dev.full_name,
                              fullData: dev, // include full dev object
                            }))}
                            onChange={(selectedOption) => {
                              if (selectedOption) {
                                handlemanagerchange(selectedOption.fullData); // Pass the full dev object
                              }
                            }}
                            placeholder="Search or select Manager..."
                            isSearchable
                            className="w-full"
                            classNamePrefix="react-select"
                          />

                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add Developers
                          </label>

                          <Select
                            options={filteredEmployees.map((dev) => ({
                              value: dev.id,
                              label: dev.full_name,
                              fullData: dev, // include full dev object
                            }))}
                            onChange={(selectedOption) => {
                              if (selectedOption) {
                                handleChange(selectedOption.fullData); // Pass the full dev object
                              }
                            }}
                            placeholder="Search or select DevOps..."
                            isSearchable
                            className="w-full"
                            classNamePrefix="react-select"
                          />

                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedDevs.map((dev) => (
                            <div key={dev.id} className="flex items-center bg-gray-200 px-3 py-1 rounded-md">
                              <span className="mr-2">{dev.name || dev.full_name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(dev.id);
                                }}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#9A00FF] text-white rounded-md hover:bg-violet-700"
                          >
                            {editingProject ? "Update Project" : "Create Project"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.length === 0 ? (
                  <p className="text-gray-500">No projects yet. Create one!</p>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-[20px] w-[316px] min-h-[238px] p-6 shadow-xl cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedTAB("taskBoard");
                        setdevops(project.devops);
                        console.log("Project devops:", project.devops);
                        console.log("Project devops structure:", JSON.stringify(project.devops, null, 2));
                        setProjectId(project.id);
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center pl-2 pr-4 py-1
                       bg-[#f7eaff] rounded-full">

                          <span className="text-sm font-semibold ml-2">
                            <label>Story Points : </label>
                            <span className="text-green-600">{project.completedScore}</span>
                            <span className="text-gray-500"> / </span>
                            <span className="text-red-500">{project.totalScore}</span>
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => openEditModal(project, e)}
                          >
                            <Pencil size={16} color='#667085' />
                          </button>
                          <button
                            className="text-gray-400 hover:text-red-600"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                          >
                            <Trash2 size={16} color='#667085' />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-[22px] font-semibold text-[#263238] mb-4">{project.title}</h3>

                      {project.creatorName != "Unknown" ? (
                        <div>
                          <label className='font-semibold text-[15px] text-[#9A00FF]'>Manager: </label>
                          <span className="text-sm font-semibold text-[#9A00FF]">
                            {project.creatorName || "Unknown"}
                          </span>
                        </div>
                      ) : ("")}

                      <div className="flex flex-col items-start justify-between">
                        <div className="mb-2">
                          <span className='leading-7 text-[#686a6d]'>
                            <label className='font-semibold'>Developers: </label>
                            <ul className='ml-2 list-disc list-inside'>
                              {project.devops && project.devops.length > 0 ? (
                                project.devops.map((dev) => {
                                  console.log("Developer in list:", dev);
                                  return (
                                    <li key={dev.id}>
                                      {dev.full_name || dev.name || JSON.stringify(dev)}
                                    </li>
                                  );
                                })
                              ) : (
                                <li>No developers assigned</li>
                              )}
                            </ul>
                          </span>
                        </div>
                        {/* <div className="mb-2">
                        <span className='leading-7 text-[#686a6d]'>
                          <label className='font-semibold'>Project Scores: </label>
                          <div className="ml-2 flex items-center gap-3">
                            <span className="text-green-600 font-semibold">{project.completedScore}</span>
                            <span className="text-gray-500">/</span>
                            <span className="text-red-500 font-semibold">{project.totalScore}</span>
                          </div>
                        </span>
                      </div> */}
                        <div>
                          <span className='font-medium text-base leading-7 text-[#C4C7CF]'>
                            {formatDistanceToNow(new Date(project.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProjectsAdmin;