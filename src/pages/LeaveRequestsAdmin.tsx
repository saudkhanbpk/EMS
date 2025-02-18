import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Import supabase instance

const LeaveRequestsAdmin = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Pending");

  useEffect(() => {
    handlePendingRequests();
  }, []);

  // Fetch Pending Requests
  const handlePendingRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users:users!leave_requests_user_id_fkey(email, full_name, id)")
    .eq("status", "pending");
    if (!error) setPendingRequests(data) ;
    setLoading(false);
    console.log("data", data , error);

  };

  // Fetch Approved Requests
  const handleApprovedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("leave_requests") 
    .select("*, users:users!leave_requests_user_id_fkey(email, full_name)")
    .eq("status", "approved");
    if (!error){
      setApprovedRequests(data);
       console.log(data);}
    
    setLoading(false);
  };

  // Fetch Rejected Requests
  const handleRejectedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users:users!leave_requests_user_id_fkey(email, full_name)")
    .eq("status", "rejected");
    if (!error) setRejectedRequests(data);
    setLoading(false);
  };





  // const handleAction = async (id, newStatus, userId) => {
  //   // Step 1: Get the created_at date from the leave_requests table
  //   const { data: leaveData, error: leaveError } = await supabase
  //     .from("leave_requests")
  //     .select("created_at")
  //     .eq("id", id)
  //     .single();  // Assuming there's only one leave request with this id
  
  //   if (leaveError) {
  //     console.error("Error fetching leave request data:", leaveError);
  //     return;
  //   }
  
  //   // Step 2: Extract the date part from the created_at field (YYYY-MM-DD)
  //   //at this we are comparing with created at time but we need to compare with leave_date like the second method
  //   // const createdDate = leaveData.created_at.split("T")[0];  // Split to get just the date part
  //   const createdDate = leaveData.leave_date; // leave_date is in 'YYYY-MM-DD' format

  
  //   // Step 3: Now check if an absentee record exists for the same user on that date
  //   let { data, error: selectError } = await supabase
  //     .from("absentees")
  //     .select("*")
  //     .eq("user_id", userId)
  //     .gte("created_at", createdDate + "T00:00:00")
  //     .lte("created_at", createdDate + "T23:59:59");
  
  //   if (selectError) {
  //     console.error("Error fetching absentee data:", selectError);
  //     return;
  //   }
  
  //   // Step 4: If an absentee record exists, update it
  //   if (data.length > 0) {
  //     let { error: updateAbsenteesError } = await supabase
  //       .from("absentees")
  //       .update({ "absentee_type": "leave" })
  //       .eq("user_id", userId)
  //       .gte("created_at", createdDate + "T00:00:00")
  //       .lte("created_at", createdDate + "T23:59:59");
  
  //     if (updateAbsenteesError) {
  //       console.error("Error updating absentee:", updateAbsenteesError);
  //       return;
  //     }
  //   } else {
  //     // Step 5: If no absentee record exists for that day, insert a new one
  //     let { error: insertError } = await supabase
  //       .from("absentees")
  //       .insert({ user_id: userId, absentee_type: "leave", created_at: createdDate + "T00:00:00" });
  
  //     if (insertError) {
  //       console.error("Error inserting into absentees:", insertError);
  //       return;
  //     }
  //   }
  
  //   // Step 6: Update the leave request status
  //   const { error: updateError } = await supabase
  //     .from("leave_requests")
  //     .update({ status: newStatus })
  //     .eq("id", id);
  
  //   if (updateError) {
  //     console.error("Error updating leave request status:", updateError);
  //     return;
  //   }
  
  //   // Step 7: Refresh the lists based on the selected tab
  //   if (selectedTab === "Pending") handlePendingRequests();
  //   else if (selectedTab === "Approved") handleApprovedRequests();
  //   else handleRejectedRequests();
  // };






  const handleActionAccept = async (id, newStatus, userId, leavetype) => {
    // Step 1: Get the leave_date from the leave_requests table
    const { data: leaveData, error: leaveError } = await supabase
      .from("leave_requests")
      .select("leave_date") // Fetching leave_date instead of created_at
      .eq("id", id)
      .single();  // Assuming there's only one leave request with this id
  
    if (leaveError) {
      console.error("Error fetching leave request data:", leaveError);
      return;
    }
  
    // Step 2: Use the leave_date directly (it's already in 'YYYY-MM-DD' format)
    const leaveDate = leaveData.leave_date;  // leave_date is in 'YYYY-MM-DD' format

    // Step 3: Now check if an absentee record exists for the same user on that date
    let { data, error: selectError } = await supabase
      .from("absentees")
      .select("*")
      .eq("user_id", userId)
      .eq("absentee_date", leaveDate)  // Use leaveDate to compare
      // .lte("created_at", leaveDate + "T23:59:59");  // Use leaveDate to compare
  
    if (selectError) {
      console.error("Error fetching absentee data:", selectError);
      return;
    }
  
    // Step 4: If an absentee record exists, update it
    if (data.length > 0) {
      let { error: updateAbsenteesError } = await supabase
        .from("absentees")
        .update({ "absentee_type": "leave" , "absentee_date" : leaveDate, "absentee_Timing" : leavetype})
        .eq("user_id", userId)
        .eq("absentee_date", leaveDate)  // Use leaveDate to compare

        // .gte("created_at", leaveDate + "T00:00:00")
        // .lte("created_at", leaveDate + "T23:59:59");
  
      if (updateAbsenteesError) {
        console.error("Error updating absentee:", updateAbsenteesError);
        return;
      }
    } else {
      // Step 5: If no absentee record exists for that day, insert a new one
      let { error: insertError } = await supabase
        .from("absentees")
        .insert({ user_id: userId, absentee_type: "leave", "absentee_Timing" : leavetype , "absentee_date" : leaveDate
        });
  
      if (insertError) {
        console.error("Error inserting into absentees:", insertError);
        return;
      }
    }
  
    // Step 6: Update the leave request status
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({ status: newStatus })
      .eq("id", id);
  
    if (updateError) {
      console.error("Error updating leave request status:", updateError);
      return;
    }
  
    // Step 7: Refresh the lists based on the selected tab
    if (selectedTab === "Pending") handlePendingRequests();
    else if (selectedTab === "Approved") handleApprovedRequests();
    else handleRejectedRequests();
};






const handleActionReject = async (id, newStatus, userId , leavetype) => {
  // Step 1: Get the leave_date from the leave_requests table
  const { data: leaveData, error: leaveError } = await supabase
    .from("leave_requests")
    .select("leave_date") // Fetching leave_date instead of created_at
    .eq("id", id)
    .single();  // Assuming there's only one leave request with this id

  if (leaveError) {
    console.error("Error fetching leave request data:", leaveError);
    return;
  }

  // Step 2: Use the leave_date directly (it's already in 'YYYY-MM-DD' format)
  const leaveDate = leaveData.leave_date;  // leave_date is in 'YYYY-MM-DD' format

  // Step 3: Now check if an absentee record exists for the same user on that date
  let { data, error: selectError } = await supabase
    .from("absentees")
    .select("*")
    .eq("user_id", userId)
    .eq("absentee_date", leaveDate)  // Use leaveDate to compare
    // .lte("created_at", leaveDate + "T23:59:59");  // Use leaveDate to compare

  if (selectError) {
    console.error("Error fetching absentee data:", selectError);
    return;
  }

  // Step 4: If an absentee record exists, update it
  if (data.length > 0) {
    let { error: updateAbsenteesError } = await supabase
      .from("absentees")
      .update({ "absentee_type": "Absent" , "absentee_date" : leaveDate , "absentee_Timing" : leavetype})
      .eq("user_id", userId)
      .eq("absentee_date", leaveDate)  // Use leaveDate to compare

      // .gte("created_at", leaveDate + "T00:00:00")
      // .lte("created_at", leaveDate + "T23:59:59");

    if (updateAbsenteesError) {
      console.error("Error updating absentee:", updateAbsenteesError);
      return;
    }
  } else {
    // Step 5: If no absentee record exists for that day, insert a new one
    let { error: insertError } = await supabase
      .from("absentees")
      .insert({ user_id: userId, absentee_type: "Absent", "absentee_Timing" : leavetype, "absentee_date" : leaveDate
      });

    if (insertError) {
      console.error("Error inserting into absentees:", insertError);
      return;
    }
  }

  // Step 6: Update the leave request status
  const { error: updateError } = await supabase
    .from("leave_requests")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating leave request status:", updateError);
    return;
  }

  // Step 7: Refresh the lists based on the selected tab
  if (selectedTab === "Pending") handlePendingRequests();
  else if (selectedTab === "Approved") handleApprovedRequests();
  else handleRejectedRequests();
};




  

  const renderRequests = (requests) => (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {requests.length === 0 ? (
        <p className="text-center text-gray-500">No requests available.</p>
      ) : (
        requests.map((request) => (
          <div key={request.id} className="p-4 mb-4  text-sm text-gray=400 bg-gray-100 rounded-lg shadow">
            <p><span className="text-gray-700">Request For : </span> <span className="text-sm text-gray-500">{request.leave_date} {"-"} {request.leave_type}</span></p>
            <p> {request.description}</p>
            <p className="text-gray-700"> {request.full_name}</p>
            {/* <p> 
              <span 
                 className={`${
                   request.status === "pending" ? "text-yellow-600" : 
                   request.status === "approved" ? "text-green-600" : 
                   "text-red-600"
                }`}
              >
                {request.status}
               </span>
            </p> */}
            <span
                  className={`inline-block mt-2 px-4 h-3 text-[0px] font-medium rounded ${
                    // request.status === "pending"
                    //   ? "bg-yellow-300 text-yellow-800"
                    //   : "bg-green-300 text-green-800"
                      request.status === "pending" ? "bg-yellow-500 ": 
                      request.status === "approved" ? "bg-green-400" : 
                      "bg-red-400"
                  }`}
                >
                  {request.status}
                </span>
            
            {selectedTab === "Pending" && (
              <div className="mt-3 flex gap-4">
                <button
                  onClick={() => handleActionAccept(request.id, "approved" ,request.users.id , request.leave_type)}
                  className="bg-green-200 text-green-600 px-4 py-1 rounded-lg hover:bg-green-600 hover:text-white transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleActionReject(request.id, "rejected", request.users.id)}
                  className="bg-red-200 text-red-600 px-6 py-1 rounded-lg hover:bg-red-600 hover:text-white transition"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
  
  return (
    <div className="max-w-full mx-auto px-4">
      {/* Buttons for Selecting Tabs */}
      <div className="flex justify-center gap-8 mb-6">
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition ${selectedTab === "Pending" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          onClick={() => { setSelectedTab("Pending"); handlePendingRequests(); }}
        >
          Pending Requests
        </button>
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition ${selectedTab === "Approved" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          onClick={() => { setSelectedTab("Approved"); handleApprovedRequests(); }}
        >
          Approved Requests
        </button>
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition ${selectedTab === "Rejected" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          onClick={() => { setSelectedTab("Rejected"); handleRejectedRequests(); }}
        >
          Rejected Requests
        </button>
      </div>

      {/* Content Display */}
      <div className="bg-white p-6 rounded-lg shadow-md h-[70vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-semibold mb-4">{selectedTab} Requests</h2>
        {loading ? <p className="text-center text-gray-500">Loading requests...</p> : renderRequests(selectedTab === "Pending" ? pendingRequests : selectedTab === "Approved" ? approvedRequests : rejectedRequests)}
      </div>
    </div>
  );
};

export default LeaveRequestsAdmin;
