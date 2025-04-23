import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Globe,
  Building2,
  Slack,
  Briefcase,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Calendar
} from "lucide-react";
import { FaEdit } from "react-icons/fa";
import { useAuthStore } from "../lib/store";
import { supabase } from "../lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  personal_email?: string;
  slack_id?: string;
  joining_date?: string;
  profile_image?: string;
  profession?: string;
  location?: string;
  salary?: string;
  per_hour_pay?: string;
  role?: string;
  created_at: string;
}

const ProfileCard: React.FC = () => {
  const authUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
    profile_image: null as File | null,
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Calculate employment duration
  const getEmploymentDuration = (joinDate: string) => {
    const joined = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - joined.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)) + " months";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, profile_image: e.target.files![0] }));
    }else{
      setFormData(prev => ({ ...prev, profile_image: null }));
    }
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;

        let profileImageUrl = null;
        if (data.profile_image) {
          if (data.profile_image.startsWith("http")) {
            profileImageUrl = data.profile_image;
          } else {
            const { data: { publicUrl } } = await supabase
              .storage
              .from("profilepics")
              .getPublicUrl(data.profile_image);
            profileImageUrl = publicUrl;
          }
        } 

        setUser({ ...data, profile_image_url: profileImageUrl });
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          personal_email: data.personal_email || "",
          slack_id: data.slack_id || "",
          location: data.location || "",
          profession: data.profession || "",
          salary: data.salary || "",
          per_hour_pay: data.per_hour_pay || "",
          role: data.role || "",
          profile_image: null,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePassword = (field: "current" | "new" | "confirm") => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveChanges = async () => {
    try {
      let profileImagePath = user?.profile_image || null;

      // Upload new profile image if selected
      if (formData.profile_image) {
        const fileExt = formData.profile_image.name.split(".").pop();
        const fileName = `${authUser?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profilepics")
          .upload(filePath, formData.profile_image, { upsert: true });

        if (uploadError) throw uploadError;
        profileImagePath = filePath;
      }

      // Update user data
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
        .eq("id", authUser?.id)
        .select();

      if (error) throw error;

      // Update password if changed
      if (passwordForm.newPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          throw new Error("New passwords do not match");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        });

        if (passwordError) throw passwordError;
      }

      setUser(data[0]);
      setIsEditMode(false);
      setError(null);
    } catch (err: any) {
      setError("Failed to save changes: " + err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading profile...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
  if (!user) return <div className="p-4">No user data found</div>;

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 max-w-4xl w-full">
        <div className="flex justify-end items-center mb-4">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {isEditMode ? (
              <X className="mr-2" size={18} />
            ) : (
              <FaEdit className="mr-2" />
            )}
            {isEditMode ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="flex flex-col items-center mt-2">
          <img
            src={
              formData.profile_image
                ? URL.createObjectURL(formData.profile_image)
                : user.profile_image_url || "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
          <h2 className="text-xl font-bold">{user.full_name || user.email.split('@')[0]}</h2>
          <p className="text-gray-600 capitalize">{user.role || "user"}</p>
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
            {/* <div>
              <label className="text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 p-2 border rounded w-full"
              />
            </div> */}
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
            {/* <div>
              <label className="text-gray-700">Profession</label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="mt-2 p-2 border rounded w-full"
              />
            </div> */}
            {/* <div>
              <label className="text-gray-700">Salary</label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="mt-2 p-2 border rounded w-full"
              />
            </div> */}
            {/* <div>
              <label className="text-gray-700">Per Hour Pay</label>
              <input
                type="text"
                name="per_hour_pay"
                value={formData.per_hour_pay}
                onChange={handleChange}
                className="mt-2 p-2 border rounded w-full"
              />
            </div> */}
            {/* <div>
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
            </div> */}
            <div>
              <label className="text-gray-700">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2 w-full"
              />
            </div>

            {/* Password Change Fields */}
            {/* <div className="col-span-full">
              <h3 className="text-lg font-medium mb-4">Change Password</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-700">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="mt-2 p-2 border rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword("current")}
                      className="absolute right-2 top-3 text-gray-500"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="mt-2 p-2 border rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword("new")}
                      className="absolute right-2 top-3 text-gray-500"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="mt-2 p-2 border rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword("confirm")}
                      className="absolute right-2 top-3 text-gray-500"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div> */}

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
              <span className="text-gray-700">{user.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Phone className="w-5 h-5" />
              <span className="text-gray-700">{user.phone_number || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Mail className="w-5 h-5" />
              <span className="text-gray-700">{user.personal_email || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Slack className="w-5 h-5" />
              <span className="text-gray-700">{user.slack_id || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <MapPin className="w-5 h-5" />
              <span className="text-gray-700">{user.location || "Unknown"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Briefcase  className="w-5 h-5" />
              <span className="text-gray-700">{user.profession || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <CreditCard className="w-5 h-5" />
              <span className="text-gray-700">{user.salary || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <CreditCard className="w-5 h-5" />
              <span className="text-gray-700">{user.per_hour_pay || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Building2 className="w-5 h-5" />
              <span className="text-gray-700">
                {getEmploymentDuration(user.created_at) || "N/A"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Briefcase className="w-5 h-5" />
              <span className="text-gray-700 capitalize">
                {user.role || "user"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Calendar className="w-5 h-5" />
              <span className="text-gray-700">{user.joining_date || "N/A"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;