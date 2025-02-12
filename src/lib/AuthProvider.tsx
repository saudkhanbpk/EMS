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
        // console.log("Session Data 1 :" , localStorage.getItem('supabaseSession'));
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













// import React, { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "./supabase";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Function to check if a session is still valid (if it has an expiration time)
//   const isSessionValid = (session) => {
//     if (!session) return false;
//     // Assume session.expires_at is in seconds since epoch.
//     if (session.expires_at) {
//       const expiryDate = new Date(session.expires_at * 1000);
//       if (expiryDate < new Date()) {
//         console.log("Session expired.");
//         return false;
//       }
//     }
//     return true;
//   };

//   useEffect(() => {
//     const fetchSession = async () => {
//       // Retrieve session from localStorage
//       const storedSessionStr = localStorage.getItem('supabaseSession');
//       let session = storedSessionStr ? JSON.parse(storedSessionStr) : null;

//       if (session && isSessionValid(session)) {
//         // Double-check with Supabase for the latest session info.
//         const { data: { session: currentSession } } = await supabase.auth.getSession();
//         if (currentSession && isSessionValid(currentSession)) {
//           setUser(currentSession.user);
//           localStorage.setItem('supabaseSession', JSON.stringify(currentSession));
//         } else {
//           console.log("Stored session is invalid per Supabase.");
//           localStorage.removeItem('supabaseSession');
//           setUser(null);
//         }
//       } else {
//         // If no valid session is found in localStorage, get it from Supabase.
//         const { data: { session: currentSession } } = await supabase.auth.getSession();
//         if (currentSession && isSessionValid(currentSession)) {
//           setUser(currentSession.user);
//           localStorage.setItem('supabaseSession', JSON.stringify(currentSession));
//         } else {
//           console.log("No valid session available from Supabase.");
//           localStorage.removeItem('supabaseSession');
//           setUser(null);
//         }
//       }
//       setLoading(false);
//     };

//     fetchSession();

//     // Listen for auth state changes from Supabase.
//     const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
//       if (session && isSessionValid(session)) {
//         setUser(session.user);
//         localStorage.setItem('supabaseSession', JSON.stringify(session));
//         console.log("Auth state changed. Updated session:", session);
//       } else {
//         setUser(null);
//         localStorage.removeItem('supabaseSession');
//         console.log("Auth state changed. No valid session.");
//       }
//     });

//     return () => {
//       listener.subscription.unsubscribe();
//     };
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading }}>
//       {loading ? <div>Loading...</div> : children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

