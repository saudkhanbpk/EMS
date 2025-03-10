import { Mail, Phone, MapPin, Edit } from "lucide-react";
import profileImage from './../assets/profile_breakdown.jpeg'
import { useAuthStore } from "../lib/store";
const ProfileCard: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  interface User {
    email: string;
    phone: string;
    location: string;
  }


  return (
    <>
      <h2 className="text-[28px] text-[#000000] font-bold">Profile</h2>

      <div className="py-6 relative ">
        <div className="mt-4  flex justify-end absolute right-6 top-6">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
            <Edit />
            <span>Edit</span>
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full h-[420px]">
          <div className="flex flex-col items-center">
            <img
              src={profileImage}
              alt="Profile"
              className="w-48 h-48 object-cover rounded-full border-4 border-gray-300"
            />
            <h2 className="mt-4 text-xl font-semibold">
              {
                user?.user.email ? user?.user.email.slice(0, user?.user.email.indexOf('@')) : "Techcreator"
              }
            </h2>
            <p className="text-gray-600">Front End Developer</p>
          </div>


          <div className="flex justify-between items-end mt-16 text-gray-700 text-sm flex-wrap">
            <div className="flex items-center space-x-2">
              <Mail className="text-[#9A00FF]" size={20} />
              <span>{user?.user.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="text-[#9A00FF]" size={20} />
              <span>{user?.user.phone ? user?.user?.phone : "xxxxxxxx"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="text-[#9A00FF]" size={20} />
              <span>{user?.user?.location ? user?.user.location : "Techcreator"}</span>
            </div>
          </div>


        </div>
      </div>
    </>
  );
};

export default ProfileCard;