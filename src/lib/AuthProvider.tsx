import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase'; 
import type { Session, User } from '@supabase/supabase-js';
import { useAuthStore } from './store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on app load
    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error.message);
      }
      if (data?.session) {
        setUser(data.session.user);
      }
      setLoading(false);
    };

    restoreSession();

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        localStorage.setItem('supabaseSession', JSON.stringify(session));
        useAuthStore.getState().setUser(session?.user ?? null);
      }
    
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabaseSession');
        useAuthStore.getState().setUser(null);
      }
    });
    console.log("EVENT ENENT ENENT" , event);
    

    // Listen for login/logout/session refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
