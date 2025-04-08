import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from './store';

// Define the shape of the context data
interface UserType {
  chatUsers: any[];
 
}

// Create the context with a default value
const MyContext = createContext<UserType | undefined>(undefined);

// Create a provider component
interface MyProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<MyProviderProps> = ({ children }) => {
    const [chatUsers, setChatUsers] = useState<any[]>([]);
  const currentuser = useAuthStore((state) => state.user);
  async function fetchAllUsers() {
    try {
      const { data: users, error: usersError } = await supabase.from('users').select('*');
      if (usersError) throw usersError;
let filteredusers=users.filter((user)=>user.id!=currentuser?.id)
      console.log(filteredusers);
      setChatUsers(filteredusers);
      console.log(`Total users fetched: ${users?.length || 0}`);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <MyContext.Provider value={{chatUsers}}>
      {children}
    </MyContext.Provider>
  );
};

// Create a custom hook for consuming the context
export const useUserContext = (): UserType => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};