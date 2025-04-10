import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Phone, MapPin, CreditCard, Globe, Building2, Slack, Briefcase  } from "lucide-react";
import { FaEdit } from "react-icons/fa";

const Employeeprofile = ({ employeeid, employeeview, setemployeeview }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // State to toggle between edit and view mode
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    personal_email: "",
    slack_id: "",
    location: "",
    profession:"",
    salary: "",
    per_hour_pay: "",
    role: "",
    profile_image: null, 
  });
  
  // Define the function to calculate employment duration
  const getEmploymentDuration = (joinDate) => {
    const joined = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joined);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) + " months"; // convert time to months
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profile_image: file }));
    }
  };
  
  

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", employeeid)
          .single();

        if (error) throw error;

        let profileImageUrl = null;
        if (data.profile_image) {
          if (data.profile_image.startsWith("http")) {
            profileImageUrl = data.profile_image;
          } else {
            const { data: { publicUrl } } = supabase
              .storage
              .from("profilepics")
              .getPublicUrl(data.profile_image);
            profileImageUrl = publicUrl;
          }
        }

        setEmployeeData({ ...data, profile_image_url: profileImageUrl });
        setFormData({
          full_name: data.full_name,
          email: data.email,
          phone_number: data.phone_number,
          personal_email: data.personal_email,
          slack_id: data.slack_id,
          location: data.location,
          profession: data.profession,
          salary: data.salary,
          per_hour_pay: data.per_hour_pay,
          role: data.role || "",
          profile_image: null,
        });
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (employeeid) fetchEmployee();
  }, [employeeid]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleSaveChanges = async () => {
    try {
      let profileImagePath = employeeData.profile_image;
  
      if (formData.profile_image) {
        const fileExt = formData.profile_image.name.split(".").pop();
        const fileName = `${employeeid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
  
        const { error: uploadError } = await supabase.storage
          .from("profilepics")
          .upload(filePath, formData.profile_image, { upsert: true });
  
        if (uploadError) throw uploadError;
        profileImagePath = filePath;
      }
  
      const { data, error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          personal_email: formData.personal_email,
          slack_id: formData.slack_id,
          location: formData.location,
          profession: formData.profession,
          salary: formData.salary,
          per_hour_pay: formData.per_hour_pay,
          role: formData.role,
          profile_image: profileImagePath,
        })
        .eq("id", employeeid)
        .select();
  
      if (error) throw error;
  
      setEmployeeData(data[0]);
      setIsEditMode(false);
    } catch (err) {
      setError("Failed to save changes: " + err.message);
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  if (loading) return <div className="text-center p-4">Loading profile...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!employeeData) return <div className="p-4">No employee found</div>;

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gray-50 p-6">
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 max-w-4xl w-full">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setemployeeview("generalview")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to List
        </button>
  
        <button
          onClick={handleEditClick}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <FaEdit className="mr-2" /> Edit
        </button>
      </div>
  
      <div className="flex flex-col items-center mt-2">
        <img
          src={
            formData.profile_image
              ? URL.createObjectURL(formData.profile_image)
              : employeeData.profile_image_url || "https://via.placeholder.com/150"
          }
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover mb-4"
        />
        <h2 className="text-xl font-bold">{employeeData.full_name}</h2>
        <p className="text-gray-600 capitalize">{employeeData.role || "employee"}</p>
      </div>
  
      {isEditMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 text-sm">
          <div>
            <label className="text-gray-700">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Personal Email</label>
            <input
              type="email"
              name="personal_email"
              value={formData.personal_email}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Slack ID</label>
            <input
              type="text"
              name="slack_id"
              value={formData.slack_id}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Profession</label>
            <input
              type="text"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Salary</label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Per Hour Pay</label>
            <input
              type="text"
              name="per_hour_pay"
              value={formData.per_hour_pay}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-2 p-2 border rounded w-full"
            >
              <option value="">Select Role</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="employee">employee</option>
            </select>
          </div>
          <div>
            <label className="text-gray-700">Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2 w-full"
            />
          </div>
  
          <div className="flex justify-end mt-4 col-span-full">
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 text-sm">
          <div className="flex items-center space-x-2 text-purple-600">
            <Mail className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <Phone className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.phone_number || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <Mail className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.personal_email}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <Slack className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.slack_id || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <MapPin className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.location || "Unknown"}</span>
          </div>
        

          <div className="flex items-center space-x-2 text-purple-600">
            <Briefcase  className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.profession || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <CreditCard className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.salary || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <CreditCard className="w-5 h-5" />
            <span className="text-gray-700">{employeeData.per_hour_pay || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <Building2 className="w-5 h-5" />
            <span className="text-gray-700">
              {getEmploymentDuration(employeeData.created_at) || "N/A"}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-purple-600">
            <Briefcase className="w-5 h-5" />
            <span className="text-gray-700 capitalize">
              {employeeData.role || "employee"}
            </span>
          </div>
        </div>
      )}
    </div>
  </div>
  
  );
};

export default Employeeprofile;
