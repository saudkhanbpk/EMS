import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "./lib/supabase";

interface Developer {
  id: string;
  full_name: string;
}
interface Developer { 
    id : string;
    full_name : string;
  }

interface AddNewTaskProps {
  setselectedtab: (tab: string) => void;
  ProjectId: string;
  mockDevelopers: Developer[];
}

const AddNewTask = ({ setselectedtab, ProjectId, devopss }: AddNewTaskProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>(devopss || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState("");

  useEffect(() => {
    if (devopss) {
      setDevelopers(devopss);
      console.log("Devops" , devopss);
      
    }
  }, [devopss]);

  const handleDeveloperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedDevs.includes(value)) {
      setSelectedDevs([...selectedDevs, value]);
    }
  };

  const removeDeveloper = (id: string) => {
    setSelectedDevs(selectedDevs.filter(devId => devId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault();   
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tasks_of_projects")
        .insert([{  // Note the array here
          project_id: ProjectId,
          title: title,
          description: description,
          devops: selectedDevs.map(id => developers.find(d => d.id === id)),
          status: "todo",
          score: score,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      alert("Task created successfully!");
      setTitle("");
      setDescription("");
      setSelectedDevs([]);
      setScore("");
      setError("");
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <ArrowLeft 
        className='hover:bg-gray-300 ml-6 rounded-2xl cursor-pointer' 
        size={24} 
        onClick={() => setselectedtab("tasks")}
      />

      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Task</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description Input */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          {/* Score Input */}
          <div className="mb-4">
            <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
              Task Score
            </label>
            <input
              id="score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task Score"
            />
          </div>

          {/* Developers Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Developers
            </label>
            <select
              onChange={handleDeveloperChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              value=""
            >
              <option value="">Select Developer</option>
              {developers?.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.name}
                </option>
              ))}
            </select>

            {selectedDevs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedDevs.map(devId => {
                  const dev = developers.find(d => d.id === devId);
                  return dev ? (
                    <div key={devId} className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                      <span className="mr-2 text-sm">{dev.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDeveloper(devId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#9A00FF] text-white rounded-md hover:bg-[#9900ffe3] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewTask;