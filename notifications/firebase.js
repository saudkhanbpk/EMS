
import { initializeApp } from "firebase/app";
import {getMessaging , getToken} from "firebase/messaging";
import { supabase } from "../src/lib/supabase";


const firebaseConfig = {
  apiKey: "AIzaSyAAUF5qzZrljXJjb96NmesXBydmn9Hmjss",
  authDomain: "emsm-1d63e.firebaseapp.com",
  projectId: "emsm-1d63e",
  storageBucket: "emsm-1d63e.firebasestorage.app",
  messagingSenderId: "98198623661",
  appId: "1:98198623661:web:6e75496c45508cf37d7d24",
  measurementId: "G-T7352X97BH"
};


const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);



export async function GenerateToken() {
    const requestPermission = await Notification.requestPermission();
    try {
      const token = await getToken(messaging, {
        vapidKey: "BL3HfaZnS0yXgz9MfkaJ4puWaxE7Yl1qtL7Yko4vxbDBAHsGRhZPLU-55SJrw4HTgLNnIi0_VVfaQF4UnoGCzLI",
      });
      if (token) {
        console.log("FCM Token:", token);
        // Save this token to Supabase under the user's profile
        const updateFcm =  async () => {
            const { data, error } = await supabase
                .from("users")
                .update({ fcm_token: token })
                .eq("id", localStorage.getItem("user_id"))
            if (error) console.error("Error updating FCM token:", error);
            if (data) console.log("FCM token updated successfully" , data);
        }

        updateFcm();
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  }
