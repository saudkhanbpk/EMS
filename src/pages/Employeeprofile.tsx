import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Phone, MapPin, CreditCard, Globe, Building2, Slack, Briefcase, X, ArrowLeft } from "lucide-react";
import { FaEdit } from "react-icons/fa";
import {CheckCircle, PieChart, Users, CalendarClock, Moon, AlarmClockOff, Watch, Info,  Landmark, 
  Clock, DollarSign, FileMinusIcon , TrendingDown , TrendingUp
} from 'lucide-react';


const Employeeprofile = ({ employeeid, employeeview, setemployeeview }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [incrementModel, setIncrementModel] = useState(false);
  const [lastIncrement, setLastIncrement] = useState(null); // Changed from increment to lastIncrement for clarity
  const [incrementData, setIncrementData] = useState({
    user_id: employeeid,
    increment_amount: "",
    increment_date: new Date().toISOString().split('T')[0] // Default to today's date
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    personal_email: "",
    slack_id: "",
    location: "",
    profession: "",
    salary: "",
    per_hour_pay: "",
    role: "",
    profile_image: null,
  });

  const getEmploymentDuration = (joinDate) => {
    const joined = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - joined);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) + " months";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profile_image: file }));
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      // Fetch the user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", employeeid)
        .single();

      if (userError) throw userError;

      // Fetch the last salary increment for that user
      const { data: increments, error: incrementError } = await supabase
        .from("sallery_increment")
        .select("increment_date, increment_amount")
        .eq("user_id", employeeid)
        .order("increment_date", { ascending: false })
        .limit(1);

      if (incrementError) console.error("Error fetching increments:", incrementError);

      if (increments && increments.length > 0) {
        setLastIncrement(increments[0]);
      }

      let profileImageUrl = null;
      if (userData.profile_image) {
        if (userData.profile_image.startsWith("http")) {
          profileImageUrl = userData.profile_image;
        } else {
          const { data: { publicUrl } } = supabase
            .storage
            .from("profilepics")
            .getPublicUrl(userData.profile_image);
          profileImageUrl = publicUrl;
        }
      }

      setEmployeeData({ ...userData, profile_image_url: profileImageUrl });
      setFormData({
        full_name: userData.full_name,
        email: userData.email,
        phone_number: userData.phone_number,
        personal_email: userData.personal_email,
        slack_id: userData.slack_id,
        location: userData.location,
        profession: userData.profession,
        salary: userData.salary,
        per_hour_pay: userData.per_hour_pay,
        role: userData.role || "",
        profile_image: null,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeid) fetchEmployee();
  }, [employeeid]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleIncrementChange = (e) => {
    setIncrementData({
      ...incrementData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitIncrement = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("sallery_increment")
        .insert([incrementData]);

      if (error) throw error;

      // Update the employee's salary in the users table
      const newSalary = Number(employeeData.salary) + Number(incrementData.increment_amount);
      const { error: updateError } = await supabase
        .from("users")
        .update({ salary: newSalary })
        .eq("id", employeeid);

      if (updateError) throw updateError;

      // Refresh the data
      await fetchEmployee();
      setIncrementModel(false);
      setIncrementData({
        user_id: employeeid,
        increment_amount: "",
        increment_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError("Failed to save increment: " + err.message);
    }
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
  if (!employeeData) return <div className="p-4">No employee found</div>;

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen  bg-gray-50 p-6">
      <div className="flex justify-between items-center w-full max-w-4xl mb-6">
        <div className="flex gap-2 items-center mb-4">
          <ArrowLeft onClick={() => setemployeeview("generalview")}
          />
          <h2 className="text-xl font-bold">Employee Details</h2>
        </div>

        <button
          onClick={handleEditClick}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          <FaEdit className="mr-2" /> Edit
        </button>
      </div>

      <div className="bg-white flex justify-between items-center rounded-2xl shadow-md p-3 md:p-6 max-w-4xl mb-5 w-full">
        <div className="flex items-center gap-3">
          <img
            src={
              formData.profile_image
                ? URL.createObjectURL(formData.profile_image)
                : employeeData.profile_image_url || "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="w-32 h-32 rounded-xl object-cover mb-4"
          />
          <div className="flex flex-col items-start gap-1">
            <h2 className="text-xl text-gray-700 font-semibold">{employeeData.full_name}</h2>
            <p className="text-gray-600 capitalize">{employeeData.role || "employee"}</p>
          </div>
        </div>

        <div className="bg-purple-600 h-4 flex justify-center items-center gap-4 text-white p-8 rounded-lg text-lg leading-4 font-normal">
          Total Earning is <span className="font-bold text-[40px]">45,000</span>
          {/* <span className="text-2xl font-bold text-center ">Rs 40,000</span> */}
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-6 max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-md pb-4 flex flex-col items-center justify-center text-center">
          <p className="text-[140px] text-gray-500">6</p>
          <p className="text-xl font-semibold">Total Projects</p>
          <button className="bg-purple-600 rounded-2xl px-3 py-1 mt-2 text-sm text-white">View Details</button>
        </div>

        <div className="rounded-2xl p-2 gap-3 flex flex-col items-center justify-between text-center">
          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">452</h2>
              <Users className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">KPI Score</div>
            <div className="text-gray-400 text-xs mt-1">25% improvement over last month</div>
          </div>

          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">62</h2>
              <Moon className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Normal Days</div>
          </div>
        </div>

        <div className="rounded-2xl p-2 gap-3 flex flex-col items-center justify-between text-center">
          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">360</h2>
              <Clock className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Total Working Hours</div>
            <div className="text-gray-400 text-xs mt-1">10% increase from previous week</div>
          </div>

          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">6</h2>
              <AlarmClockOff className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Absent Days</div>
          </div>
        </div>

        <div className="rounded-2xl p-2 gap-3 flex flex-col items-center justify-between text-center">
          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">30</h2>
              <Watch className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Overtime Hours</div>
            <div className="text-gray-400 text-xs mt-1">5% increase over last workday</div>
          </div>

          <div className="bg-white h-full w-full rounded-2xl shadow-md p-4 flex flex-col items-start justify-center">
            <div className="flex justify-between items-center w-full">
              <h2 className="text-gray-800 text-2xl font-medium">42</h2>
              <CalendarClock className="text-purple-600 h-5 w-5" />
            </div>
            <div className="text-gray-500 text-sm">Leave Days</div>
          </div>
        </div> 

      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-gray-50">
          {/* Personal Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6 w-72">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                <Info className="text-purple-600 h-4 w-4" />
              </div>
              <h2 className="text-gray-800 font-medium">Personal Information</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Email</span>
                <span className="text-gray-600 text-sm">{employeeData.email || "N/A"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Phone Number</span>
                <span className="text-gray-600 text-sm">{employeeData.phone_number || "N/A"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Slack id</span>
                <span className="text-gray-600 text-sm">{employeeData.slack_id || "N/A"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">CNIC Number</span>
                <span className="text-gray-600 text-sm">{employeeData.CNIC || "N/A"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Bank Account No</span>
                <span className="text-gray-600 text-sm">{employeeData.bank_account || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="bg-white rounded-lg shadow-md p-6 w-72">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                <DollarSign className="text-purple-600 h-4 w-4" />
              </div>
              <h2 className="text-gray-800 font-medium">Earnings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Basic Pay</span>
                <span className="text-gray-600 text-sm">40,000</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Total Hours</span>
                <span className="text-gray-600 text-sm">1200</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Pay Per Hour</span>
                <span className="text-gray-600 text-sm">1200</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Overtime</span>
                <span className="text-gray-600 text-sm">00</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Total Earning</span>
                <span className="text-gray-600 text-sm">45,000</span>
              </div>
            </div>
          </div>

          {/* Deductions Card */}
          <div className="bg-white rounded-lg shadow-md p-6 w-72">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                <FileMinusIcon className="text-purple-600 h-4 w-4" />
              </div>
              <h2 className="text-gray-800 font-medium">Deductions</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Extra Leaves</span>
                <span className="text-gray-600 text-sm">5000</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Check-in Late</span>
                <span className="text-gray-600 text-sm">1200</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Advance Pay</span>
                <span className="text-gray-600 text-sm">1500</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Total Deduction</span>
                <span className="text-gray-600 text-sm">1500</span>
              </div>
            </div>
          </div>
        </div>























      <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setemployeeview("generalview")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back to List
          </button>

          <div className="flex space-x-5 flex-row">
            <button
              onClick={() => setIncrementModel(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Increment
            </button>
            <button
              onClick={handleEditClick}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <FaEdit className="mr-2" /> Edit
            </button>
          </div>
        </div>

        {incrementModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 shadow-lg w-96">
              <div className="flex flex-row justify-between mb-4">
                <h2 className="text-lg font-bold">Add Increment</h2>
                <X
                  size={30}
                  onClick={() => setIncrementModel(false)}
                  className="rounded-full hover:bg-gray-300 p-1 cursor-pointer"
                />
              </div>

              <form onSubmit={handleSubmitIncrement}>
                <div className="mb-4">
                  <label htmlFor="increment_date" className="block mb-1 font-medium">
                    Increment Date:
                  </label>
                  <input
                    className="p-2 rounded-xl bg-gray-100 w-full"
                    type="date"
                    name="increment_date"
                    value={incrementData.increment_date}
                    onChange={handleIncrementChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="increment_amount" className="block mb-1 font-medium">
                    Increment Amount:
                  </label>
                  <input
                    className="p-2 rounded-xl bg-gray-100 w-full"
                    type="number"
                    name="increment_amount"
                    value={incrementData.increment_amount}
                    onChange={handleIncrementChange}
                    required
                  />
                </div>

                <div className="text-center mt-6">
                  <button
                    className="w-[50%] px-4 py-2 text-white rounded-xl bg-[#9A00FF] hover:bg-[#8a00e6]"
                    type="submit"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                <option value="employee">project manager</option>
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
              <Briefcase className="w-5 h-5" />
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
            {/* Display last increment if available */}
            {lastIncrement && (
              <div className="flex items-center space-x-2 text-purple-600">
                <CreditCard className="w-5 h-5" />
                <span className="text-gray-700">
                  Last Increment: PKR : {lastIncrement.increment_amount} on {new Date(lastIncrement.increment_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Employeeprofile;








