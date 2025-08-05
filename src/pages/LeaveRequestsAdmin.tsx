import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Import supabase instance
import { Trash2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const LeaveRequestsAdmin = ({ fetchPendingCount }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const { userProfile } = useUser();
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('Pending');
  const [userEmail, setuserEmail] = useState('');
  const [isloading, setIsLoading] = useState(false);
  const [isrejectloading, setIsRejectLoading] = useState(false);

  useEffect(() => {
    handlePendingRequests();
  }, []);

  // Fetch Pending Requests
  const handlePendingRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select(
        '*, users:users!leave_requests_user_id_fkey(email, personal_email, full_name, id , slack_id , fcm_token)'
      )
      .eq('status', 'pending')
      .eq('organization_id', userProfile?.organization_id)
      .order('created_at', { ascending: false });
    if (!error) setPendingRequests(data);
    setLoading(false);
    console.log(' Pending data', data);
  };

  // Fetch Approved Requests
  const handleApprovedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select(
        '*, users:users!leave_requests_user_id_fkey(personal_email, full_name , slack_id, fcm_token)'
      )
      .eq('status', 'approved')
      .eq('organization_id', userProfile?.organization_id)
      .order('created_at', { ascending: false });
    if (!error) setApprovedRequests(data);
    setLoading(false);
  };

  // Fetch Rejected Requests
  const handleRejectedRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leave_requests')
      .select(
        '*, users:users!leave_requests_user_id_fkey(personal_email, full_name , slack_id , fcm_token)'
      )
      .eq('status', 'rejected')
      .eq('organization_id', userProfile?.organization_id)
      .order('created_at', { ascending: false });
    if (!error) {
      setRejectedRequests(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Are you sure you want to delete this request?')) return;
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id);
    if (!error && !skipConfirm) {
      if (selectedTab === 'Pending') handlePendingRequests();
      else if (selectedTab === 'Approved') handleApprovedRequests();
      else handleRejectedRequests();
    }
    return !error;
  };

  const handleActionAccept = async (
    id,
    newStatus,
    userId,
    leavetype,
    useremail,
    leavedate,
    fullname,
    slackid,
    fcmtoken
  ) => {
    setuserEmail(useremail);
    console.log(useremail);
    console.log(userEmail);

    console.log('slack Id', slackid);
    setIsLoading(true);
    console.log('full Name', fullname);

    try {
      // Step 1: Get the leave_date from the leave_requests table
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('leave_date')
        .eq('id', id)
        .single();

      if (leaveError)
        throw new Error(
          'Error fetching leave request data: ' + leaveError.message
        );

      const leaveDate = leaveData?.leave_date; // Ensure leaveDate is not undefined

      // Step 2: Check if an absentee record exists for the same user on that date
      const { data: absenteeData, error: selectError } = await supabase
        .from('absentees')
        .select('*')
        .eq('user_id', userId)
        .eq('absentee_date', leaveDate);

      if (selectError)
        throw new Error('Error fetching absentee data: ' + selectError.message);

      // Step 3: Update existing absentee record or insert a new one
      if (absenteeData && absenteeData.length > 0) {
        const { error: updateAbsenteesError } = await supabase
          .from('absentees')
          .update({
            absentee_type: 'leave',
            absentee_date: leaveDate,
            absentee_Timing: leavetype,
          })
          .eq('user_id', userId)
          .eq('absentee_date', leaveDate);

        if (updateAbsenteesError)
          throw new Error(
            'Error updating absentee: ' + updateAbsenteesError.message
          );
      } else {
        // Insert a new absentee record with proper absentee_date
        const { error: insertError } = await supabase.from('absentees').insert([
          {
            user_id: userId,
            absentee_type: 'leave',
            absentee_Timing: leavetype,
            absentee_date: leaveDate, // Ensure this is the actual leave date, not today's date
            created_at: new Date().toISOString(), // Set created_at to current timestamp
          },
        ]);

        if (insertError)
          throw new Error(
            'Error inserting into absentees: ' + insertError.message
          );
      }

      // Step 4: Update the leave request status
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError)
        throw new Error(
          'Error updating leave request status: ' + updateError.message
        );

      const sendNotification = async () => {
        try {
          const response = await fetch(
            'https://ems-server-0bvq.onrender.com/send-singlenotifications',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: 'Request Accepted',
                body: 'Your Leave Request Has Been Accepted',
                fcmtoken: fcmtoken,
              }), // Send title & body in request
            }
          );

          const result = await response.json();
          console.log('Notification Response:', result);
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      };

      // Example Call:
      sendNotification();

      const sendSlackNotification = async () => {
        try {
          const response = await fetch(
            'https://ems-server-0bvq.onrender.com/send-slack',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                USERID: slackid,
                message: 'Your Leave Request has been Accepted. ',
              }),
            }
          );

          const data = await response.json();
          console.log('Slack Response:', data);
        } catch (error) {
          console.error('Error sending Slack notification:', error);
        }
      };

      // Example usage
      sendSlackNotification();

      //Replying To the user
      const sendAdminResponse = async () => {
        console.log('userEmail', userEmail);

        try {
          const response = await fetch(
            'https://ems-server-0bvq.onrender.com/send-response',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employeeName: fullname,
                userEmail: useremail,
                leaveType: leavetype, // Replace with actual value
                startDate: leavedate, // Replace with actual value
              }),
            }
          );

          const data = await response.json();
          if (response.ok) {
            alert('Response sent to user successfully!');
          } else {
            alert('Failed to send response: ' + data.error);
          }
        } catch (error) {
          console.error('Error sending response:', error);
        }
      };

      sendAdminResponse();
      setIsLoading(false);

      // Step 6: Refresh UI based on selectedTab
      if (typeof selectedTab !== 'undefined') {
        if (selectedTab === 'Pending') handlePendingRequests();
        else if (selectedTab === 'Approved') handleApprovedRequests();
        else handleRejectedRequests();
      } else {
        console.warn('selectedTab is undefined.');
      }

      if (typeof fetchPendingCount === 'function') await fetchPendingCount();

      console.log('Leave request successfully updated.');
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleActionReject = async (
    id,
    newStatus,
    userId,
    leavetype,
    useremail,
    leavedate,
    fullname,
    slackid,
    fcmtoken
  ) => {
    setIsRejectLoading(true);
    console.log('slack ID', slackid);
    // Step 1: Get the leave_date from the leave_requests table
    const { data: leaveData, error: leaveError } = await supabase
      .from('leave_requests')
      .select('leave_date') // Fetching leave_date instead of created_at
      .eq('id', id)
      .single(); // Assuming there's only one leave request with this id

    if (leaveError) {
      console.error('Error fetching leave request data:', leaveError);
      return;
    }

    // Step 2: Use the leave_date directly (it's already in 'YYYY-MM-DD' format)
    const leaveDate = leaveData.leave_date; // leave_date is in 'YYYY-MM-DD' format

    // Step 3: Now check if an absentee record exists for the same user on that date
    let { data, error: selectError } = await supabase
      .from('absentees')
      .select('*')
      .eq('user_id', userId)
      .eq('absentee_date', leaveDate); // Use leaveDate to compare
    // .lte("created_at", leaveDate + "T23:59:59");  // Use leaveDate to compare

    if (selectError) {
      console.error('Error fetching absentee data:', selectError);
      return;
    }

    // Step 4: If an absentee record exists, update it
    if (data.length > 0) {
      let { error: updateAbsenteesError } = await supabase
        .from('absentees')
        .update({
          absentee_type: 'Absent',
          absentee_date: leaveDate,
          absentee_Timing: leavetype,
        })
        .eq('user_id', userId)
        .eq('absentee_date', leaveDate); // Use leaveDate to compare

      // .gte("created_at", leaveDate + "T00:00:00")
      // .lte("created_at", leaveDate + "T23:59:59");

      if (updateAbsenteesError) {
        console.error('Error updating absentee:', updateAbsenteesError);
        return;
      }
    } else {
      // Step 5: If no absentee record exists for that day, insert a new one
      let { error: insertError } = await supabase.from('absentees').insert({
        user_id: userId,
        absentee_type: 'Absent',
        absentee_Timing: leavetype,
        absentee_date: leaveDate, // Ensure this is the actual leave date
        created_at: new Date().toISOString(), // Set created_at to current timestamp
      });

      if (insertError) {
        console.error('Error inserting into absentees:', insertError);
        return;
      }
    }

    // Step 6: Update the leave request status
    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating leave request status:', updateError);
      return;
    }

    // Step 7: Refresh the lists based on the selected tab
    if (selectedTab === 'Pending') handlePendingRequests();
    else if (selectedTab === 'Approved') handleApprovedRequests();
    else if (selectedTab === 'Rejected') handleRejectedRequests();
    fetchPendingCount();

    const sendNotification = async () => {
      try {
        const response = await fetch(
          'https://ems-server-0bvq.onrender.com/send-singlenotifications',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Request Rejected',
              body: 'Your Leave Request Has Been Rejected',
              fcmtoken: fcmtoken,
            }), // Send title & body in request
          }
        );

        const result = await response.json();
        console.log('Notification Response:', result);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    };

    // Example Call:
    sendNotification();

    //Sending Slack Notification On Reject Request
    const sendSlackNotification = async () => {
      try {
        const response = await fetch(
          'https://ems-server-0bvq.onrender.com/send-slackreject',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              USERID: slackid,
              message:
                'Your Leave Request has been Rejected, For More Details Please Contact HR. ',
            }),
          }
        );

        const data = await response.json();
        console.log('Slack Response:', data);
      } catch (error) {
        console.error('Error sending Slack notification:', error);
      }
    };

    // Example usage
    sendSlackNotification();
    setIsRejectLoading(false);

    const sendAdminResponsereject = async () => {
      console.log('userEmail', useremail);

      try {
        const response = await fetch(
          'https://ems-server-0bvq.onrender.com/send-rejectresponse',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeName: fullname,
              userEmail: useremail,
              leaveType: leavetype,
              startDate: leavedate,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert('Response sent to user successfully!');
        } else {
          alert('Failed to send response: ' + data.error);
        }
      } catch (error) {
        console.error('Error sending response:', error);
      }
    };

    sendAdminResponsereject();
  };
  // Group requests by user, leave type, and description for better organization
  const groupRequests = (requests) => {
    const grouped = {};
    requests.forEach(request => {
      const key = `${request.user_id}-${request.leave_type}-${request.description}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...request,
          dates: [request.leave_date],
          ids: [request.id]
        };
      } else {
        grouped[key].dates.push(request.leave_date);
        grouped[key].ids.push(request.id);
      }
    });
    return Object.values(grouped);
  };

  const handleBulkAction = async (group, action, allRequests) => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    if (action === 'approve') {
      setIsLoading(true);
    } else {
      setIsRejectLoading(true);
    }

    try {
      // Process all leave requests in the group
      for (const id of group.ids) {
        const request = allRequests.find(r => r.id === id);
        const leaveDate = request.leave_date;

        // Handle absentee records
        const { data: absenteeData, error: selectError } = await supabase
          .from('absentees')
          .select('*')
          .eq('user_id', group.user_id)
          .eq('absentee_date', leaveDate);

        if (!selectError) {
          if (absenteeData && absenteeData.length > 0) {
            await supabase
              .from('absentees')
              .update({
                absentee_type: action === 'approve' ? 'leave' : 'Absent',
                absentee_date: leaveDate,
                absentee_Timing: group.leave_type,
              })
              .eq('user_id', group.user_id)
              .eq('absentee_date', leaveDate);
          } else {
            await supabase.from('absentees').insert({
              user_id: group.user_id,
              absentee_type: action === 'approve' ? 'leave' : 'Absent',
              absentee_Timing: group.leave_type,
              absentee_date: leaveDate, // Ensure this is the actual leave date
              created_at: new Date().toISOString(), // Set created_at to current timestamp
            });
          }
        }

        // Update leave request status
        await supabase
          .from('leave_requests')
          .update({ status })
          .eq('id', id);
      }

      // Send notifications only once per group
      const sendNotification = async () => {
        try {
          await fetch(
            'https://ems-server-0bvq.onrender.com/send-singlenotifications',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: action === 'approve' ? 'Request Accepted' : 'Request Rejected',
                body: action === 'approve' 
                  ? `Your ${group.dates.length} leave request(s) have been accepted`
                  : `Your ${group.dates.length} leave request(s) have been rejected`,
                fcmtoken: group.users.fcm_token,
              }),
            }
          );
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      };

      const sendSlackNotification = async () => {
        try {
          await fetch(
            action === 'approve' 
              ? 'https://ems-server-0bvq.onrender.com/send-slack'
              : 'https://ems-server-0bvq.onrender.com/send-slackreject',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                USERID: group.users.slack_id,
                message: action === 'approve'
                  ? `Your ${group.dates.length} leave request(s) have been accepted.`
                  : `Your ${group.dates.length} leave request(s) have been rejected. For more details please contact HR.`,
              }),
            }
          );
        } catch (error) {
          console.error('Error sending Slack notification:', error);
        }
      };

      const sendAdminResponse = async () => {
        try {
          await fetch(
            action === 'approve'
              ? 'https://ems-server-0bvq.onrender.com/send-response'
              : 'https://ems-server-0bvq.onrender.com/send-rejectresponse',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeName: group.full_name,
                userEmail: group.users.personal_email,
                leaveType: group.leave_type,
                startDate: group.dates[0],
                selectedDates: group.dates.join(', '),
              }),
            }
          );
        } catch (error) {
          console.error('Error sending admin response:', error);
        }
      };

      // Send all notifications
      await Promise.all([
        sendNotification(),
        sendSlackNotification(),
        sendAdminResponse()
      ]);

      // Refresh UI
      if (selectedTab === 'Pending') handlePendingRequests();
      else if (selectedTab === 'Approved') handleApprovedRequests();
      else handleRejectedRequests();
      
      if (typeof fetchPendingCount === 'function') await fetchPendingCount();

    } catch (error) {
      console.error('Error in bulk action:', error);
    } finally {
      setIsLoading(false);
      setIsRejectLoading(false);
    }
  };

  const renderRequests = (requests) => {
    const groupedRequests = groupRequests(requests);
    
    return (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groupedRequests.length === 0 ? (
          <p className="text-center text-gray-500">No requests available.</p>
        ) : (
          groupedRequests.map((group) => (
            <div
              key={`${group.user_id}-${group.leave_type}-${group.description.substring(0, 20)}`}
              className="p-4 mb-4 text-sm text-gray-400 bg-gray-100 break-words rounded-lg shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p>
                    <span className="text-gray-700">Request For: </span>
                    <span className="text-sm text-gray-500">
                      {group.dates.length > 1 ? (
                        `${group.dates.length} dates - ${group.leave_type}`
                      ) : (
                        `${new Date(group.dates[0]).toLocaleDateString()} (${new Date(group.dates[0]).toLocaleDateString('en-US', { weekday: 'long' })}) - ${group.leave_type}`
                      )}
                    </span>
                  </p>
                  {group.dates.length > 1 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Dates:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.dates.sort().map((date, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {new Date(date).toLocaleDateString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Trash2
                    size={25}
                    className="hover:text-red-600 text-red-400 cursor-pointer"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete ${group.dates.length} request(s)?`)) {
                        for (const id of group.ids) {
                          await handleDelete(id, true);
                        }
                        // Refresh UI after all deletions
                        if (selectedTab === 'Pending') handlePendingRequests();
                        else if (selectedTab === 'Approved') handleApprovedRequests();
                        else handleRejectedRequests();
                      }
                    }}
                  />
                </div>
              </div>

              <p className="mt-2">{group.description}</p>
              <p className="text-gray-700">{group.full_name}</p>
              
              <span
                className={`inline-block mt-2 px-4 h-3 text-[0px] font-medium rounded ${
                  group.status === 'pending'
                    ? 'bg-yellow-500'
                    : group.status === 'approved'
                    ? 'bg-green-400'
                    : 'bg-red-400'
                }`}
              >
                {group.status}
              </span>

              <div className="mt-3 flex justify-end gap-4">
                {(selectedTab === 'Rejected' || selectedTab === 'Pending') && (
                  <button
                    disabled={isloading}
                    onClick={() => handleBulkAction(group, 'approve', requests)}
                    className="bg-green-200 text-green-600 px-4 py-1 rounded-lg hover:bg-green-600 hover:text-white transition"
                  >
                    Approve {group.dates.length > 1 ? `All (${group.dates.length})` : ''}
                  </button>
                )}
                {(selectedTab === 'Approved' || selectedTab === 'Pending') && (
                  <button
                    disabled={isrejectloading}
                    onClick={() => handleBulkAction(group, 'reject', requests)}
                    className="bg-red-200 text-red-600 px-6 py-1 rounded-lg hover:bg-red-600 hover:text-white transition"
                  >
                    Reject {group.dates.length > 1 ? `All (${group.dates.length})` : ''}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };
  const isOpen = useSelector((state: RootState) => state.sideBar.isOpen);
  return (
    <div
      className={`mx-auto px-2 sm:px-4 ${isOpen ? 'w-[900px]' : 'w-[1150px]'}`}
    >
      {/* Buttons for Selecting Tabs */}
      <div className="flex flex-col xs:flex-row justify-center gap-2 xs:gap-4 sm:gap-8 mb-4 sm:mb-6">
        <button
          className={`px-3 py-2 text-sm sm:text-base sm:px-6 rounded-lg font-semibold transition ${
            selectedTab === 'Pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => {
            setSelectedTab('Pending');
            handlePendingRequests();
          }}
        >
          Pending
        </button>
        <button
          className={`px-3 py-2 text-sm sm:text-base sm:px-6 rounded-lg font-semibold transition ${
            selectedTab === 'Approved'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => {
            setSelectedTab('Approved');
            handleApprovedRequests();
          }}
        >
          Approved
        </button>
        <button
          className={`px-3 py-2 text-sm sm:text-base sm:px-6 rounded-lg font-semibold transition ${
            selectedTab === 'Rejected'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => {
            setSelectedTab('Rejected');
            handleRejectedRequests();
          }}
        >
          Rejected
        </button>
      </div>

      {/* Content Display */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md h-[60vh] sm:h-[70vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
          {selectedTab} Requests
        </h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading requests...</p>
        ) : (
          renderRequests(
            selectedTab === 'Pending'
              ? pendingRequests
              : selectedTab === 'Approved'
              ? approvedRequests
              : rejectedRequests
          )
        )}
      </div>
    </div>
  );
};

export default LeaveRequestsAdmin;
