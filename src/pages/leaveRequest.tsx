import React, { useState } from "react";
import { supabase } from "../lib/supabase";
const LeaveRequest: React.FC = () => {
  // State for storing form data
  const [leaveType, setLeaveType] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = localStorage.getItem("user_id"); // Get the user ID from localStorage

    try {
      const { data, error } = await supabase
        .from("leave_requests")
        .insert([
          {
            'leave_type': leaveType,
            'user_id': userId,
            'description': description,
            'start_date': new Date().toISOString(),
                  },
        ]);

      if (error) {
        console.error("Error inserting data: ", error.message);
      } else {
        console.log("Leave request submitted:", data);
        // Optionally reset form after submission
        setLeaveType("");
        setDescription("");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  return (
    <div className="max-w-50 mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Leave Request</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Request Type Dropdown */}
        <div className="mb-4">
          <label htmlFor="leaveType" className="block text-sm font-medium text-gray-600">
            Request Type
          </label>
          <select
            id="leaveType"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a leave type</option>
            <option value="Full Day">Full Day</option>
            <option value="Half Day">Half Day</option>
            <option value="Sick Leave">Sick Leave</option>
          </select>
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-600">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide a brief description"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default LeaveRequest;
