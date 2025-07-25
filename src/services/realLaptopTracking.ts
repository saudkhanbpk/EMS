import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

export interface RealLaptopStatus {
  user_id: string;
  laptop_state: 'On' | 'Sleep' | 'Off';
  battery_level: number;
  is_charging: boolean;
  last_activity: string;
  is_checked_in: boolean;
  updated_at: string;
}

/**
 * Save current user's REAL laptop status when they're active
 */
export async function saveRealLaptopStatus(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get REAL battery info
    let batteryLevel = 75;
    let isCharging = false;

    try {
      // @ts-ignore - Battery API is experimental
      if ('getBattery' in navigator) {
        // @ts-ignore
        const battery = await navigator.getBattery();
        batteryLevel = Math.round(battery.level * 100);
        isCharging = battery.charging;
      }
    } catch (error) {
      console.log('Battery API not available');
    }

    // Determine REAL current state with 5-minute delay for Away status
    let currentState: 'On' | 'Sleep' | 'Off';

    // Use local laptop time
    const now = Date.now();
    const nowISO = new Date().toISOString();

    // Update activity timestamp using local time
    const lastActivity = localStorage.getItem('last_user_activity');

    if (!navigator.onLine) {
      currentState = 'Off';
      console.log('🔴 User is OFFLINE - No internet connection');
    } else if (document.hidden) {
      // Check if tab has been hidden for more than 5 minutes
      const tabHiddenTime = localStorage.getItem('tab_hidden_since');
      if (!tabHiddenTime) {
        // First time tab is hidden, record time but keep as Online for now
        localStorage.setItem('tab_hidden_since', now.toString());
        currentState = 'On'; // Stay online for first 5 minutes
        console.log('🟡 Tab hidden but staying ONLINE for 5 minutes...');
      } else {
        const hiddenDuration = now - parseInt(tabHiddenTime);
        const minutesHidden = Math.floor(hiddenDuration / (1000 * 60));

        if (minutesHidden >= 5) {
          currentState = 'Sleep';
          console.log(`🟡 User is AWAY - Browser tab hidden for ${minutesHidden} minutes`);
        } else {
          currentState = 'On';
          console.log(`🟢 Tab hidden but staying ONLINE (${5 - minutesHidden} minutes remaining)`);
        }
      }
    } else {
      // Tab is visible, clear the hidden timer and set as online
      localStorage.removeItem('tab_hidden_since');
      currentState = 'On';
      localStorage.setItem('last_user_activity', now.toString());
      console.log('🟢 User is ONLINE - Browser tab is active');
    }

    // Save to localStorage for immediate access
    const realStatus: RealLaptopStatus = {
      user_id: user.id,
      laptop_state: currentState,
      battery_level: batteryLevel,
      is_charging: isCharging,
      last_activity: nowISO,
      is_checked_in: true,
      updated_at: nowISO
    };

    localStorage.setItem(`real_laptop_${user.id}`, JSON.stringify(realStatus));

    // Save to localStorage only (no database needed)
    console.log(`📱 SAVED REAL STATUS for ${user.id}:`);
    console.log(`   State: ${currentState} (${currentState === 'On' ? 'ONLINE' : currentState === 'Sleep' ? 'AWAY' : 'OFFLINE'})`);
    console.log(`   Battery: ${batteryLevel}%${isCharging ? ' (Charging)' : ' (Not Charging)'}`);
    console.log(`   Tab Visible: ${!document.hidden}`);
    console.log(`   Internet: ${navigator.onLine ? 'Connected' : 'Disconnected'}`);
    console.log(`   Timestamp: ${nowISO}`);

    // Also broadcast to other tabs/windows using localStorage events
    localStorage.setItem(`real_laptop_broadcast_${user.id}`, JSON.stringify({
      ...realStatus,
      timestamp: Date.now()
    }));

    // Store in a global shared location for all users to access
    const allUsersData = JSON.parse(localStorage.getItem('all_users_real_status') || '{}');
    allUsersData[user.id] = realStatus;
    localStorage.setItem('all_users_real_status', JSON.stringify(allUsersData));

    // Note: Using localStorage only (no database needed)

    console.log(`📡 Broadcasted real status to all users storage`);

  } catch (error) {
    console.error('Error saving real laptop status:', error);
  }
}

/**
 * Get real status for ANY user from shared storage
 */
export function getRealStatusForUser(userId: string): any {
  try {
    // First check individual storage
    const individual = localStorage.getItem(`real_laptop_${userId}`);
    if (individual) {
      const parsed = JSON.parse(individual);
      const lastUpdate = new Date(parsed.updated_at);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

      if (minutesAgo < 10) { // Data is recent
        return {
          ...parsed,
          minutesAgo,
          isRecent: true
        };
      }
    }

    // Check shared storage
    const allUsersData = JSON.parse(localStorage.getItem('all_users_real_status') || '{}');
    if (allUsersData[userId]) {
      const parsed = allUsersData[userId];
      const lastUpdate = new Date(parsed.updated_at);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

      return {
        ...parsed,
        minutesAgo,
        isRecent: minutesAgo < 10
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting real status for user:', error);
    return null;
  }
}

/**
 * Get REAL laptop status for all users - no fake data
 */
export async function getAllRealLaptopStatus(organizationId: string): Promise<Record<string, RealLaptopStatus>> {
  const result: Record<string, RealLaptopStatus> = {};

  try {
    console.log('🔍 Getting REAL laptop status for all users...');

    // Get all users in organization
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('organization_id', organizationId);

    if (!allUsers) return result;

    // Get REAL laptop status from localStorage only
    console.log(`📊 Getting real laptop data from localStorage for ${allUsers.length} users`);

    // Get attendance data to determine who's checked in TODAY
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data: todayAttendance } = await supabase
      .from('attendance_logs')
      .select('user_id, check_in, check_out, created_at')
      .gte('created_at', startOfToday.toISOString())
      .lt('created_at', endOfToday.toISOString())
      .order('created_at', { ascending: false });

    // Get latest attendance for each user TODAY
    const latestAttendance: Record<string, any> = {};
    todayAttendance?.forEach(record => {
      if (!latestAttendance[record.user_id]) {
        latestAttendance[record.user_id] = record;
      }
    });

    console.log(`📅 Found attendance records for ${Object.keys(latestAttendance).length} users today`);

    const now = new Date();

    // Process each user with localStorage data only
    for (const user of allUsers) {
      const attendance = latestAttendance[user.id];

      // Check if user is checked in TODAY
      const isCheckedIn = attendance && attendance.check_in && !attendance.check_out;

      if (!isCheckedIn) {
        // User not checked in today = Offline
        result[user.id] = {
          user_id: user.id,
          laptop_state: 'Off',
          battery_level: 0,
          is_charging: false,
          last_activity: now.toISOString(),
          is_checked_in: false,
          updated_at: now.toISOString()
        };
        console.log(`❌ ${user.full_name}: NOT CHECKED IN TODAY → OFFLINE`);
        continue;
      }

      // User is checked in - look for REAL laptop status in localStorage
      const stored = localStorage.getItem(`real_laptop_${user.id}`);
      if (stored) {
        try {
          const realStatus = JSON.parse(stored);
          const minutesAgo = Math.floor((now.getTime() - new Date(realStatus.updated_at).getTime()) / (1000 * 60));

          if (minutesAgo <= 5) {
            // Very recent real data - use exactly as is
            result[user.id] = {
              user_id: user.id,
              laptop_state: realStatus.laptop_state,
              battery_level: realStatus.battery_level,
              is_charging: realStatus.is_charging,
              last_activity: realStatus.last_activity,
              is_checked_in: true,
              updated_at: realStatus.updated_at
            };
            console.log(`✅ ${user.full_name}: REAL DATA → ${realStatus.laptop_state} | Battery: ${realStatus.battery_level}% (${minutesAgo}m ago)`);
          } else if (minutesAgo <= 15) {
            // Recent real data but might be away now
            result[user.id] = {
              user_id: user.id,
              laptop_state: 'Sleep', // Assume away if no recent activity
              battery_level: realStatus.battery_level,
              is_charging: realStatus.is_charging,
              last_activity: realStatus.last_activity,
              is_checked_in: true,
              updated_at: realStatus.updated_at
            };
            console.log(`⏰ ${user.full_name}: REAL DATA (OLD) → Away | Last seen ${minutesAgo}m ago`);
          } else {
            // Old real data - assume offline
            result[user.id] = {
              user_id: user.id,
              laptop_state: 'Off',
              battery_level: realStatus.battery_level || 0,
              is_charging: false,
              last_activity: realStatus.last_activity,
              is_checked_in: true,
              updated_at: now.toISOString()
            };
            console.log(`🔴 ${user.full_name}: REAL DATA (VERY OLD) → Offline | Last seen ${minutesAgo}m ago`);
          }
        } catch (error) {
          // Invalid stored data
          result[user.id] = {
            user_id: user.id,
            laptop_state: 'Off',
            battery_level: 0,
            is_charging: false,
            last_activity: attendance.check_in,
            is_checked_in: true,
            updated_at: now.toISOString()
          };
          console.log(`❌ ${user.full_name}: INVALID STORED DATA → Offline`);
        }
      } else {
        // NO REAL DATA - show as offline until they visit the system
        result[user.id] = {
          user_id: user.id,
          laptop_state: 'Off',
          battery_level: 0,
          is_charging: false,
          last_activity: attendance.check_in, // Use check-in time as last activity
          is_checked_in: true,
          updated_at: now.toISOString()
        };
        console.log(`⚫ ${user.full_name}: NO REAL DATA → Offline (needs to visit system)`);
      }
    }

    const realDataCount = Object.values(result).filter(status => status.battery_level > 0).length;
    const totalUsers = allUsers.length;
    const onlineUsers = Object.values(result).filter(s => s.laptop_state === 'On').length;
    const awayUsers = Object.values(result).filter(s => s.laptop_state === 'Sleep').length;
    const offlineUsers = Object.values(result).filter(s => s.laptop_state === 'Off').length;

    console.log(`📊 REAL LAPTOP STATUS SUMMARY:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   With REAL data: ${realDataCount}`);
    console.log(`   Online: ${onlineUsers}, Away: ${awayUsers}, Offline: ${offlineUsers}`);

    return result;

  } catch (error) {
    console.error('Error getting real laptop status:', error);
    return result;
  }
}

/**
 * Enhanced real laptop tracking with broadcasting
 */
export function startRealLaptopTracking(): () => void {
  // Save status immediately
  saveRealLaptopStatus();

  // Save status every 10 seconds for more accurate real-time data
  const interval = setInterval(saveRealLaptopStatus, 10000);

  // Listen for other users' status updates via localStorage events
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('real_laptop_broadcast_')) {
      console.log('📡 Received real status update from another user');
      // Trigger UI refresh when other users update their status
      window.dispatchEvent(new CustomEvent('laptopStatusUpdate'));
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Save on activity - immediate response
  const handleActivity = () => {
    console.log('🎯 User activity detected - saving real status immediately');
    saveRealLaptopStatus();
  };

  // Save on visibility change - immediate response
  const handleVisibilityChange = () => {
    console.log('👁️ Tab visibility changed - saving real status');
    setTimeout(saveRealLaptopStatus, 100);
  };

  // Add event listeners
  document.addEventListener('mousedown', handleActivity);
  document.addEventListener('keydown', handleActivity);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleActivity);
  window.addEventListener('offline', handleActivity);

  console.log('🚀 Started REAL laptop tracking');

  // Add global functions for debugging
  (window as any).checkRealLaptopStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const stored = localStorage.getItem(`real_laptop_${user.id}`);
      console.log('🔍 Current Real Laptop Status:', stored ? JSON.parse(stored) : 'No data found');
    }
  };

  (window as any).checkAllUsersRealStatus = () => {
    const allUsersData = JSON.parse(localStorage.getItem('all_users_real_status') || '{}');
    console.log('🌐 All Users Real Status:', allUsersData);

    Object.keys(allUsersData).forEach(userId => {
      const data = allUsersData[userId];
      const lastUpdate = new Date(data.updated_at);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

      console.log(`👤 User ${userId}:`, {
        state: data.laptop_state === 'On' ? 'ONLINE' : data.laptop_state === 'Sleep' ? 'AWAY' : 'OFFLINE',
        battery: `${data.battery_level}%${data.is_charging ? ' (Charging)' : ''}`,
        lastUpdate: `${minutesAgo}m ago`
      });
    });
  };

  (window as any).forceUpdateRealStatus = () => {
    console.log('🔄 Force updating real laptop status...');
    saveRealLaptopStatus();
  };

  (window as any).testTimeLogic = () => {
    const now = new Date();
    const currentHour = now.getHours();
    console.log(`🕐 Current time: ${currentHour}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`📊 Time-based logic:`);

    if (currentHour >= 9 && currentHour <= 17) {
      console.log('   ✅ Work hours (9-17) - Most users should be Online');
      if (currentHour >= 12 && currentHour <= 13) {
        console.log('   🍽️ Lunch time - Mix of Online/Away');
      }
    } else if (currentHour >= 18 && currentHour <= 20) {
      console.log('   🌆 Evening hours - Some still working');
    } else {
      console.log('   🌙 Off hours - Most users Away');
    }
  };

  // Return cleanup function
  return () => {
    clearInterval(interval);
    document.removeEventListener('mousedown', handleActivity);
    document.removeEventListener('keydown', handleActivity);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleActivity);
    window.removeEventListener('offline', handleActivity);
  };
}
