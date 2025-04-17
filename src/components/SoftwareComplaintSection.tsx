import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Complaint {
  id: number | string;
  complaint_text: string;
  created_at?: string;
}

const SoftwareComplaintSection: React.FC = () => {
  const [complaint, setComplaint] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingText, setEditingText] = useState('');

  const triggerNotification = async () => {
    try {
      // 1. Get user ID (with null check)
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        throw new Error("No user ID found in localStorage");
      }
  
      // 2. Get user's Supabase session (if needed for auth)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }
  
      // 3. Send notification request
      const response = await fetch("http://localhost:4000/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth token if required by your backend
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          userId,
          // Optional: Add more notification details
          message: "This is a test notification",
          url: "/notifications" 
        }),
      });
  
      // 4. Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send notification");
      }
  
      const data = await response.json();
      console.log("Notification sent successfully:", data);
      return data;
      
    } catch (error) {
      console.error("Notification error:", error.message);
      // Optional: Show user-friendly error message
      alert(`Failed to send notification: ${error.message}`);
      throw error; // Re-throw if you want calling code to handle it
    }
  };
  
  // Usage example - call this from a button click or specific event
  const handleSendNotification = async () => {
    try {
      await triggerNotification();
    } catch {
      // Handle errors if needed
    }
  };

  // Fetch all software complaints from the database.
  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from('software_complaints')
      .select('*')
      .eq("user_id", localStorage.getItem('user_id'))
      .order('created_at', { ascending: false });

    console.log('Fetched Data:', data, 'Error:', error);

    if (error) {
      console.error('Error fetching software complaints:', error.message);
    } else {
      setComplaintsList(data || []);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    handleSendNotification();
    e.preventDefault();
    setErrorMsg(null);

  //   const sendNotification = async () => {
  //     try {
  //         const response = await fetch("http://localhost:4000/send-notifications", {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify({ title : "Testing" , body : "This is the Test notification" }) // Send title & body in request
  //         });
  
  //         const result = await response.json();
  //         console.log("Notification Response:", result);
  //     } catch (error) {
  //         console.error("Error sending notification:", error);
  //     }
  // };
  
  // // Example Call:
  // sendNotification();


  
    // Insert the complaint into the "software_complaints" table.
    const { error } = await supabase
      .from('software_complaints')
      .insert([{
        complaint_text: complaint,
        user_id: localStorage.getItem("user_id")
      }]);

    if (error) {
      console.error('Error submitting software complaint:', error.message);
      setErrorMsg(error.message);
    } else {
      setSubmitted(true);
      setComplaint('');
      // Refresh the list after a successful submission.
      fetchComplaints();
    }
  };

  // Delete a complaint.
  const handleDelete = async (id: number | string) => {
    const sendNotification = async () => {
      try {
          const response = await fetch("http://localhost:4000/send-notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  title: "TEST", // Send title
                  body: "This is a TEST Notification" // Send body
              })
          });
  
          const result = await response.json();
          console.log("Notification Response:", result);
      } catch (error) {
          console.error("Error sending notification:", error);
      }
  };
  
  // Example Call:
  sendNotification();
    const { error } = await supabase
      .from('software_complaints')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting complaint:', error.message);
    } else {
      // Refresh the list after deletion.
      fetchComplaints();
    }
  };

  // Begin editing a complaint.
  const startEditing = (complaint: Complaint) => {
    setEditingId(complaint.id);
    setEditingText(complaint.complaint_text);
  };

  // Cancel editing.
  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Save updated complaint.
  const handleEditSave = async (id: number | string) => {
    const { error } = await supabase
      .from('software_complaints')
      .update({ complaint_text: editingText })
      .eq('id', id);

    if (error) {
      console.error('Error updating complaint:', error.message);
    } else {
      setEditingId(null);
      setEditingText('');
      fetchComplaints();
    }
  };

  return (
    <div>
      <h2 className="text-[28px] leading-9 text-[#000000] font-bold mb-4">Software Complaint</h2>
      <div className="p-6 bg-white rounded-[10px] shadow-lg mb-6">
        <h2 className="text-[22px] leading-7 text-[#000000] font-semibold mb-4">Describe Your Issue</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={complaint}
            rows={6}
            onChange={(e) => setComplaint(e.target.value)}
            className="w-full border border-gray-300 rounded-[10px] p-2 mb-4 outline-none"
            placeholder="Please provide a brief description"
            required
          ></textarea>
          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          <div className='flex justify-end'>
            <button
              type="submit"
              className="w-[179px] h-[45px] px-4 py-2 bg-[#9A00FF] text-white rounded-[10px] hover:bg-blue-700"
            >
              Submit Complaint
            </button>
          </div>
        </form>
        {submitted && (
          <p className="text-green-600 mt-4">Complaint submitted successfully!</p>
        )}

      </div>
      <div className="p-6 bg-white rounded-[10px] shadow-lg mb-6">
        <h3 className="text-xl font-semibold mb-4">Submitted Software Complaints</h3>
        {complaintsList.length > 0 ? (
          <ul className="space-y-2">
            {complaintsList.map((item) => (
              <li key={item.id} className="p-3 border border-gray-200 rounded flex flex-col">
                {editingId === item.id ? (
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 mb-2"
                    />
                    <div>
                      <button
                        onClick={() => handleEditSave(item.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded mr-2 hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p>{item.complaint_text}</p>
                      {item.created_at && (
                        <span className="text-sm text-gray-500">
                          ({new Date(item.created_at).toLocaleString()})
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(item)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No complaints submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default SoftwareComplaintSection;
