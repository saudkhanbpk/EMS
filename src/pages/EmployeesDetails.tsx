import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Employeeprofile from "./Employeeprofile";
import { FaTrash, FaEdit } from "react-icons/fa";

const EmployeesDetails = ({ selectedTab }) => {
  const [employees, setEmployees] = useState([]);
  const [employeeview, setEmployeeView] = useState("generalview");
  const [employeeId, setEmployeeId] = useState('');
  const [employee, setEmployee] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [assignment, setAssignment] = useState({
    title: "",
    project: "",
  });

  const defaultProjects = ["Website Redesign", "Marketing Campaign", "Mobile App"];

  const handleAssignClick = (entry) => {
    setEmployee(entry);
    setEmployeeId(entry.id);
    setAssignment({ title: "", project: defaultProjects[0] });
    setShowModal(true);
  };

  const handleAssignSubmit = () => {
    console.log("Assigning:", {
      employeeId,
      ...assignment,
    });
    setShowModal(false);
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
    per_hour_pay: "",
    salary: "",
    slack_id: "",
    joining_date: "",
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
    const { data, error } = await supabase.from("users").select("*");
    if (!error) {
      setEmployees(data);
    }
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
      per_hour_pay: "",
      salary: "",
      slack_id: "",
      joining_date: "",
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

    const {
      full_name,
      role,
      phone,
      per_hour_pay,
      salary,
      slack_id,
    } = formData;

    const joiningDate = formData.joining_date || new Date().toISOString();

    const { error } = await supabase
      .from("users")
      .update([{
        full_name,
        role,
        phone_number: phone,
        per_hour_pay: Number(per_hour_pay),
        salary: Number(salary),
        slack_id,
        created_at: joiningDate,
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
    <div className="w-full flex flex-col items-center justify-center p-2 sm:p-4">
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-4">Sign Up Form</h2>
                <form ref={formRef} className="space-y-3" onSubmit={handleSubmitSignUp}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-gray-700 sm:w-32">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      className="border p-2 rounded-md flex-1 w-full text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-gray-700 sm:w-32">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      className="border p-2 rounded-md flex-1 w-full text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      className="bg-red-500 text-white px-4 py-2 rounded-md text-sm sm:text-base"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#9A00FF] hover:brightness-90 text-white px-4 py-2 rounded-md text-sm sm:text-base"
                    >
                      Sign Up
                    </button>
                  </div>
                </form>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-4">Employee Info Form</h2>
                <form ref={formRef} className="space-y-3" onSubmit={handleSubmitEmployeeInfo}>
                  {["full_name", "role", "phone", "email", "per_hour_pay", "salary", "slack_id", "joining_date"].map((field, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-gray-700 sm:w-32 capitalize">{field.replace(/_/g, ' ')}</label>
                      {field === "role" ? (
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="border p-2 rounded-md flex-1 w-full text-sm sm:text-base"
                        >
                          <option value="employee">employee</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <input
                          type={field === "joining_date" ? "date" : "text"}
                          name={field}
                          value={field === "email" ? signupData.email : formData[field]}
                          onChange={handleInputChange}
                          disabled={field === "email"}
                          className="border p-2 rounded-md flex-1 w-full text-sm sm:text-base"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      className="bg-red-500 text-white px-4 py-2 rounded-md text-sm sm:text-base"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#9A00FF] hover:brightness-90 text-white px-4 py-2 rounded-md text-sm sm:text-base"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {employeeview === "detailview" && (
        <Employeeprofile employeeid={employeeId} employeeview={employeeview} employee={employee} />
      )}

      {employeeview === "generalview" && (
        <>
          <div className="w-full max-w-6xl bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 border-b-2 border-gray-200 pb-2">
              Employees Details
            </h1>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <button className="flex items-center space-x-2 px-3 py-1 rounded-3xl bg-gray-200">
                <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                <h2 className="text-gray-600 text-sm">
                  Total: <span className="font-bold">{employees.length}</span>
                </h2>
              </button>
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#9A00FF] hover:brightness-90 text-white text-sm"
                onClick={() => setShowForm(true)}
              >
                + Add new Employee
              </button>
            </div>
          </div>

          <div className="w-full max-w-6xl bg-white p-4 sm:p-6 rounded-lg shadow-lg">
  <div className="overflow-x-auto md:w-full w-[300px]">
    <table className="min-w-[700px] bg-white">
      <thead className="bg-gray-50 text-gray-700 uppercase text-xs leading-normal">
        <tr>
          <th className="py-2 px-3 text-left">Employee Name</th>
          <th className="py-2 px-3 text-left">Joining Date</th>
          <th className="py-2 px-3 text-left">Employment Duration</th>
          <th className="py-2 px-3 text-left">Role</th>
          <th className="py-2 px-3 text-left">Email</th>
          <th className="py-2 px-3 text-left">Slack ID</th>
          <th className="py-2 px-3 text-left">Phone Number</th>
          <th className="py-2 px-3 text-left">Salary</th>
          <th className="py-2 px-3 text-left">Per Hour Pay</th>
          <th className="py-2 px-3 text-left">Assign</th>
          <th className="py-2 px-3 text-left">Action</th> 
        </tr>
      </thead>
      <tbody className="text-sm font-normal">
        {employees.map((entry, index) => (
          <tr
            key={index}
            className="border-b border-gray-200 hover:bg-gray-50 transition-all"
          >
            <td className="px-3 py-3 whitespace-nowrap">
              <button
                className="text-gray-900 text-left hover:text-[#9A00FF]"
                onClick={() => {
                  setEmployee(entry);
                  setEmployeeId(entry.id);
                  setEmployeeView("detailview");
                }}
              >
                {entry.full_name}
              </button>
            </td>
            <td className="px-3 py-3 whitespace-nowrap">
              {new Date(entry.created_at).toLocaleDateString()}
            </td>
            <td className="px-3 py-3 whitespace-nowrap">
              {getEmploymentDuration(entry.created_at)}
            </td>
            <td className="px-3 py-3 whitespace-nowrap">{entry.role}</td>
            <td className="px-3 py-3 whitespace-nowrap">{entry.email}</td>
            <td className="px-3 py-3 whitespace-nowrap">{entry.slack_id}</td>
            <td className="px-3 py-3 whitespace-nowrap">{entry.phone_number}</td>
            <td className="px-3 py-3 whitespace-nowrap">{entry.salary}</td>
            <td className="px-3 py-3 whitespace-nowrap">{entry.per_hour_pay}</td>
            <td className="px-3 py-3 whitespace-nowrap">
              <button
                onClick={() => handleAssignClick(entry)}
                className="bg-[#9A00FF] text-white px-3 py-1 rounded hover:bg-[#7a00cc]"
              >
                Assign
              </button>
            </td>
            <td className="px-3 py-3 whitespace-nowrap flex gap-3 items-center">
              <FaEdit className="text-blue-500 cursor-not-allowed" title="Edit" />
              <FaTrash
                className="text-red-500 cursor-pointer hover:text-red-700"
                title="Delete"
                onClick={() => handleDelete(entry.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

             {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Assign Task to {employee?.full_name}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={assignment.title}
                onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Project</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={assignment.project}
                onChange={(e) => setAssignment({ ...assignment, project: e.target.value })}
              >
                {defaultProjects.map((proj, i) => (
                  <option key={i} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                className="px-4 py-2 bg-[#9A00FF] text-white rounded hover:bg-[#7a00cc]"
              >
                Assign
              </button>
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
