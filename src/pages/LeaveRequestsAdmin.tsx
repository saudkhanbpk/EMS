import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Import supabase instance
import { Trash2 } from "lucide-react";

const LeaveRequestsAdmin = ({ fetchPendingCount }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Pending");
  const [userEmail, setuserEmail] = useState("");
  const [isloading, setIsLoading] = useState(false);
  const [isrejectloading, setIsRejectLoading] = useState(false);

  useEffect(() => {
    handlePendingRequests();
  }, []);

  // Fetch Pending Requests
  const handlePendingRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, users:users!leave_requests_user_id_fkey(email, personal_email, full_name, id , slack_id , fcm_token)")
      .eq("status", "pending");
    if (!error) setPendingRequests(data);
    setLoading(false);
    console.log(" Pending data", data);
    console.log(data);

  };

  // Fetch Approved Requests
  const handleApprovedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, users:users!leave_requests_user_id_fkey(personal_email, full_name , slack_id, fcm_token)")
      .eq("status", "approved");
    if (!error) setApprovedRequests(data);
    setLoading(false);
  };

  // Fetch Rejected Requests
  const handleRejectedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, users:users!leave_requests_user_id_fkey(personal_email, full_name , slack_id , fcm_token)")
      .eq("status", "rejected");
    if (!error) {
      setRejectedRequests(data);
    }
    setLoading(false);
    console.log("Rejected Data", data);


  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    const { error } = await supabase.from("leave_requests").delete().eq("id", id);
    if (!error) {
      if (selectedTab === "Pending") handlePendingRequests();
      else if (selectedTab === "Approved") handleApprovedRequests();
      else handleRejectedRequests();
    }
  };

  const handleActionAccept = async (id, newStatus, userId, leavetype, useremail, leavedate, fullname, slackid, fcmtoken) => {
    setuserEmail(useremail)
    console.log(useremail);
    console.log(userEmail);

    console.log("slack Id", slackid);
    setIsLoading(true);
    console.log("full Name", fullname);


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


      const sendNotification = async () => {
        try {
          const response = await fetch("http://localhost:4000/send-singlenotifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              {
                title: "Request Accepted",
                body: "Your Leave Request Has Been Accepted",
                fcmtoken: fcmtoken
              }
            ) // Send title & body in request
          });

          const result = await response.json();
          console.log("Notification Response:", result);
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      };

      // Example Call:
      sendNotification();


      const sendSlackNotification = async () => {
        try {
          const response = await fetch("http://localhost:4000/send-slack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              USERID: slackid,
              message: "Your Leave Request has been Accepted. "
            }),
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
              employeeName: fullname,
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
      setIsLoading(false);




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







  const handleActionReject = async (id, newStatus, userId, leavetype, useremail, leavedate, fullname, slackid, fcmtoken) => {
    setIsRejectLoading(true);
    console.log("slack ID", slackid);
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
        .update({ "absentee_type": "Absent", "absentee_date": leaveDate, "absentee_Timing": leavetype })
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
        .insert({
          user_id: userId, absentee_type: "Absent", "absentee_Timing": leavetype, "absentee_date": leaveDate
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

    const sendNotification = async () => {
      try {
        const response = await fetch("http://localhost:4000/send-singlenotifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            {
              title: "Request Rejected",
              body: "Your Leave Request Has Been Rejected",
              fcmtoken: fcmtoken
            }
          ) // Send title & body in request
        });

        const result = await response.json();
        console.log("Notification Response:", result);
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    };

    // Example Call:
    sendNotification();

    //Sending Slack Notification On Reject Request
    const sendSlackNotification = async () => {
      try {
        const response = await fetch("http://localhost:4000/send-slackreject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            USERID: slackid,
            message: "Your Leave Request has been Rejected, For More Details Please Contact HR. "
          }),
        });

        const data = await response.json();
        console.log("Slack Response:", data);
      } catch (error) {
        console.error("Error sending Slack notification:", error);
      }
    };

    // Example usage
    sendSlackNotification();
    setIsRejectLoading(false);




    const sendAdminResponsereject = async () => {
      console.log("userEmail", useremail);

      try {
        const response = await fetch("http://localhost:4000/send-rejectresponse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeName: fullname,
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
            <div className="flex justify-between items-center">
              <div>
                <p><span className="text-gray-700">Request For : </span> <span className="text-sm text-gray-500"> {new Date(request.leave_date).toLocaleDateString()} (
                  {new Date(request.leave_date).toLocaleDateString("en-US", { weekday: "long" })}) {"-"} {request.leave_type}</span></p>
              </div>

              <div>
                <Trash2 size={25} className=" hover:text-red-600 text-red-400 cursor-pointer" onClick={() => handleDelete(request.id)} />
              </div>
            </div>


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
                request.status === "pending" ? "bg-yellow-500 " :
                  request.status === "approved" ? "bg-green-400" :
                    "bg-red-400"
                }`}
            >
              {request.status}
            </span>

            <div className="mt-3 flex justify-end gap-4">
              {(selectedTab === "Rejected" || selectedTab === "Pending") && (
                <button disabled={isloading}
                  onClick={() => handleActionAccept(request.id, "approved", request.user_id, request.leave_type, request.users.personal_email, request.leave_date, request.full_name, request.users.slack_id, request.users.fcm_token)}
                  className="bg-green-200 text-green-600 px-4 py-1 rounded-lg hover:bg-green-600 hover:text-white transition"
                >
                  Approve
                </button>
              )}
              {(selectedTab === "Approved" || selectedTab === "Pending") && (
                <button disabled={isrejectloading}
                  onClick={() => handleActionReject(request.id, "rejected", request.user_id, request.leave_type, request.users.personal_email, request.leave_date, request.full_name, request.users.slack_id, request.users.fcm_token)}
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

    <div className="max-w-full  mx-auto px-2 sm:px-4">
      {/* Buttons for Selecting Tabs */}
      <div className="flex flex-col xs:flex-row justify-center gap-2 xs:gap-4 sm:gap-8 mb-4 sm:mb-6">
        <button
          className={`px-3 py-2 text-sm sm:text-base sm:px-6 rounded-lg font-semibold transition ${selectedTab === "Pending"
            ? "bg-yellow-500 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          onClick={() => { setSelectedTab("Pending"); handlePendingRequests(); }}
        >
          Pending
        </button>
        <button
          className={`px-3 py-2 text-sm sm:text-base sm:px-6 rounded-lg font-semibold transition ${selectedTab === "Approved"
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          onClick={() => { setSelectedTab("Approved"); handleApprovedRequests(); }}
        >
          Approved
        </button>
        <button
          className={`px-3 py-2 text-sm sm:text-base sm:px-6 rounded-lg font-semibold transition ${selectedTab === "Rejected"
            ? "bg-red-500 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          onClick={() => { setSelectedTab("Rejected"); handleRejectedRequests(); }}
        >
          Rejected
        </button>
      </div>

      {/* Content Display */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md h-[60vh] sm:h-[70vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">{selectedTab} Requests</h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading requests...</p>
        ) : (
          renderRequests(
            selectedTab === "Pending"
              ? pendingRequests
              : selectedTab === "Approved"
                ? approvedRequests
                : rejectedRequests
          )
        )}
      </div>
    </div>

  );
};

export default LeaveRequestsAdmin;
