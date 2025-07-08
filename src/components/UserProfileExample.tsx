import React from 'react';
import { useUser } from '../contexts/UserContext';

const UserProfileExample: React.FC = () => {
  const { userProfile, loading, refreshUserProfile } = useUser();

  if (loading) {
    return <div>Loading user profile...</div>;
  }

  if (!userProfile) {
    return <div>No user profile found</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">User Profile</h2>
      <div className="space-y-2">
        <p><strong>Name:</strong> {userProfile.full_name}</p>
        <p><strong>Email:</strong> {userProfile.email}</p>
        <p><strong>Role:</strong> {userProfile.role}</p>
        <p><strong>Department:</strong> {userProfile.department}</p>
        <p><strong>Position:</strong> {userProfile.position}</p>
        <p><strong>Phone:</strong> {userProfile.phone}</p>
      </div>
      <button 
        onClick={refreshUserProfile}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Profile
      </button>
    </div>
  );
};

export default UserProfileExample;