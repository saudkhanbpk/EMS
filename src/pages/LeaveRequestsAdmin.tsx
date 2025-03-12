import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Import supabase instance

const LeaveRequestsAdmin = ({fetchPendingCount}) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [userEmail , setuserEmail]= useState("");

  useEffect(() => {
    handlePendingRequests();
  }, []);

  // Fetch Pending Requests
  const handlePendingRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users:users!leave_requests_user_id_fkey(email, full_name, id , slack_id)")
    .eq("status", "pending");
    if (!error) setPendingRequests(data) ;
    setLoading(false);
    console.log(" Pending data", data);

  };

  // Fetch Approved Requests
  const handleApprovedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("leave_requests") 
    .select("*, users:users!leave_requests_user_id_fkey(email, full_name , slack_id)")
    .eq("status", "approved");
    if (!error) setApprovedRequests(data);
    setLoading(false);
  };

  // Fetch Rejected Requests
  const handleRejectedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users:users!leave_requests_user_id_fkey(email, full_name , slack_id)")
    .eq("status", "rejected");
    if (!error) {
      setRejectedRequests(data);
    }
     setLoading(false);
     console.log("Rejected Data" , data);
     
     
  };



  const handleActionAccept = async (id, newStatus, userId, leavetype , useremail , leavedate , fullname , slackid) => {
    setuserEmail(useremail)
    console.log("slack Id" , slackid);
    console.log("full Name" , fullname);
    
    
    try {
      // Step 1: Get the leave_date from the leave_requests table
      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_requests")
        .select("leave_date") 
        .eq("id", id)
        .single();
  
      if (leaveError) throw new Error("Error fetching leave request data: " + leaveError.message);
  
      const leaveDate = leaveData?.leave_date; // Ensure leaveDate is not undefined
  
      // Step 2: Check if an absentee record exists for the same user on that date
      const { data: absenteeData, error: selectError } = await supabase
        .from("absentees")
        .select("*")
        .eq("user_id", userId)
        .eq("absentee_date", leaveDate);
  
      if (selectError) throw new Error("Error fetching absentee data: " + selectError.message);
  
      // Step 3: Update existing absentee record or insert a new one
      if (absenteeData && absenteeData.length > 0) {
        const { error: updateAbsenteesError } = await supabase
          .from("absentees")
          .update({
            absentee_type: "leave",
            absentee_date: leaveDate,
            absentee_Timing: leavetype,
          })
          .eq("user_id", userId)
          .eq("absentee_date", leaveDate);
  
        if (updateAbsenteesError) throw new Error("Error updating absentee: " + updateAbsenteesError.message);
      } else {
        // Insert a new absentee record
        const { error: insertError } = await supabase
          .from("absentees")
          .insert([
            {
              user_id: userId,
              absentee_type: "leave",
              absentee_Timing: leavetype,
              absentee_date: leaveDate,
            },
          ]);
  
        if (insertError) throw new Error("Error inserting into absentees: " + insertError.message);
      }
  
      // Step 4: Update the leave request status
      const { error: updateError } = await supabase
        .from("leave_requests")
        .update({ status: newStatus })
        .eq("id", id);
  
      if (updateError) throw new Error("Error updating leave request status: " + updateError.message);
  

      const sendSlackNotification = async () => {
        try {
            const response = await fetch("http://localhost:4000/send-slack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ USERID : slackid ,
                   message : "Your Leave Request has been Accepted. "  }),
            });
    
            const data = await response.json();
            console.log("Slack Response:", data);
        } catch (error) {
            console.error("Error sending Slack notification:", error);
        }
    };
    
    // Example usage
    sendSlackNotification();
    

     
     //Replying To the user
     const sendAdminResponse = async () => {
      console.log("userEmail", userEmail);

      try {
          const response = await fetch("http://localhost:4000/send-response", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                employeeName : fullname,
                userEmail: useremail,
                leaveType: leavetype, // Replace with actual value
                startDate: leavedate, // Replace with actual value
                  
              }),
          });

  
          const data = await response.json();
          if (response.ok) {
              alert("Response sent to user successfully!");
          } else {
              alert("Failed to send response: " + data.error);
          }
      } catch (error) {
          console.error("Error sending response:", error);
      }
  };


  sendAdminResponse();


      
  
      // Step 6: Refresh UI based on selectedTab
      if (typeof selectedTab !== "undefined") {
        if (selectedTab === "Pending") handlePendingRequests();
        else if (selectedTab === "Approved") handleApprovedRequests();
        else handleRejectedRequests();
      } else {
        console.warn("selectedTab is undefined.");
      }
  
      if (typeof fetchPendingCount === "function") await fetchPendingCount();
  
      console.log("Leave request successfully updated.");
    } catch (error) {
      console.error(error.message);
    }
  };
  






const handleActionReject = async (id, newStatus, userId , leavetype , useremail , leavedate , fullname , slackid) => {
  
  console.log("slack ID" , slackid);
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
  else if (selectedTab === "Rejected") handleRejectedRequests();
  fetchPendingCount();


  //Sending Slack Notification On Reject Request
  const sendSlackNotification = async () => {
    try {
        const response = await fetch("http://localhost:4000/send-slackreject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ USERID : slackid ,
               message : "Your Leave Request has been Rejected, For More Details Please Contact HR. "  }),
        });

        const data = await response.json();
        console.log("Slack Response:", data);
    } catch (error) {
        console.error("Error sending Slack notification:", error);
    }
};

// Example usage
sendSlackNotification();






  const sendAdminResponsereject = async () => {
    console.log("userEmail", userEmail);

    try {
        const response = await fetch("http://localhost:4000/send-rejectresponse", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              employeeName : fullname,
              userEmail: useremail, 
              leaveType: leavetype, 
              startDate: leavedate, 
                
            }),
        });


        const data = await response.json();
        if (response.ok) {
            alert("Response sent to user successfully!");
        } else {
            alert("Failed to send response: " + data.error);
        }
    } catch (error) {
        console.error("Error sending response:", error);
    }
};


sendAdminResponsereject();


};




  

  const renderRequests = (requests) => (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {requests.length === 0 ? (
        <p className="text-center text-gray-500">No requests available.</p>
      ) : (
        requests.map((request) => (
          <div key={request.id} className="p-4 mb-4  text-sm text-gray=400 bg-gray-100 break-words rounded-lg shadow">
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
            
              <div className="mt-3 flex justify-end gap-4">
                {(selectedTab === "Rejected" || selectedTab === "Pending") && (               
                   <button
                  onClick={() => handleActionAccept(request.id, "approved" ,request.user_id , request.leave_type , request.user_email , request.leave_date , request.full_name , request.users.slack_id)}
                  className="bg-green-200 text-green-600 px-4 py-1 rounded-lg hover:bg-green-600 hover:text-white transition"
                >
                  Approve
                </button>
                )}
                 {(selectedTab === "Approved" || selectedTab === "Pending") && (        
                <button
                  onClick={() => handleActionReject(request.id, "rejected", request.user_id , request.leave_type ,   request.user_email , request.leave_date, request.full_name, request.users.slack_id)}
                  className="bg-red-200 text-red-600 px-6 py-1 rounded-lg hover:bg-red-600 hover:text-white transition"
                >
                  Reject
                </button>
                 )}
              </div>
            
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
