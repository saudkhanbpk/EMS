import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const TodoTask = ({
  projectId,
  fetchTasks,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
  fetchTasks: () => void;
}) => {
  const [input, setInput] = useState('');
  const handleQuickAddTask = async (title: string) => {
    try {
      // Create new task with default values
      const newTask = {
        title: title,
        project_id: projectId,
        status: 'todo',
        score: 0,
        priority: 'Low',
        devops: [], // Empty by default, user can assign later
        description: '',
        created_at: new Date().toISOString(),
      };

      // Save to database
      const { data, error } = await supabase
        .from('tasks_of_projects')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      toast.success('Task created successfully!');
      // Refresh tasks to show the new one
      await fetchTasks();

      // Show success toast notification
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      // Show error toast notification
      toast.error('Failed to create task. Please try again.');
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.length >= 3) {
      handleQuickAddTask(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 mb-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter task"
        className="border border-gray-300 rounded px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        type="submit"
        disabled={input.length < 3}
        className={`px-4 py-2 rounded text-white ${
          input.length < 3
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        } transition-colors duration-200`}
      >
        Submit
      </button>
    </form>
  );
};

export default TodoTask;
