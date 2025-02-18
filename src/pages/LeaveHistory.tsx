import React from "react";
import {useState, useEffect }from "react";
import { supabase } from "../lib/supabase";

const LeaveHistory = () => {
   const [LeaveRequests , setLeaveRequests] = useState([]);

   useEffect ( () => {
    const fetchRequests = async () => {
        const user_id = localStorage.getItem('user_id');
        const {data , error} = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user_id)
        if(error){
            console.error('Error Fetching User Leave Requests' , error)
        }
        else{
            setLeaveRequests(data)
        }
    }
   
   fetchRequests();
   },[])




   return(
    <div className="bg-white p-6 rounded-lg shadow-sm h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-4 text-gray-700 w-full flex justify-center" >
        <h1 className="">Leaves History </h1>
      </div>  

      <div className="width-full grid grid-cols-1 mt-6 md:grid-cols-2 gap-4">
        {LeaveRequests.map((request:any) => (
          <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {request.leave_type}
            </h2>
            <p className="text-gray-600">
              <strong>Leave Date:</strong> {new Date(request.leave_date).toDateString()}
            </p>
            <p className="text-gray-600">
              <strong>Requested On:</strong> {new Date(request.start_date).toDateString()}
            </p>
            <p className="text-gray-600">
              <strong>Status:</strong> {request.status}
            </p>
            <p className="text-gray-600">
              <strong>Description:</strong> {request.description}
            </p>
          </div>
        ))}
      </div>
    </div>
)
};


export default LeaveHistory;
