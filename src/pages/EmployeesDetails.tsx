import React, { useState, useEffect, useRef, useContext } from "react";
import { supabase } from "../lib/supabase";
import Employeeprofile from "./Employeeprofile";
import { FiPlus, FiTrash2, FiUserPlus ,FiX} from "react-icons/fi";
import { AttendanceContext } from "./AttendanceContext";

const EmployeesDetails = ({ selectedTab }) => {
  const [employees, setEmployees] = useState([]);
  const [employeeview, setEmployeeView] = useState("generalview");
  const [employeeId, setEmployeeId] = useState('');
  const [employee, setEmployee] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userProjects, setUserProjects] = useState([]);
  const [assignment, setAssignment] = useState({
    title: "",
    project: "",
    description: "",
    score: ""
  });

  const { openTaskBoard } = useContext(AttendanceContext); 
  const [employeeTasks, setEmployeess] = useState<any[]>([]);
  const [userProjectss, setUserProjectss] = useState<any[]>([]);
  
  


  const handleAssignClick = async (entry) => {
    setEmployee(entry);
    setEmployeeId(entry.id);

    const { data: allProjects, error } = await supabase
      .from("projects")
      .select("*");

    if (error) {
      console.error("Error fetching projects:", error.message);
      return;
    }

    const userProjects = allProjects.filter(project =>
      project.devops?.some(item => item.id === entry.id)
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
      const { data, error } = await supabase
        .from("tasks_of_projects")
        .insert([{
          project_id: userProjects.find(p => p.title === assignment.project)?.id,
          title: assignment.title,
          description: assignment.description,
          devops: [{ id: employeeId }],
          status: "todo",
          score: assignment.score,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      console.log("Task assigned successfully:", {
        employeeId,
        ...assignment,
      });

      setAssignment({
        title: "",
        project: "",
        description: "",
        score: ""
      });
      setShowModal(false);
      alert("Task assigned successfully!");

    } catch (err) {
      console.error("Error assigning task:", err);
      alert("Failed to assign task: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      console.error("Error deleting employee:", error.message);
    } else {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    }
  };

  const formRef = useRef(null);

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
    profile_image: null,
  });

  const [step, setStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchEmployees = async () => {
    // Fetch employees
    const { data: employeesData, error: employeesError } = await supabase
      .from("users")
      .select("*");

    if (employeesError) {
      console.error("Error fetching employees:", employeesError.message);
      return;
    }

    // Fetch projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, devops");

    if (projectsError) {
      console.error("Error fetching projects:", projectsError.message);
      return;
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks_of_projects")
      .select("*")

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError.message);
      return;
    }



// // Map projects to employees with correct KPI calculation
// const employeesWithProjects = employeesData.map(employee => {
//   // Find all projects assigned to this employee
//   const employeeProjects = projectsData.filter(project =>
//     project.devops?.some(dev => dev.id === employee.id)
  // );
  const employeesWithProjects = employeesData.map(employee => {
    const employeeProjects = projectsData.filter(project =>
      project.devops?.some((dev: any) => dev.id === employee.id)
    );

  // Find all tasks assigned to this employee that aren't done
  const employeeTasks = tasksData.filter(task =>
    task.devops?.some(dev => dev.id === employee.id) &&
    task.status?.toLowerCase() !== "done"
  );

  // Calculate total KPI from non-done tasks
  const totalKPI = employeeTasks.reduce((sum, task) => {
    // Ensure score is a number, default to 0 if invalid
    const taskScore = Number(task.score) || 0;
    return sum + taskScore;
  }, 0);

  return {
    ...employee,
    projects: employeeProjects.map(project => project.title),
    projectid: employeeProjects.map(project => project.id),
    TotalKPI: totalKPI,
    // Optional: include task count for reference
    activeTaskCount: employeeTasks.length
  };
});
    console.log("Employees with projects:", employeesWithProjects);




    setEmployees(employeesWithProjects);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    setSignupData({
      email: "",
      password: "",
    });
    if (formRef.current) formRef.current.reset();
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setStep(1);
  };

  const handleSubmitSignUp = async (e) => {
    e.preventDefault();
    const { email, password } = signupData;

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert(authError.message);
      return;
    }

    if (data.user) {
      setEmployeeId(data.user.id);
      setStep(2);
    }
  };

  const handleSubmitEmployeeInfo = async (e) => {
    e.preventDefault();

    const { full_name, role, phone, personal_email, location, profession, per_hour_pay, salary, slack_id, profile_image } = formData;

    const joiningDate = formData.joining_date || new Date().toISOString();

    let profileImageUrl = null;

    if (profile_image) {
      const fileExt = profile_image.name.split('.').pop();
      const fileName = `${employeeId}_profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profilepics')
        .upload(fileName, profile_image);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profilepics')
        .getPublicUrl(fileName);

      profileImageUrl = publicUrl;
    }

    const { error } = await supabase
      .from("users")
      .update([{
        full_name,
        role,
        phone_number: phone,
        personal_email,
        location,
        profession,
        per_hour_pay: Number(per_hour_pay),
        salary: Number(salary),
        slack_id,
        profile_image: profileImageUrl,
        joining_date: joiningDate,
      }])
      .eq("id", employeeId);

    if (!error) {
      resetForm();
      setShowForm(false);
      setStep(1);
      fetchEmployees();
    }
  };

  const getEmploymentDuration = (joinDate) => {
    const joined = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joined);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) + " months";
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Modal Backdrop */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Multi-step form header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {step === 1 ? 'Create Account' : 'Employee Details'}
                </h2>
                <button 
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
  
              {/* Step indicator */}
              <div className="flex mb-6">
                <div className={`flex-1 border-t-2 ${step >= 1 ? 'border-[#9A00FF]' : 'border-gray-200'}`}></div>
                <div className={`flex-1 border-t-2 ${step >= 2 ? 'border-[#9A00FF]' : 'border-gray-200'}`}></div>
              </div>
  
              {/* Step 1: Sign Up Form */}
              {step === 1 && (
                <form onSubmit={handleSubmitSignUp} className="space-y-4">
                  <div className="space-y-4">
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
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#9A00FF] text-white hover:bg-[#8a00e6] transition-colors shadow-sm"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}
  
              {/* Step 2: Employee Info Form */}
              {step === 2 && (
                <form onSubmit={handleSubmitEmployeeInfo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'full_name', 'role', 'phone', 'email', 
                      'personal_email', 'location', 'profession',
                      'per_hour_pay', 'salary', 'slack_id', 'joining_date'
                    ].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                          {field.replace(/_/g, ' ')}
                        </label>
                        {field === 'role' ? (
                          <select
                            name="role"
                            value={formData.role}
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
                            value={field === 'email' ? signupData.email : formData[field]}
                            onChange={handleInputChange}
                            disabled={field === 'email'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9A00FF] focus:border-transparent disabled:bg-gray-100"
                          />
                        )}
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Image
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer">
                          <div className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="text-sm text-gray-700">Choose file</span>
                            <input
                              type="file"
                              name="profile_image"
                              onChange={(e) => setFormData(prev => ({ ...prev, profile_image: e.target.files[0] }))}
                              className="hidden"
                            />
                          </div>
                        </label>
                        {formData.profile_image && (
                          <span className="text-sm text-gray-500 truncate">
                            {formData.profile_image.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#9A00FF] text-white hover:bg-[#8a00e6] transition-colors shadow-sm"
                    >
                      Save Employee
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
  
      {/* Assign Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Assign Task to {employee?.full_name}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
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
                      <option value="">Select a project</option>
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
                    className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignSubmit}
                    disabled={!assignment.title}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#9A00FF] text-white hover:bg-[#8a00e6] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
  
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Employee Profile View */}
        {employeeview === "detailview" && (
          <Employeeprofile
            employeeid={employeeId}
            employeeview={employeeview}
            employee={employee}
            setemployeeview={setEmployeeView}
          />
        )}
  
        {/* General Employee View */}
        {employeeview === "generalview" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Section */}
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
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#9A00FF] hover:bg-[#8a00e6] text-white text-sm font-medium transition-colors shadow-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add Employee</span>
                  </button>
                </div>
              </div>
            </div>
  
            {/* Employee Table */}
            
            <div className="w-full">
  {/* Desktop table - hidden on small screens, with improved responsiveness */}
  
<div className="hidden md:block w-full">
  <div className="w-full inline-block align-middle">
    <div className="overflow-x-auto">
      <table className="w-full divide-y divide-gray-200 table-auto">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
            <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Projects
            </th>
            <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Workload
            </th>
            <th scope="col" className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => {
                    setEmployee(entry);
                    setEmployeeId(entry.id);
                    setEmployeeView("detailview");
                  }}
                  className="flex items-center gap-2 lg:gap-3 group"
                >
                  <div className="flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-r from-[#9A00FF] to-[#5A00B4] flex items-center justify-center text-white font-medium text-xs lg:text-sm">
                    {entry.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <div className="text-xs lg:text-sm font-medium text-gray-900 group-hover:text-[#9A00FF] transition-colors truncate max-w-[120px] lg:max-w-full">
                      {entry.full_name}
                    </div>
                  </div>
                </button>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                {new Date(entry.joining_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div className="text-xs lg:text-sm text-gray-900 truncate max-w-[120px] lg:max-w-[240px] xl:max-w-full">{entry.email}</div>
                <div className="text-xs text-gray-500 truncate max-w-[120px] lg:max-w-[240px] xl:max-w-full">{entry.phone || 'No phone'}</div>
              </td>
              <td className="px-4 lg:px-6 py-4">
                {entry.projects?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 lg:gap-1.5">
                    {entry.projects.slice(0, 2).map((project: any) => (
                      <button
                        key={project.id}
                        onClick={() => openTaskBoard(project.id, project.devops)}
                        className="px-2 py-0.5 lg:px-2.5 lg:py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 truncate max-w-[80px] lg:max-w-[120px] xl:max-w-full"
                      >
                        {project}
                      </button>
                    ))}
                    {entry.projects.length > 2 && (
                      <span className="px-2 py-0.5 lg:px-2.5 lg:py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        +{entry.projects.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs lg:text-sm text-gray-400">Not assigned</span>
                )}
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
                    entry.TotalKPI <= 20 ? "bg-red-500" :
                    entry.TotalKPI <= 70 ? "bg-amber-500" :
                    entry.TotalKPI <= 120 ? "bg-green-500" :
                    "bg-blue-500"
                  }`}></div>
                  <span className="text-xs lg:text-sm font-medium">
                    {entry.TotalKPI ?? 0}
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1 lg:h-1.5">
                  <div 
                    className={`h-1 lg:h-1.5 rounded-full ${
                      entry.TotalKPI <= 20 ? "bg-red-500" :
                      entry.TotalKPI <= 70 ? "bg-amber-500" :
                      entry.TotalKPI <= 120 ? "bg-green-500" :
                      "bg-blue-500"
                    }`} 
                    style={{ width: `${Math.min(entry.TotalKPI, 100)}%` }}
                  ></div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end items-center gap-1 lg:gap-2">
                  <button
                    onClick={() => handleAssignClick(entry)}
                    className="p-1.5 lg:p-2 rounded-lg bg-[#9A00FF]/10 text-[#9A00FF] hover:bg-[#9A00FF]/20 transition-colors"
                    title="Assign Task"
                  >
                    <FiUserPlus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 lg:p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
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


  {/* Mobile card view - shown only on small screens */}
  <div className="md:hidden">
    {employees.map((entry) => (
      <div key={entry.id} className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden border border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                setEmployee(entry);
                setEmployeeId(entry.id);
                setEmployeeView("detailview");
              }}
              className="flex items-center gap-3 group"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-[#9A00FF] to-[#5A00B4] flex items-center justify-center text-white font-medium">
                {entry.full_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 group-hover:text-[#9A00FF] transition-colors">
                  {entry.full_name}
                </div>
              </div>
            </button>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAssignClick(entry)}
                className="p-1.5 rounded-lg bg-[#9A00FF]/10 text-[#9A00FF] hover:bg-[#9A00FF]/20 transition-colors"
                title="Assign Task"
              >
                <FiUserPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                title="Delete"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5">
              <p className="text-gray-500 font-medium">Joined</p>
              <p className="text-gray-700">
                {new Date(entry.joining_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="space-y-0.5">
              <p className="text-gray-500 font-medium">Contact</p>
              <p className="text-gray-700 truncate max-w-[120px]">{entry.email}</p>
              <p className="text-gray-500">{entry.phone || 'No phone'}</p>
            </div>
          </div>
          
          <div className="mt-3 space-y-0.5">
            <p className="text-gray-500 font-medium text-xs">Projects</p>
            {entry.projects?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {entry.projects.slice(0, 2).map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => openTaskBoard(project.id, project.devops)}
                    className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700"
                  >
                    {project}
                  </button>
                ))}
                {entry.projects.length > 2 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    +{entry.projects.length - 2}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not assigned</span>
            )}
          </div>
          
          <div className="mt-3 space-y-0.5">
            <p className="text-gray-500 font-medium text-xs">Workload</p>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                entry.TotalKPI <= 20 ? "bg-red-500" :
                entry.TotalKPI <= 70 ? "bg-amber-500" :
                entry.TotalKPI <= 120 ? "bg-green-500" :
                "bg-blue-500"
              }`}></div>
              <span className="text-xs font-medium">
                {entry.TotalKPI ?? 0}
              </span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${
                  entry.TotalKPI <= 20 ? "bg-red-500" :
                  entry.TotalKPI <= 70 ? "bg-amber-500" :
                  entry.TotalKPI <= 120 ? "bg-green-500" :
                  "bg-blue-500"
                }`} 
                style={{ width: `${Math.min(entry.TotalKPI, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesDetails;