
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
  // Only proceed if notification permission is granted
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }
  }

  try {
    // Check for existing token in localStorage to avoid unnecessary token generation
    const existingToken = localStorage.getItem('fcm_token');

    // Get a new token or use existing one
    console.log("Requesting FCM token from Firebase...");
    const token = await getToken(messaging, {
      vapidKey: "BL3HfaZnS0yXgz9MfkaJ4puWaxE7Yl1qtL7Yko4vxbDBAHsGRhZPLU-55SJrw4HTgLNnIi0_VVfaQF4UnoGCzLI",
    });

    if (token) {
      console.log(`FCM Token generated: ${token.substring(0, 20)}...`);

      // Validate token format
      if (token.length < 20) {
        console.error("Generated token appears to be invalid (too short)");
        return null;
      }

      // Save token to localStorage for future reference
      localStorage.setItem('fcm_token', token);

      // Get device information
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString(),
        tokenLength: token.length
      };

      console.log("Device info:", deviceInfo);

      const userId = localStorage.getItem("user_id");
      if (!userId) {
        console.error("User ID not found in localStorage");
        return null;
      }

      // First, clear any invalid tokens this user might have
      try {
        const { error: clearError } = await supabase
          .from("users")
          .update({ fcm_token: null })
          .eq("id", userId)
          .eq("fcm_token", existingToken);

        if (!clearError) {
          console.log("Cleared any existing tokens from users table");
        }
      } catch (clearError) {
        console.error("Error clearing existing tokens:", clearError);
      }

      try {
        // Try to use the fcm_tokens table first
        console.log(`Checking if token exists for user ${userId} in fcm_tokens table`);

        // Ensure userId is in lowercase for consistency
        const normalizedUserId = userId.toLowerCase();
        console.log(`Checking if token exists for normalized user ID ${normalizedUserId}`);

        // Check if this token already exists for this user
        const { data: existingTokens, error: fetchError } = await supabase
          .from("fcm_tokens")
          .select("id, device_info")
          .eq("user_id", normalizedUserId)
          .eq("token", token);

        if (fetchError) {
          // If there's an error (like table doesn't exist), fall back to the users table
          console.log("Error accessing fcm_tokens table, falling back to users table:", fetchError.message);

          // Update the token in the users table as fallback
          const { data, error } = await supabase
            .from("users")
            .update({ fcm_token: token })
            .eq("id", userId);

          if (error) {
            console.error("Error updating FCM token in users table:", error);
          } else {
            console.log("FCM token updated in users table as fallback");
          }
        } else if (!existingTokens || existingTokens.length === 0) {
          // Token doesn't exist for this user, insert it
          console.log(`Token doesn't exist for user ${userId}, creating new entry for this device`);

          // Debug: Check if the table exists and its structure
          const { data: tableInfo, error: tableError } = await supabase
            .from("fcm_tokens")
            .select("*")
            .limit(1);

          if (tableError) {
            console.error("Error checking fcm_tokens table:", tableError.message);
          } else {
            console.log("fcm_tokens table exists, sample data:", tableInfo);
          }

          // Insert the token
          console.log(`Inserting token for user ${userId}:`, {
            user_id: userId,
            token_length: token.length,
            device_info: deviceInfo
          });

          // Ensure userId is in lowercase for consistency
          const normalizedUserId = userId.toLowerCase();

          const { data, error } = await supabase
            .from("fcm_tokens")
            .insert({
              user_id: normalizedUserId,
              token: token,
              device_info: JSON.stringify(deviceInfo)
            })
            .select(); // Return the inserted data

          if (error) {
            console.error("Error inserting FCM token:", error);

            // Fall back to users table if insert fails
            const { data: userData, error: userError } = await supabase
              .from("users")
              .update({ fcm_token: token })
              .eq("id", userId);

            if (userError) {
              console.error("Error updating FCM token in users table:", userError);
            } else {
              console.log("FCM token updated in users table as fallback");
            }
          } else {
            console.log(`FCM token saved successfully for this device. Token ID: ${data?.[0]?.id || 'unknown'}`);

            // Also update the users table for backward compatibility
            try {
              const { error: userUpdateError } = await supabase
                .from("users")
                .update({ fcm_token: token })
                .eq("id", userId);

              if (userUpdateError) {
                console.error("Error updating FCM token in users table for compatibility:", userUpdateError);
              } else {
                console.log("FCM token also updated in users table for compatibility");
              }
            } catch (updateError) {
              console.error("Error in compatibility update:", updateError);
            }
          }
        } else {
          // Token exists, update the last_used_at timestamp
          console.log(`Token already exists for user ${userId}, updating timestamp and device info`);

          // Ensure userId is in lowercase for consistency
          const normalizedUserId = userId.toLowerCase();

          const tokenId = existingTokens[0]?.id;
          console.log(`Updating token with ID ${tokenId} for user ${normalizedUserId}`);

          const { data, error } = await supabase
            .from("fcm_tokens")
            .update({
              user_id: normalizedUserId, // Ensure user_id is normalized
              device_info: JSON.stringify(deviceInfo),
              last_used_at: new Date().toISOString()
            })
            .eq("id", tokenId)
            .select();

          if (error) {
            console.error("Error updating FCM token timestamp:", error);

            // Try updating by user_id and token as fallback
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("fcm_tokens")
              .update({
                device_info: JSON.stringify(deviceInfo),
                last_used_at: new Date().toISOString()
              })
              .eq("user_id", userId)
              .eq("token", token)
              .select();

            if (fallbackError) {
              console.error("Error in fallback token update:", fallbackError);
            } else {
              console.log("FCM token updated using fallback method");
            }
          } else {
            console.log(`FCM token usage timestamp updated for token ID: ${tokenId}`);

            // Also update the users table for backward compatibility
            try {
              const { error: userUpdateError } = await supabase
                .from("users")
                .update({ fcm_token: token })
                .eq("id", userId);

              if (userUpdateError) {
                console.error("Error updating FCM token in users table for compatibility:", userUpdateError);
              }
            } catch (updateError) {
              console.error("Error in compatibility update:", updateError);
            }
          }
        }
      } catch (dbError) {
        console.error("Database error handling FCM token:", dbError);

        // Final fallback - try to update the users table
        try {
          const { data, error } = await supabase
            .from("users")
            .update({ fcm_token: token })
            .eq("id", userId);

          if (error) {
            console.error("Error updating FCM token in users table:", error);
          } else {
            console.log("FCM token updated in users table as final fallback");
          }
        } catch (finalError) {
          console.error("Final error saving FCM token:", finalError);
        }
      }

      return token;
    } else {
      console.log("No registration token available");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}
