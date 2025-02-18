import React from "react";
import {useState, useEffect }from "react";
import { supabase } from "../lib/supabase";
import { ChevronLeft } from "lucide-react";
interface LeaveRequestProps {
  setActiveComponent: React.Dispatch<React.SetStateAction<string>>;
}

const LeaveHistory: React.FC<LeaveRequestProps> = ({ setActiveComponent }) => {
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
    <div>
       <div className="mb-4">
        <button onClick={() => setActiveComponent("default")} className="text-gray-600 hover:bg-gray-300 rounded-2xl
         translate-x-2 transition-transform ease-in-out duration-300 transform hover:scale-205">
          <ChevronLeft/>
        </button>
      </div>

    <div className="bg-white p-6 mt-5 rounded-lg shadow-sm h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-4 text-gray-700 w-full px-3">
          <h1 className="text-2xl font-bold mb-7">Leaves History</h1>
        </div>
      <div className="width-full break-words grid grid-cols-1 mt-6 md:grid-cols-2 gap-4">
        {LeaveRequests.map((request:any) => (
          <div className="bg-gray-100 break-words p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {request.leave_type}
            </h2>
            <p className="text-gray-600 break-words  text-sm">
             <span className="text-gray-800">Request For : </span> 
             {new Date(request.leave_date).toDateString().split(' ').slice(1).join(' ')}
            </p>
            <p className="text-gray-900">
             {request.description}
            </p>
            <p className="text-gray-600 text-sm mt-1 mb-0">
              {new Date(request.start_date).toDateString().split(' ').slice(1).join(' ')}
            </p>
            <p> 
              <span 
                 className={`${
                   request.status === "pending" ? "text-yellow-600 mt-0" : 
                   request.status === "approved" ? "text-green-600 mt-0" : 
                   "text-red-600 mt-0"
                }`}
              >
                {request.status}
               </span>
            </p>
           
          </div>
        ))}
      </div>
    </div>
    </div>
)
};


export default LeaveHistory;
