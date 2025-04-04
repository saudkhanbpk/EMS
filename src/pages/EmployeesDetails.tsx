import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Employeeprofile from "./Employeeprofile";


const EmployeesDetails = ({ selectedTab }) => {
  const [employees, setEmployees] = useState([]);
  const [employeeview , setemployeeview] = useState("generalview")
  const [employeeid , setemployeeid] = useState('')
  const [employee , setEmployee] = useState('')

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*");
      
      if (!error) {
        setEmployees(data);
      }
    };
    fetchEmployees();
  }, []);

  // Calculate employment duration
  const getEmploymentDuration = (joinDate) => {
    const joined = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joined);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) + " months";
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
        {employeeview === "detailview" && (
          <Employeeprofile employeeid={employeeid} employeeview={employeeview} employee={employee}/>
        )}
       {employeeview === "generalview" && (
        <>
      <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg mb-6">
      <h1 className="text-2xl mb-2 w-full text-left font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
             Employees Details
           </h1>
        <div className="flex justify-between items-center text-lg font-medium">
          <button className="flex items-center space-x-2 px-4 py-2 rounded-3xl bg-gray-200">
            <span className="w-4 h-4 bg-gray-600 rounded-full"></span>
            <h2 className="text-gray-600">
              Total: <span className="font-bold">{employees.length}</span>
            </h2>
          </button>
          {/* <button className="flex items-center space-x-2 px-4 py-2 rounded-3xl bg-green-200">
            <span className="w-4 h-4 bg-green-500 rounded-full"></span>
            <h2 className="text-green-600">
              Active: <span className="font-bold">{employees.filter(e => e.status === 'active').length}</span>
            </h2>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-3xl">
            <span className="w-4 h-4 bg-red-500 rounded-full"></span>
            <h2 className="text-red-600">
              Inactive: <span className="font-bold">{employees.filter(e => e.status === 'inactive').length}</span>
            </h2>
          </button> */}
        </div>
      </div>

      <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 text-gray-700 uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-6 text-center">Employee Name</th>
                <th className="py-3 px-6 text-center">Joining Date</th>
                <th className="py-3 px-6 text-center">Employment Duration</th>
                <th className="py-3 px-6 text-center">Role</th>
                <th className="py-3 px-6 text-center">Email</th>
              </tr>
            </thead>
            <tbody className="text-md font-normal">
              {employees.map((entry, index) => (
                <tr 
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50  transition-all"
                >
                  <td className="py-4 px-6">
                    <button className="text-gray-900 text-left px-3 py-1"
                    onClick={() => {
                      setEmployee(entry)
                        setemployeeid(entry.id)
                        setemployeeview("detailview")}}>
                      {entry.full_name}
                    </button>
                  </td>
                  <td className="py-4 text-center px-6">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-center px-6">
                    {getEmploymentDuration(entry.created_at)}
                  </td>
                  <td className="py-4 text-center px-6">
                    <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {entry.role}
                    </button>
                  </td>
                  <td className="py-4 text-center px-6">
                    <span className="text-gray-600">
                      {entry.email}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default EmployeesDetails;