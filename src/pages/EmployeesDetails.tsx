import React, { useState, useEffect, useRef, useContext } from "react";
import { supabase } from "../lib/supabase";
import Employeeprofile from "./Employeeprofile";
import { FiPlus, FiTrash2, FiX, FiPlusSquare } from "react-icons/fi";
import { AttendanceContext } from "./AttendanceContext";
import TaskBoardAdmin from "../components/TaskBoardAdmin";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  joining_date?: string;
  projects?: any[];
  TotalKPI?: number;
  role?: string;
  // Add other employee properties as needed
}

interface Project {
  id: string;
  title: string;
  devops: any[];
}

const EmployeesDetails = ({ selectedTab }) => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeview, setEmployeeView] = useState<"generalview" | "detailview">("generalview");
  const [employeeId, setEmployeeId] = useState<string>('');
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [assignment, setAssignment] = useState({
    title: "",
    project: "",
    description: "",
    score: ""
  });

  const [selectedTAB, setSelectedTAB] = useState('');
  const [ProjectId, setProjectId] = useState<string>('');
  const [devopss, setDevopss] = useState<any[]>([]);

  const { openTaskBoard } = useContext(AttendanceContext);
  const formRef = useRef<HTMLFormElement>(null);

  // Form states
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    full_name: "",
    role: "employee",
    phone: "",
    email: "",
    personal_email: "",
    location: "",
    profession: "",
    per_hour_pay: "",
    salary: "",
    slack_id: "",
    joining_date: "",
    profile_image: null as File | null,
  });

  const [step, setStep] = useState(1);

  // Fetch employees with their projects and tasks
  const fetchEmployees = async () => {
    try {
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("users")
        .select("*");

      if (employeesError) throw employeesError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, devops");

      if (projectsError) throw projectsError;

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks_of_projects")
        .select("*");

      if (tasksError) throw tasksError;

      // Process employee data
      const employeesWithProjects = employeesData.map(employee => {
        const employeeProjects = projectsData.filter(project =>
          project.devops?.some((dev: any) => dev.id === employee.id)
        );

        const employeeTasks = tasksData.filter(task =>
          task.devops?.some(dev => dev.id === employee.id) &&
          task.status?.toLowerCase() !== "done"
        );

        const totalKPI = employeeTasks.reduce((sum, task) => {
          return sum + (Number(task.score) || 0);
        }, 0);
        
        return {
          ...employee,
          projects: employeeProjects,
          projectid: employeeProjects.map(project => project.id),
          TotalKPI: totalKPI,
          activeTaskCount: employeeTasks.length
        };
      });

      setEmployees(employeesWithProjects);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle task assignment
  const handleAssignClick = async (employee: Employee) => {
    setCurrentEmployee(employee);
    setEmployeeId(employee.id);

    const { data: allProjects, error } = await supabase
      .from("projects")
      .select("*");

    if (error) {
      console.error("Error fetching projects:", error.message);
      return;
    }

    const userProjects = allProjects.filter(project =>
      project.devops?.some(item => item.id === employee.id)
    );

    setUserProjects(userProjects);
    setAssignment(prev => ({
      ...prev,
      project: userProjects[0]?.title || ""
    }));

    setShowModal(true);
  };

  const handleAssignSubmit = async () => {
    try {
      const selectedProject = userProjects.find(p => p.title === assignment.project);
      if (!selectedProject) throw new Error("Project not found");

      const { error } = await supabase
        .from("tasks_of_projects")
        .insert([{
          project_id: selectedProject.id,
          title: assignment.title,
          description: assignment.description,
          devops: [{ id: employeeId }],
          status: "todo",
          score: assignment.score,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setAssignment({
        title: "",
        project: "",
        description: "",
        score: ""
      });
      setShowModal(false);
      fetchEmployees(); // Refresh data
      alert("Task assigned successfully!");
    } catch (err) {
      console.error("Error assigning task:", err);
      alert("Failed to assign task: " + err.message);
    }
  };

  // Employee form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });

      if (error) throw error;
      if (data.user) {
        setEmployeeId(data.user.id);
        setStep(2);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitEmployeeInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let profileImageUrl = null;

      if (formData.profile_image) {
        const fileExt = formData.profile_image.name.split('.').pop();
        const fileName = `${employeeId}_profile.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profilepics')
          .upload(fileName, formData.profile_image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profilepics')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("users")
        .update([{
          ...formData,
          phone_number: formData.phone,
          per_hour_pay: Number(formData.per_hour_pay),
          salary: Number(formData.salary),
          profile_image: profileImageUrl,
          joining_date: formData.joining_date || new Date().toISOString(),
        }])
        .eq("id", employeeId);

      if (error) throw error;

      resetForm();
      setShowForm(false);
      setStep(1);
      fetchEmployees();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      role: "employee",
      phone: "",
      email: "",
      personal_email: "",
      location: "",
      profession: "",
      per_hour_pay: "",
      salary: "",
      slack_id: "",
      joining_date: "",
      profile_image: null,
    });
    setSignupData({ email: "", password: "" });
    if (formRef.current) formRef.current.reset();
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setStep(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  // Render methods
  const renderEmployeeForm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {step === 1 ? 'Create Account' : 'Employee Details'}
            </h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex mb-6">
            <div className={`flex-1 border-t-2 ${step >= 1 ? 'border-[#9A00FF]' : 'border-gray-200'}`}></div>
            <div className={`flex-1 border-t-2 ${step >= 2 ? 'border-[#9A00FF]' : 'border-gray-200'}`}></div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmitSignUp} className="space-y-4">
              {/* Signup form fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCancel} className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#9A00FF] text-white hover:bg-[#8a00e6] shadow-sm">
                  Continue
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitEmployeeInfo} className="space-y-4">
              {/* Employee details form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData).map(([field, value]) => (
                  field !== 'profile_image' && (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {field.replace(/_/g, ' ')}
                      </label>
                      {field === 'role' ? (
                        <select
                          name={field}
                          value={value as string}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <input
                          type={field === 'joining_date' ? 'date' : 'text'}
                          name={field}
                          value={field === 'email' ? signupData.email : value as string}
                          onChange={handleInputChange}
                          disabled={field === 'email'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent disabled:bg-gray-100"
                        />
                      )}
                    </div>
                  )
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                  <input
                    type="file"
                    name="profile_image"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      profile_image: e.target.files?.[0] || null 
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50">
                  Back
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#9A00FF] text-white hover:bg-[#8a00e6] shadow-sm">
                  Save Employee
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  const renderAssignTaskModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Assign Task to {currentEmployee?.full_name}
            </h2>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                value={assignment.title}
                onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              {userProjects.length > 0 ? (
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                  value={assignment.project}
                  onChange={(e) => setAssignment(prev => ({ ...prev, project: e.target.value }))}
                >
                  {userProjects.map((project) => (
                    <option key={project.id} value={project.title}>
                      {project.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500 py-2">No projects available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                rows={3}
                value={assignment.description}
                onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent"
                value={assignment.score}
                onChange={(e) => setAssignment(prev => ({ ...prev, score: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignSubmit}
                disabled={!assignment.title}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#9A00FF] text-white hover:bg-[#8a00e6] shadow-sm disabled:opacity-70"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 sm:p-6">
      {selectedTAB === "TaskBoard" ? (
        <TaskBoardAdmin 
          devopss={devopss} 
          ProjectId={ProjectId} 
          setSelectedTAB={setSelectedTAB} 
          selectedTAB={selectedTAB} 
        />
      ) : (
        <>
          {showForm && renderEmployeeForm()}
          {showModal && renderAssignTaskModal()}

          {employeeview === "detailview" ? (
            <Employeeprofile
              employeeid={employeeId}
              employeeview={employeeview}
              employee={currentEmployee}
              setemployeeview={setEmployeeView}
            />
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
                      <p className="text-gray-500 mt-1">View and manage your team members</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center px-4 py-2 rounded-full bg-gray-50 border border-gray-200">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-sm text-gray-600">
                          Total: <span className="font-semibold">{employees.length}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9A00FF] hover:bg-[#8a00e6] text-white text-sm font-medium shadow-sm"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Employee</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workload</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCurrentEmployee(employee);
                                setEmployeeId(employee.id);
                                setEmployeeView("detailview");
                              }}
                              className="flex items-center gap-3 group"
                            >
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-[#9A00FF] to-[#5A00B4] flex items-center justify-center text-white font-medium">
                                {employee.full_name.split(' ')[0].charAt(0).toUpperCase()}
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-gray-900 group-hover:text-[#9A00FF]">
                                  {employee.full_name.split(' ')[0]} 
                                </div>
                              </div>
                            </button>
                          </td>
                          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{employee.email}</div>
                            <div className="text-xs text-gray-500">{employee.phone || 'No phone'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {employee.projects?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {employee.projects.map((project: any) => (
                                  <button
                                    key={project.id}
                                    onClick={() => {
                                      setDevopss(project.devops);
                                      setProjectId(project.id);
                                      setSelectedTAB("TaskBoard");
                                      openTaskBoard(project.id, project.devops);
                                    }}
                                    className="px-2.5 py-1 text-sm rounded-full bg-indigo-50 text-indigo-700"
                                  >
                                    {project.title}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                (employee.TotalKPI || 0) <= 50 ? "bg-red-500" :
                                (employee.TotalKPI || 0) <= 100 ? "bg-amber-500" :
                                (employee.TotalKPI || 0) <= 150 ? "bg-green-500" :
                                "bg-purple-500"
                              }`}></div>
                              <span className="text-sm font-medium">
                                {employee.TotalKPI ?? 0}
                              </span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  (employee.TotalKPI || 0) <= 50 ? "bg-red-500" :
                                  (employee.TotalKPI || 0) <= 100 ? "bg-amber-500" :
                                  (employee.TotalKPI || 0) <= 150 ? "bg-green-500" :
                                  "bg-purple-500"
                                }`} 
                                style={{ width: `${Math.min(employee.TotalKPI || 0, 150)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleAssignClick(employee)}
                                className="p-2 rounded-lg bg-[#9A00FF]/10 text-[#9A00FF] hover:bg-[#9A00FF]/20"
                                title="Assign Task"
                              >
                                <FiPlusSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(employee.id)}
                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeesDetails;