import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const Employeeprofile = ({ employeeid , employeeview , employee }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", employeeid)
          .single();

        if (error) throw error;
        setEmployeeData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (employeeid) fetchEmployee();
  }, [employeeid]);

  if (loading) return <div className="text-center p-4">Loading profile...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!employeeData) return <div className="p-4">No employee found</div>;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {employee.full_name}
            </h1>
            <p className="text-gray-600">{employee.role}</p>
          </div>
          <button 
            onClick={() => setemployeeview("generalview") }
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back to List
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {employee.email}</p>
              <p><span className="font-medium">Phone:</span> {employee.phone || 'N/A'}</p>
              <p><span className="font-medium">Department:</span> {employee.department || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Employment Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Joined:</span> {new Date(employee.created_at).toLocaleDateString()}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                  employeeData.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {employee.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employeeprofile;