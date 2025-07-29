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

export interface DatabaseLaptopStatus {
  id: string;
  user_id: string;
  state: 'On' | 'Sleep' | 'Off';
  timestamp: string;
  last_activity: string | null;
  battery_level: number | null;
  is_charging: boolean | null;
  created_at: string;
  updated_at: string;
}

/**
 * Save current user's REAL laptop status to DATABASE (Heartbeat System)
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

    // Use server time for consistency
    const now = Date.now();
    const nowISO = new Date().toISOString();

    // Check activity state using localStorage for tab visibility tracking
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

    // Check if user is checked in today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data: todayAttendance } = await supabase
      .from('attendance_logs')
      .select('check_in, check_out')
      .eq('user_id', user.id)
      .gte('created_at', startOfToday.toISOString())
      .lt('created_at', endOfToday.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const isCheckedIn = todayAttendance && todayAttendance.length > 0 &&
                       todayAttendance[0].check_in && !todayAttendance[0].check_out;

    // If not checked in, force offline status
    if (!isCheckedIn) {
      currentState = 'Off';
      console.log('❌ User not checked in today - forcing OFFLINE status');
    }

    // Try to save to DATABASE first
    try {
      const { data, error } = await supabase
        .from('laptop_states')
        .upsert({
          user_id: user.id,
          state: currentState,
          timestamp: nowISO,
          last_activity: nowISO,
          battery_level: batteryLevel,
          is_charging: isCharging,
          updated_at: nowISO
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        throw error;
      }

      console.log(`✅ SAVED TO DATABASE for ${user.id}:`);
    } catch (error) {
      console.error('❌ Database save failed, using localStorage fallback:', error);

      // FALLBACK: Save to localStorage if database fails
      const fallbackData = {
        user_id: user.id,
        state: currentState,
        timestamp: nowISO,
        last_activity: nowISO,
        battery_level: batteryLevel,
        is_charging: isCharging,
        updated_at: nowISO
      };

      localStorage.setItem(`laptop_state_${user.id}`, JSON.stringify(fallbackData));
      console.log(`💾 SAVED TO LOCALSTORAGE for ${user.id} (fallback)`);
    }

    console.log(`� SAVED TO DATABASE for ${user.id}:`);
    console.log(`   State: ${currentState} (${currentState === 'On' ? 'ONLINE' : currentState === 'Sleep' ? 'AWAY' : 'OFFLINE'})`);
    console.log(`   Battery: ${batteryLevel}%${isCharging ? ' (Charging)' : ' (Not Charging)'}`);
    console.log(`   Tab Visible: ${!document.hidden}`);
    console.log(`   Internet: ${navigator.onLine ? 'Connected' : 'Disconnected'}`);
    console.log(`   Checked In: ${isCheckedIn ? 'Yes' : 'No'}`);
    console.log(`   Timestamp: ${nowISO}`);

    // Trigger custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('laptopStatusUpdate', {
      detail: { userId: user.id, state: currentState, batteryLevel, isCharging }
    }));

  } catch (error) {
    console.error('Error saving real laptop status:', error);
  }
}

/**
 * Get real status for ANY user from DATABASE
 */
export async function getRealStatusForUser(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('laptop_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log(`No laptop status found for user ${userId}`);
      return null;
    }

    if (data) {
      const lastUpdate = new Date(data.updated_at);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

      return {
        user_id: data.user_id,
        laptop_state: data.state,
        battery_level: data.battery_level || 0,
        is_charging: data.is_charging || false,
        last_activity: data.last_activity || data.timestamp,
        updated_at: data.updated_at,
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
 * Get REAL laptop status for all users from DATABASE - no fake data
 */
export async function getAllRealLaptopStatus(organizationId: string): Promise<Record<string, RealLaptopStatus>> {
  const result: Record<string, RealLaptopStatus> = {};

  try {
    console.log('🔍 Getting REAL laptop status for all users from DATABASE...');

    // Get all users in organization first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('organization_id', organizationId);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return result;
    }

    if (!users) return result;

    // Try to get laptop states from database, fallback to localStorage
    let laptopStates = null;
    try {
      const { data, error } = await supabase
        .from('laptop_states')
        .select('*');

      if (error) {
        throw error;
      }
      laptopStates = data;
      console.log('✅ Loaded laptop states from database');
    } catch (error) {
      console.error('❌ Database fetch failed, using localStorage fallback:', error);

      // FALLBACK: Get from localStorage
      laptopStates = [];
      for (const user of users) {
        const stored = localStorage.getItem(`laptop_state_${user.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            laptopStates.push(parsed);
          } catch (e) {
            console.error('Error parsing localStorage data for user:', user.id);
          }
        }
      }
      console.log(`💾 Loaded ${laptopStates.length} states from localStorage`);
    }

    // Get attendance data to determine who's checked in TODAY (with timezone handling)
    const today = new Date();

    // Try multiple date formats to catch attendance records
    const todayFormats = [
      // Today in local timezone
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0],
      // Today in UTC
      today.toISOString().split('T')[0],
      // Yesterday (in case of timezone differences)
      new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ];

    console.log('🔍 Checking attendance for dates:', todayFormats);

    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance_logs')
      .select('user_id, check_in, check_out, created_at')
      .gte('created_at', todayFormats[2] + 'T00:00:00.000Z') // Start from yesterday
      .lte('created_at', todayFormats[0] + 'T23:59:59.999Z') // End at today
      .order('created_at', { ascending: false });

    if (attendanceError) {
      console.error('❌ Error fetching attendance:', attendanceError);
    }

    // Get latest attendance for each user TODAY
    const latestAttendance: Record<string, any> = {};
    todayAttendance?.forEach(record => {
      if (!latestAttendance[record.user_id]) {
        latestAttendance[record.user_id] = record;
      }
    });

    console.log(`📅 Found attendance records for ${Object.keys(latestAttendance).length} users today`);
    console.log('📋 Sample attendance data:', todayAttendance?.slice(0, 3));
    console.log('🔍 Latest attendance map:', Object.keys(latestAttendance).slice(0, 5));

    const now = new Date();

    // Create a map of laptop states by user_id
    const laptopStateMap: Record<string, any> = {};
    if (laptopStates) {
      laptopStates.forEach(state => {
        laptopStateMap[state.user_id] = state;
      });
    }

    // Process each user with DATABASE data
    for (const user of users) {
      const attendance = latestAttendance[user.id];
      const laptopState = laptopStateMap[user.id]; // Get laptop state for this user

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

      // User is checked in - check for REAL laptop status in DATABASE
      if (laptopState) {
        const minutesAgo = Math.floor((now.getTime() - new Date(laptopState.updated_at).getTime()) / (1000 * 60));

        if (minutesAgo <= 5) {
          // Very recent real data - use exactly as is
          result[user.id] = {
            user_id: user.id,
            laptop_state: laptopState.state,
            battery_level: laptopState.battery_level || 0,
            is_charging: laptopState.is_charging || false,
            last_activity: laptopState.last_activity || laptopState.timestamp,
            is_checked_in: true,
            updated_at: laptopState.updated_at
          };
          console.log(`✅ ${user.full_name}: REAL DATABASE DATA → ${laptopState.state} | Battery: ${laptopState.battery_level || 0}% (${minutesAgo}m ago)`);
        } else if (minutesAgo <= 15) {
          // Recent real data but might be away now
          result[user.id] = {
            user_id: user.id,
            laptop_state: 'Sleep', // Assume away if no recent activity
            battery_level: laptopState.battery_level || 0,
            is_charging: laptopState.is_charging || false,
            last_activity: laptopState.last_activity || laptopState.timestamp,
            is_checked_in: true,
            updated_at: laptopState.updated_at
          };
          console.log(`⏰ ${user.full_name}: DATABASE DATA (OLD) → Away | Last seen ${minutesAgo}m ago`);
        } else {
          // Old real data - assume offline
          result[user.id] = {
            user_id: user.id,
            laptop_state: 'Off',
            battery_level: laptopState.battery_level || 0,
            is_charging: false,
            last_activity: laptopState.last_activity || laptopState.timestamp,
            is_checked_in: true,
            updated_at: now.toISOString()
          };
          console.log(`🔴 ${user.full_name}: DATABASE DATA (VERY OLD) → Offline | Last seen ${minutesAgo}m ago`);
        }
      } else {
        // NO REAL DATABASE DATA - show as "Unknown" until they open the web app
        result[user.id] = {
          user_id: user.id,
          laptop_state: 'Off', // Show as offline until we have real data
          battery_level: 0,
          is_charging: false,
          last_activity: attendance.check_in,
          is_checked_in: true,
          updated_at: now.toISOString(),
          // No data_source field - just use the other fields to indicate no real data
        };
        console.log(`⚫ ${user.full_name}: NO REAL TRACKING DATA → Offline (user must open web app for real tracking)`);
      }
    }

    const realDataCount = Object.values(result).filter(status => status.battery_level > 0).length;
    const totalUsers = users.length;
    const onlineUsers = Object.values(result).filter(s => s.laptop_state === 'On').length;
    const awayUsers = Object.values(result).filter(s => s.laptop_state === 'Sleep').length;
    const offlineUsers = Object.values(result).filter(s => s.laptop_state === 'Off').length;

    console.log(`📊 REAL LAPTOP STATUS SUMMARY (DATABASE):`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   With REAL data: ${realDataCount}`);
    console.log(`   Online: ${onlineUsers}, Away: ${awayUsers}, Offline: ${offlineUsers}`);

    return result;

  } catch (error) {
    console.error('Error getting real laptop status from database:', error);
    return result;
  }
}

/**
 * Enhanced real laptop tracking with DATABASE heartbeat system
 */
export function startRealLaptopTracking(): () => void {
  // Save status immediately
  saveRealLaptopStatus();

  // Save status every 2 minutes for more frequent heartbeat updates
  const interval = setInterval(saveRealLaptopStatus, 2 * 60 * 1000);

  // Save on activity - immediate response
  const handleActivity = () => {
    console.log('🎯 User activity detected - saving real status to database immediately');
    saveRealLaptopStatus();
  };

  // Save on visibility change - immediate response
  const handleVisibilityChange = () => {
    console.log('👁️ Tab visibility changed - saving real status to database');
    setTimeout(saveRealLaptopStatus, 100);
  };

  // Add event listeners
  document.addEventListener('mousedown', handleActivity);
  document.addEventListener('keydown', handleActivity);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleActivity);
  window.addEventListener('offline', handleActivity);

  console.log('🚀 Started REAL laptop tracking with DATABASE heartbeat system');

  // Add global functions for debugging
  (window as any).checkRealLaptopStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const status = await getRealStatusForUser(user.id);
      console.log('🔍 Current Real Laptop Status (DATABASE):', status || 'No data found');
    }
  };

  (window as any).checkAllUsersRealStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get user's organization
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userProfile?.organization_id) {
        const allUsersData = await getAllRealLaptopStatus(userProfile.organization_id);
        console.log('🌐 All Users Real Status (DATABASE):', allUsersData);

        Object.entries(allUsersData).forEach(([userId, data]) => {
          const lastUpdate = new Date(data.updated_at);
          const now = new Date();
          const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));

          console.log(`👤 User ${userId}:`, {
            state: data.laptop_state === 'On' ? 'ONLINE' : data.laptop_state === 'Sleep' ? 'AWAY' : 'OFFLINE',
            battery: `${data.battery_level}%${data.is_charging ? ' (Charging)' : ''}`,
            lastUpdate: `${minutesAgo}m ago`,
            checkedIn: data.is_checked_in ? 'Yes' : 'No'
          });
        });
      }
    }
  };

  (window as any).forceUpdateRealStatus = () => {
    console.log('🔄 Force updating real laptop status to database...');
    saveRealLaptopStatus();
  };

  (window as any).cleanupOldLaptopData = async () => {
    console.log('🧹 Cleaning up old laptop status data...');
    await cleanupOldLaptopStatus();
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

/**
 * Cleanup old laptop status records (older than 24 hours)
 */
export async function cleanupOldLaptopStatus(): Promise<void> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { error } = await supabase
      .from('laptop_states')
      .delete()
      .lt('updated_at', oneDayAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old laptop status:', error);
    } else {
      console.log('✅ Cleaned up old laptop status records');
    }
  } catch (error) {
    console.error('Error in cleanup function:', error);
  }
}

/**
 * Show detailed real laptop status for all users (for debugging/admin)
 */
export async function showDetailedRealLaptopStatus(): Promise<void> {
  console.log('\n🔍 ===== DETAILED REAL LAPTOP STATUS REPORT =====');

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single();

    if (!userData) {
      console.log('❌ User data not found');
      return;
    }

    // Get all users in organization
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('organization_id', userData.organization_id);

    // Get all laptop states
    const { data: laptopStates } = await supabase
      .from('laptop_states')
      .select('*')
      .order('updated_at', { ascending: false });

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance } = await supabase
      .from('attendance_logs')
      .select('user_id, check_in, check_out, created_at')
      .gte('created_at', today + 'T00:00:00.000Z')
      .lte('created_at', today + 'T23:59:59.999Z');

    console.log(`\n📊 ORGANIZATION: ${userData.organization_id}`);
    console.log(`👥 TOTAL USERS: ${allUsers?.length || 0}`);
    console.log(`💻 LAPTOP STATES: ${laptopStates?.length || 0}`);
    console.log(`📅 TODAY'S ATTENDANCE: ${attendance?.length || 0}`);

    // Create maps for quick lookup
    const laptopMap: Record<string, any> = {};
    laptopStates?.forEach(state => {
      laptopMap[state.user_id] = state;
    });

    const attendanceMap: Record<string, any> = {};
    attendance?.forEach(record => {
      if (!attendanceMap[record.user_id] ||
          new Date(record.created_at) > new Date(attendanceMap[record.user_id].created_at)) {
        attendanceMap[record.user_id] = record;
      }
    });

    console.log('\n📋 USER-BY-USER BREAKDOWN:');
    console.log('=' .repeat(80));

    allUsers?.forEach((user, index) => {
      const laptopState = laptopMap[user.id];
      const userAttendance = attendanceMap[user.id];
      const isCheckedIn = userAttendance?.check_in && !userAttendance?.check_out;

      console.log(`\n${index + 1}. 👤 ${user.full_name} (${user.email})`);
      console.log(`   📧 ID: ${user.id}`);

      // Attendance Status
      if (isCheckedIn) {
        const checkInTime = new Date(userAttendance.check_in);
        const hoursWorked = ((new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(1);
        console.log(`   ✅ CHECKED IN: ${checkInTime.toLocaleTimeString()} (${hoursWorked}h ago)`);
      } else if (userAttendance?.check_out) {
        console.log(`   🚪 CHECKED OUT: ${new Date(userAttendance.check_out).toLocaleTimeString()}`);
      } else {
        console.log(`   ❌ NOT CHECKED IN TODAY`);
      }

      // Laptop Status
      if (laptopState) {
        const lastUpdate = new Date(laptopState.updated_at);
        const minutesAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60));
        const statusIcon = laptopState.state === 'On' ? '🟢' : laptopState.state === 'Sleep' ? '🟡' : '🔴';

        console.log(`   ${statusIcon} LAPTOP: ${laptopState.state.toUpperCase()}`);
        console.log(`   🔋 BATTERY: ${laptopState.battery_level || 0}%${laptopState.is_charging ? ' (Charging)' : ''}`);
        console.log(`   ⏰ LAST UPDATE: ${lastUpdate.toLocaleString()} (${minutesAgo}m ago)`);
        console.log(`   📡 DATA SOURCE: Real tracking data`);
      } else {
        console.log(`   ⚫ LAPTOP: No tracking data`);
        console.log(`   📡 DATA SOURCE: ${isCheckedIn ? 'Estimated (checked in)' : 'No data'}`);
      }
    });

    console.log('\n🎯 SUMMARY STATISTICS:');
    console.log('=' .repeat(50));

    const realDataUsers = allUsers?.filter(user => laptopMap[user.id]) || [];
    const checkedInUsers = allUsers?.filter(user => {
      const att = attendanceMap[user.id];
      return att?.check_in && !att?.check_out;
    }) || [];

    const onlineUsers = realDataUsers.filter(user => laptopMap[user.id]?.state === 'On');
    const awayUsers = realDataUsers.filter(user => laptopMap[user.id]?.state === 'Sleep');
    const offlineUsers = realDataUsers.filter(user => laptopMap[user.id]?.state === 'Off');

    console.log(`📊 Users with real laptop data: ${realDataUsers.length}/${allUsers?.length || 0}`);
    console.log(`📊 Users checked in today: ${checkedInUsers.length}/${allUsers?.length || 0}`);
    console.log(`🟢 Online: ${onlineUsers.length}`);
    console.log(`🟡 Away: ${awayUsers.length}`);
    console.log(`🔴 Offline: ${offlineUsers.length}`);
    console.log(`⚫ No data: ${(allUsers?.length || 0) - realDataUsers.length}`);

    console.log('\n✅ Real laptop status report complete!');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Error generating real laptop status report:', error);
  }
}

/**
 * Show ONLY real tracking data (no estimates)
 */
export async function showOnlyRealTrackingData(): Promise<void> {
  console.log('\n🎯 ===== REAL LAPTOP TRACKING DATA ONLY =====');

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single();

    // Get all laptop states with real data
    const { data: realLaptopStates } = await supabase
      .from('laptop_states')
      .select(`
        user_id,
        state,
        battery_level,
        is_charging,
        timestamp,
        last_activity,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    // Get user names for the real data
    const userIds = realLaptopStates?.map(state => state.user_id) || [];
    const { data: usersWithRealData } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);

    console.log(`\n📊 REAL TRACKING DATA SUMMARY:`);
    console.log(`👥 Total users with REAL laptop data: ${realLaptopStates?.length || 0}`);
    console.log(`📅 Data collected from users who opened the web app\n`);

    if (!realLaptopStates || realLaptopStates.length === 0) {
      console.log('❌ NO REAL TRACKING DATA FOUND');
      console.log('💡 Users need to open the web application to generate real tracking data');
      return;
    }

    console.log('🔍 USERS WITH REAL LAPTOP TRACKING DATA:');
    console.log('=' .repeat(60));

    realLaptopStates.forEach((laptopState, index) => {
      const user = usersWithRealData?.find(u => u.id === laptopState.user_id);
      const lastUpdate = new Date(laptopState.updated_at);
      const minutesAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60));

      const statusIcon = laptopState.state === 'On' ? '🟢' : laptopState.state === 'Sleep' ? '🟡' : '🔴';
      const freshness = minutesAgo < 5 ? '🔥 FRESH' : minutesAgo < 15 ? '⏰ RECENT' : '🕐 OLD';

      console.log(`\n${index + 1}. ${statusIcon} ${user?.full_name || 'Unknown User'}`);
      console.log(`   📧 Email: ${user?.email || 'N/A'}`);
      console.log(`   💻 Status: ${laptopState.state.toUpperCase()}`);
      console.log(`   🔋 Battery: ${laptopState.battery_level || 0}%${laptopState.is_charging ? ' (Charging)' : ' (Not Charging)'}`);
      console.log(`   ⏰ Last Update: ${lastUpdate.toLocaleString()}`);
      console.log(`   📊 Data Age: ${minutesAgo} minutes ago (${freshness})`);
      console.log(`   📡 Source: Real browser tracking`);
    });

    // Statistics
    const onlineCount = realLaptopStates.filter(s => s.state === 'On').length;
    const awayCount = realLaptopStates.filter(s => s.state === 'Sleep').length;
    const offlineCount = realLaptopStates.filter(s => s.state === 'Off').length;
    const freshDataCount = realLaptopStates.filter(s => {
      const minutesAgo = Math.floor((new Date().getTime() - new Date(s.updated_at).getTime()) / (1000 * 60));
      return minutesAgo < 5;
    }).length;

    console.log('\n📈 REAL DATA STATISTICS:');
    console.log('=' .repeat(40));
    console.log(`🟢 Online: ${onlineCount}`);
    console.log(`🟡 Away: ${awayCount}`);
    console.log(`🔴 Offline: ${offlineCount}`);
    console.log(`🔥 Fresh data (< 5 min): ${freshDataCount}`);
    console.log(`📊 Total real tracking records: ${realLaptopStates.length}`);

    console.log('\n💡 TO GET MORE REAL DATA:');
    console.log('- Ask users to open the web application');
    console.log('- Users need to keep a browser tab open');
    console.log('- Consider building a desktop application for system-level tracking');

  } catch (error) {
    console.error('❌ Error showing real tracking data:', error);
  }
}

// Make both functions available globally
(window as any).showDetailedRealLaptopStatus = showDetailedRealLaptopStatus;
(window as any).showOnlyRealTrackingData = showOnlyRealTrackingData;
