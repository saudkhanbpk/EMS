import { useState } from "react";
import { Mail, Edit, Save, X, Slack, Eye, EyeOff, Calendar } from "lucide-react";
import profileImage from './../assets/profile_breakdown.jpeg'
import { useAuthStore } from "../lib/store";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface ExtendedUser extends User {
  slack_id?: string;
  personal_email?: string;
  joining_date?: string;
}

const ProfileCard: React.FC = () => {
  const userFromStore = useAuthStore((state) => state.user);
  const user = userFromStore as ExtendedUser | null;
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    personalEmail: user?.user_metadata?.personal_email || "",
    slackId: user?.user_metadata?.slack_id || "",
    joiningDate: user?.user_metadata?.joining_date || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Only validate password fields if the user is trying to change password
      if (formData.newPassword || formData.confirmPassword) {
        // Only require current password if new password is provided
        if (!formData.currentPassword) {
          setError("Current password is required to set a new password");
          return;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          setError("New passwords do not match");
          return;
        }
        
        if (formData.newPassword.length < 6) {
          setError("New password must be at least 6 characters long");
          return;
        }
        
        // Update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        
        if (passwordError) throw passwordError;
      }

      // Update profile information - only fields that have values
      const updateData: Record<string, any> = {};
      
      if (formData.personalEmail) updateData.personal_email = formData.personalEmail;
      if (formData.slackId) updateData.slack_id = formData.slackId;
      if (formData.joiningDate) updateData.joining_date = formData.joiningDate;
      
      // Only make the API call if there's data to update
      if (Object.keys(updateData).length > 0) {
        // Check if user ID exists
        if (!user?.id) {
          throw new Error("User ID not found");
        }

        // Update the user profile in the 'users' table
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);
        
        if (updateError) {
          console.error("Update error details:", updateError);
          throw updateError;
        }
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setFormData({
      personalEmail: user?.user_metadata?.personal_email || "",
      slackId: user?.user_metadata?.slack_id || "",
      joiningDate: user?.user_metadata?.joining_date || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const getUsernameFromEmail = (email: string | undefined) => {
    if (!email) return "Techcreator";
    const atIndex = email.indexOf('@');
    return atIndex > 0 ? email.slice(0, atIndex) : "Techcreator";
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <h2 className="text-[28px] text-[#000000] font-bold">Profile</h2>

      <div className="py-6 relative">
        <div className="mt-4 flex justify-end absolute right-6 top-6">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <Edit size={18} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 text-red-500 hover:text-red-700"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 text-green-600 hover:text-green-800"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 w-full">
          <div className="flex flex-col items-center mb-6">
            <img
              src={profileImage}
              alt="Profile"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded-full border-4 border-gray-300"
            />
            <h2 className="mt-4 text-xl font-semibold">
              {getUsernameFromEmail(user?.email)}
            </h2>
            <p className="text-gray-600">Front End Developer</p>
          </div>

          {!isEditing ? (
            // View Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-gray-700 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="text-[#9A00FF]" size={20} />
                <div>
                  <p className="font-medium">Login Email</p>
                  <p>{user?.email || "example@techcreator.co"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="text-[#9A00FF]" size={20} />
                <div>
                  <p className="font-medium">Personal Email</p>
                  <p>{user?.user_metadata?.personal_email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Slack className="text-[#9A00FF]" size={20} />
                <div>
                  <p className="font-medium">Slack ID</p>
                  <p>{user?.user_metadata?.slack_id || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="text-[#9A00FF]" size={20} />
                <div>
                  <p className="font-medium">Joining Date</p>
                  <p>{formatDate(user?.user_metadata?.joining_date)}</p>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Login Email (Read-only) */}
                <div>
                  <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Login Email (Read-only)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="loginEmail"
                      value={user?.email || ""}
                      readOnly
                      disabled
                      className="pl-10 block w-full rounded-md border border-gray-300 bg-gray-100 py-2 px-3 shadow-sm text-gray-500"
                    />
                  </div>
                </div>

                {/* Personal Email */}
                <div>
                  <label htmlFor="personalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="personalEmail"
                      name="personalEmail"
                      value={formData.personalEmail}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#9A00FF] focus:outline-none focus:ring-1 focus:ring-[#9A00FF]"
                      placeholder="your.personal@example.com"
                    />
                  </div>
                </div>

                {/* Slack ID */}
                <div>
                  <label htmlFor="slackId" className="block text-sm font-medium text-gray-700 mb-1">
                    Slack ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Slack size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="slackId"
                      name="slackId"
                      value={formData.slackId}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#9A00FF] focus:outline-none focus:ring-1 focus:ring-[#9A00FF]"
                      placeholder="Your Slack ID"
                    />
                  </div>
                </div>

                {/* Joining Date */}
                <div>
                  <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="joiningDate"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#9A00FF] focus:outline-none focus:ring-1 focus:ring-[#9A00FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Password */}
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#9A00FF] focus:outline-none focus:ring-1 focus:ring-[#9A00FF]"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <EyeOff size={16} className="text-gray-400" />
                        ) : (
                          <Eye size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#9A00FF] focus:outline-none focus:ring-1 focus:ring-[#9A00FF]"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? (
                          <EyeOff size={16} className="text-gray-400" />
                        ) : (
                          <Eye size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[#9A00FF] focus:outline-none focus:ring-1 focus:ring-[#9A00FF]"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff size={16} className="text-gray-400" />
                        ) : (
                          <Eye size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-[#9A00FF] text-white px-6 py-2 rounded-lg shadow hover:bg-[#8400d6] transition"
                >
                  Update Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileCard;