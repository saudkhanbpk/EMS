import React, { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useRef } from 'react';

interface Developer {
  id: string;
  full_name: string;
}
interface Developer {
  id: string;
  full_name: string;
}

interface AddNewTaskProps {
  setselectedtab: (tab: string) => void;
  ProjectId: string;
  mockDevelopers: Developer[];
  devopss: any[];
  refreshTasks: () => void;
  projectName?: string;
}

const AddNewTask = ({
  setselectedtab,
  ProjectId,
  devopss,
  refreshTasks,
  projectName,
}: AddNewTaskProps) => {
  console.log('devopss:', devopss);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDevs, setSelectedDevs] = useState<string[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>(devopss || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState("0");
  const [priority, setPriority] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deadline, setdeadline] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (devopss) {
      setDevelopers(devopss);
      console.log('Devops', devopss);
    }
  }, [devopss]);

  const handleDeveloperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedDevs.includes(value)) {
      setSelectedDevs([...selectedDevs, value]);
    }
  };

  const removeDeveloper = (id: string) => {
    setSelectedDevs(selectedDevs.filter((devId) => devId !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `task-images/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('newtaskimage')
        .upload(filePath, imageFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('newtaskimage').getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Image upload error:', err);
      throw err; // Re-throw to be caught in handleSubmit
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendTaskEmail = async (taskData: any) => {
    try {
      console.log('Sending emails to developers:', selectedDevs);

      // Fetch full user data including emails for assigned developers
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, full_name, personal_email')
        .in('id', selectedDevs);

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      console.log('User data fetched:', userData);

      for (const user of userData) {
        if (user.personal_email) {
          console.log('Sending email to:', user.personal_email);

          const response = await fetch(
            'https://ems-server-0bvq.onrender.com/sendtaskemail',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: user.full_name,
                projectName: projectName || 'Unknown Project',
                kpiCount: score || '0',
                projectId: ProjectId,
                priority: priority || 'Low',
                recipientEmail: user.personal_email,
              }),
            }
          );

          if (response.ok) {
            console.log('Email sent successfully to:', user.full_name);
          } else {
            console.error(
              'Failed to send email to:',
              user.full_name,
              response.status
            );
          }
        } else {
          console.log('No email found for user:', user.full_name);
        }
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      setIsLoading(true);
      // Upload image first if exists
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      const { data, error } = await supabase
        .from('tasks_of_projects')
        .insert([
          {
            project_id: ProjectId,
            title: title,
            description: description,
            devops: selectedDevs.map((id) =>
              developers.find((d) => d.id === id)
            ),
            status: 'todo',
            score: score,
            priority: priority || 'Low',
            created_at: new Date().toISOString(),
            imageurl: imageUrl,
            deadline: deadline || null,
          },
        ])
        .select();

      if (error) throw error;

      // Send email notifications
      await sendTaskEmail(data[0]);

      alert('Task created successfully!');
      setTitle('');
      setDescription('');
      setSelectedDevs([]);
      setScore("0");
      setPriority("");
      setError("");
      refreshTasks(); // Call the refresh function to update the task list
      setImageFile(null);
      setImagePreview(null);
      setdeadline(null);
      setselectedtab('tasks');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        if (file) {
          setImageFile(file); // Save the image for upload later

          const reader = new FileReader();
          reader.onload = () => {
            setImagePreview(reader.result as string); // Show preview
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <ArrowLeft
        className="hover:bg-gray-300 ml-6 rounded-2xl cursor-pointer"
        size={24}
        onClick={() => setselectedtab('tasks')}
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
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
            <label
              htmlFor="description"
              className="block  text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <div
              contentEditable
              ref={descriptionRef}
              onPaste={handlePaste}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 overflow-auto"
            ></div>
          </div>

          {/* Score Input */}
          <div className=" w-[100%] flex justify-between ">
            <div className="mb-4 w-[49%]">
              <label
                htmlFor="score"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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

            {/* Score Input */}
            <div className="mb-4 w-[49%]">
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Task Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex w-full justify-between">
            <div className="w-[49%]">
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                value={deadline || ''}
                onChange={(e) => setdeadline(e.target.value)}
                className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image Upload */}
            <div className="mb-4 w-[49%]">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Task Image (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
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
                {selectedDevs.map((devId) => {
                  const dev = developers.find((d) => d.id === devId);
                  return dev ? (
                    <div
                      key={devId}
                      className="flex items-center bg-blue-100 px-3 py-1 rounded-full"
                    >
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
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewTask;
