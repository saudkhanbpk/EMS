import React from "react";
import { useEffect , useState } from "react";
import { SendHorizonalIcon} from "lucide-react";
import { supabase } from "../lib/supabase";


const Comments = ({taskid}) => {
    const [comment , setcomment] = useState('')
    var userID = localStorage.getItem('user_id')

    const putcomment = async () => {
        if (comment === '') {
            alert("Please Enter a Comment")
            return
        }
        const {data , error } = await supabase
        .from('comments')
        .insert({comment_text :comment,
             task_id : taskid,
             user_id : userID,
        })
        if (error) {
            console.error("Error Inserting Comment:" , error);
        }
        else{
            console.log("Comment Inserted Successfully:" , data);
            setcomment('')
            }
    }

    return(
        <div className="flex flex-row justify-between items-center bg-white rounded-lg p-0 gap-1 shadow-2xl mt-2 mb-0">
         <input type="text" 
         className="border-none w-full text-sm p-2 rounded-lg shadow-2xl"
         onClick={(e) => {e.stopPropagation()}}
         value={comment} 
         placeholder="Add Comment..."
         onChange={(e) => setcomment(e.target.value)}/>
         <button className="hover:bg-gray-200 rounded-lg p-2">
         <SendHorizonalIcon 
         className="text-gray-500"
         onClick={(e) => {
            putcomment()
            e.stopPropagation()
            }}/>
            </button>
        </div>
    )
}
export default Comments;