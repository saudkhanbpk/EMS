import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import TaskBoard from './TaskBoard';

interface Project {
  id: string;
  title: string;
  type: 'Front-End Developer' | 'Back End Developer';
  devops: { id: string; name: string }[];
  created_at: string;
  start_date?: string;
} 
 
interface Dev {
  id: string;
  full_name: string;
}

function ProjectsAdmin() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [Devs, setDevs] = useState<Dev[]>([]);
  const [selectedDevs, setSelectedDevs] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTAB , setSelectedTAB] = useState("Projects")
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'Front-End Developer' as const
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
      const { data, error } = await supabase
        .from("projects")
        .select("*");
      if (!error) setProjects(data);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    
    const selectedEmployee = Devs.find(dev => dev.id === selectedId);
    if (selectedEmployee && !selectedDevs.some(dev => dev.id === selectedId)) {
      setSelectedDevs([...selectedDevs, { 
        id: selectedEmployee.id, 
        name: selectedEmployee.full_name 
      }]);
    }
  };

  const handleRemove = (id: string) => {
    setSelectedDevs(selectedDevs.filter(dev => dev.id !== id));
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      setProjects(projects.filter(project => project.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const openAddModal = () => {
    setNewProject({ title: '', type: 'Front-End Developer' });
    setSelectedDevs([]);
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewProject({ title: project.title, type: project.type });
    setSelectedDevs(project.devops || []);
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
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update({
            title: newProject.title,
            type: newProject.type,
            devops: selectedDevs,
          })
          .eq("id", editingProject.id);

        if (error) throw error;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from("projects")
          .insert([{
            title: newProject.title,
            type: newProject.type,
            devops: selectedDevs,
            created_at: new Date().toISOString(),
          }])
          .select();

        if (error) throw error;
      }

      // Refresh projects list
      const { data, error } = await supabase.from("projects").select("*");
      if (!error) setProjects(data);
      
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
          <TaskBoard setSelectedTAB={setSelectedTAB}/>
        )}
        {selectedTAB == "Projects" && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-[26px] font-bold">Your Projects</h1>
              <button
                onClick={openAddModal}
                className="bg-[#9A00FF] text-white px-4 py-2 rounded-lg flex items-center"
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
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Add Developers
                        </label>
                        <select
                          value=""
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="" disabled>Select a developer</option>
                          {Devs.map((dev) => (
                            <option key={dev.id} value={dev.id}>
                              {dev.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDevs.map((dev) => (
                          <div key={dev.id} className="flex items-center bg-gray-200 px-3 py-1 rounded-md">
                            <span className="mr-2">{dev.name}</span>
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
                    onClick={() => setSelectedTAB("taskBoard")}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center px-4 py-1 bg-[#F4F6FC] rounded-full">
                        <span className="w-2 h-2 rounded-full bg-[#9A00FF]"></span>
                        <span className="text-sm font-semibold text-[#9A00FF] ml-2">
                          {project.type}
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
                    <div className="flex flex-col items-start justify-between">
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