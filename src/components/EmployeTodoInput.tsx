import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface EmployeeTodoProps {
  projectId: string | undefined;
  fetchTasks: () => void;
}
const EmployeTodoInput = ({ projectId, fetchTasks }: EmployeeTodoProps) => {
  const [input, setInput] = useState('');

  const handleQuickAddTask = async (title: string) => {
    try {
      const currentUserId = localStorage.getItem('user_id');
      const { data: currentUserData, error: userError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', currentUserId)
        .single();

      const assignedDevs =
        currentUserData && !userError
          ? [
              {
                id: currentUserId!,
                name: currentUserData.full_name || 'Unknown',
              },
            ]
          : [];
      const newTask = {
        title,
        project_id: projectId,
        status: 'todo',
        score: 0,
        priority: 'Low',
        devops: assignedDevs,
        description: '',
        created_at: new Date().toISOString(),
      };
      console.log(newTask);
      const { data, error } = await supabase
        .from('tasks_of_projects')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      fetchTasks();
      toast.success('Task successfully added');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length >= 3) {
      handleQuickAddTask(input);
      toast.success(`Task submitted: ${input}`);
      setInput('');
    }
  };

  return (
    <form className="my-2" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <input
          value={input} // ✅ controlled input
          onChange={(e) => setInput(e.target.value)}
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={input.length < 3}
          className={`p-2 rounded text-white ${
            input.length < 3
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default EmployeTodoInput;
