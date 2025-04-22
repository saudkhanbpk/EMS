import React, { useState , useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, User, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { AttendanceContext } from './AttendanceContext';
import { useAuthStore } from '../lib/store';
import ProjectManager from '../components/ProjectManager';
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
  const [projectmanager , setProjectManager] = useState(false)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', localStorage.getItem('user_id'))
        .single();

      if (data && data.role === 'project manager') {
        setProjectManager(true);
      } else {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  })
  


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
          {projectmanager === true ? (
            <ProjectManager/>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="xs:text-[26px] text-sm font-bold">Your Project</h1>
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
                    onClick={() => {
                      navigate(`/board/${project.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center px-4 py-1 bg-[#F4F6FC] rounded-full">
                        <span className="w-2 h-2 rounded-full bg-[#9A00FF]"></span>&nbsp;&nbsp;
                        <span className="text-sm font-semibold text-[#9A00FF]">{project.type}</span>
                      </div>
                    </div>
                    <h3 className="text-[22px] font-semibold text-[#263238] mb-4">{project.title}</h3>
                    <div className="flex gap-10 flex-col items-start justify-between">
                      <div className="mb-2">
                        <span className="leading-7 text-[#686a6d]">
                          <label className="font-semibold">DevOps: </label>
                          <ul className="ml-2 list-disc list-inside">
                            {project.devops.map((dev) => (
                              <li key={dev.id}>{dev.name}</li>
                            ))}
                          </ul>
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-base leading-7 text-[#C4C7CF]">
                          {formatDistanceToNow(new Date(project.created_at))} ago
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
    
}

export default Task;