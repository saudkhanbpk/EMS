import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      // Retrieve session from localStorage
      const session = localStorage.getItem('supabaseSession');
      if (session) {
        const parsedSession = JSON.parse(session);
        setUser(parsedSession.user);
        supabase.auth.setSession(parsedSession.access_token); // Restore session if available
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          localStorage.setItem('supabaseSession', JSON.stringify(session)); // Store session in localStorage
          
        }else{
            console.log("Session Data Not Available");
            
        }
      }
      setLoading(false);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        localStorage.setItem('supabaseSession', JSON.stringify(session)); // Save session to localStorage
        console.log("Session Data 1 :" , localStorage.getItem('supabaseSession'));
      } else {
        setUser(null);
        localStorage.removeItem('supabaseSession'); // Remove session from localStorage

      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
