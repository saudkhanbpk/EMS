import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { ArrowBigLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuthStore, useAttendanceStore } from "../lib/store";
import { useUser } from "../contexts/UserContext";


interface LeaveRequestProps {
  setActiveComponent: React.Dispatch<React.SetStateAction<string>>;
}

const LeaveRequest: React.FC<LeaveRequestProps> = ({ setActiveComponent }) => {
  // State for storing form data


  const [leaveType, setLeaveType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const { userProfile } = useUser()
  const [fullname, setFullname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const navigate = useNavigate();  // Fix: Add parentheses to properly call useNavigate
  const [isloading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    const sendEmail = async () => {

      try {
        const response = await fetch("https://ems-server-0bvq.onrender.com/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderEmail: localStorage.getItem('user_email'), // User's email
            recipientEmail: "contact@techcreator.co", // Admin's email
            subject: `New Leave Request Submitted by ${localStorage.getItem('user_email')}`,
            employeeName: fullname,
            leaveType: leaveType,
            startDate: selectedDate,
            endDate: selectedDate,
            reason: description,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          alert("Email sent successfully!");
        } else {
          alert("Failed to send email: " + data.error);
        }
      } catch (error) {
        console.error("Error sending email:", error);
      }
    };



    // Form validation
    if (!fullname || !leaveType || !description || !selectedDate) {
      alert("Please fill out all fields.");
      return;
    }

    const userId = localStorage.getItem("user_id"); // Get the user ID from localStorage

    try {
      const { data, error } = await supabase
        .from("leave_requests")
        .insert([
          {
            leave_type: leaveType,
            user_id: userId,
            description: description,
            start_date: new Date().toISOString(),
            leave_date: selectedDate,
            full_name: fullname,
            user_email: localStorage.getItem('user_email'),
            organization_id: userProfile?.organization_id
          },
        ]);

      if (error) {
        console.error("Error inserting data: ", error.message);
        alert("An error occurred while submitting your request. Please try again.");
      } else {
        console.log("Leave request submitted:", data);
        sendEmail();
        // Optionally reset form after submission
        setLeaveType("");
        setDescription("");
        setFullname("");
        setSelectedDate("");
        alert("Leave request submitted successfully!");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }



  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <button onClick={() => setActiveComponent("default")} className="text-gray-600 hover:bg-gray-300 rounded-2xl
         translate-x-2 transition-transform ease-in-out duration-300 transform hover:scale-205">
          <ChevronLeft />
        </button>
      </div>
      <h2 className="text-[28px] font-bold mb-6 leading-9 text-[#000000]">Leaves Request</h2>

      <div className="max-w-50 mx-auto mt-8 p-6 bg-[#FFFFFF] rounded-lg shadow-lg">
        <h2 className="text-[22px] font-semibold mb-6 leading-7 text-[#000000]">Request a Leave</h2>

        <form onSubmit={handleSubmit}>
          {/* Request Type Dropdown */}
          <div className="mb-4 grid gap-3 grid-cols-1 md:grid-cols-2">
            {/* Full Name Input */}
            <div className="w-full">
              <label htmlFor="FullName" className="block text-sm font-normal text-[#565656]">
                Full Name
              </label>
              <input
                id="FullName"
                type="text"
                placeholder="Enter your name"
                onChange={(e) => setFullname(e.target.value)}
                value={fullname}
                className="mt-1 block text-[#565656] w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Leave Type Dropdown */}
            <div className="w-full">
              <label htmlFor="email" className="block text-sm font-normal text-[#565656]">
                Email
              </label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your personal email"
                className="mt-1 block text-[#565656] w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="w-full grid  gap-3 grid-cols-1 md:grid-cols-2 mb-6">
            <div>
              <label htmlFor="leaveDate" className="block text-sm font-normal text-[#565656]">
                Leave Date
              </label>
              <input
                id="leaveDate"
                type="date"
                onChange={(e) => setSelectedDate(e.target.value)}
                value={selectedDate}
                min={today} // Ensure future dates only
                className="mt-1 block text-[#565656] w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="w-full">
                <label htmlFor="leaveType" className="block text-sm font-normal text-[#565656]">
                  Leave Type
                </label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="mt-1 block text-[#565656] w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a leave type</option>
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description Input */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-normal text-[#565656]">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block text-[#565656] w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a brief description"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-6 mt-6 mr-4">
            <button
              type="submit"
              className="bg-[#9A00FF] text-white px-6 py-2 rounded-lg shadow hover:bg-gray-900 transition"
            >
              Submit Request
            </button>
          </div>
        </form >
      </div >
    </div >
  );
};

export default LeaveRequest;
