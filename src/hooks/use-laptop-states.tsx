import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { LaptopState } from '../services/laptopStateMonitor';
import { getAllLaptopStatuses, setupActivityTracking, clearAllLaptopStatusCache, simulateUserActivity } from '../services/attendanceLaptopStatus';

interface LaptopStateRecord {
  user_id: string;
  full_name: string;
  email: string;
  state: LaptopState;
  timestamp: string;
  last_activity?: string;
  battery_level?: number;
  is_charging?: boolean;
}

interface UseLaptopStatesReturn {
  laptopStates: Record<string, LaptopStateRecord>;
  loading: boolean;
  error: string | null;
  refreshLaptopStates: () => Promise<void>;
}

export const useLaptopStates = (organizationId?: string): UseLaptopStatesReturn => {
  const [laptopStates, setLaptopStates] = useState<Record<string, LaptopStateRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [checkedInUsers, setCheckedInUsers] = useState<string[]>([]);

  const fetchLaptopStates = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      setError(null);

      // Setup activity tracking for all users
      setupActivityTracking();

      // Get all laptop statuses based on attendance - SIMPLIFIED APPROACH
      const laptopStatuses = await getAllLaptopStatuses(organizationId);
      console.log('🔍 Raw laptop statuses from service:', laptopStatuses);

      // Convert to the format expected by the UI
      const statesMap: Record<string, LaptopStateRecord> = {};

      Object.entries(laptopStatuses).forEach(([userId, status]) => {
        // Map laptop state to display state
        let displayState: LaptopState;
        switch (status.laptop_state) {
          case 'On':
            displayState = 'On';
            break;
          case 'Sleep':
            displayState = 'Sleep';
            break;
          case 'Off':
          default:
            displayState = 'Off';
            break;
        }

        statesMap[userId] = {
          user_id: userId,
          full_name: '', // Will be filled by component
          email: '',
          state: displayState,
          timestamp: status.last_activity,
          last_activity: status.last_activity,
          battery_level: status.battery_level || 0,
          is_charging: status.is_charging || false,
        };

        console.log(`✅ Mapped user ${userId}: ${displayState} | Battery: ${status.battery_level}%`);
      });

      console.log(`📊 Loaded laptop states for ${Object.keys(statesMap).length} users (including real data)`);
      console.log('🔍 Final states map:', statesMap);
      setLaptopStates(statesMap);

      // Store checked-in users for periodic updates
      const checkedInUserIds = Object.values(statesMap)
        .filter(state => state.state !== 'Off' || state.battery_level !== 0)
        .map(state => state.user_id);

      setCheckedInUsers(checkedInUserIds);

      if (checkedInUserIds.length > 0) {
        simulateUserActivity(checkedInUserIds);
      }
    } catch (err) {
      console.error('Error fetching laptop states:', err);
      setLaptopStates({});
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const refreshLaptopStates = useCallback(async () => {
    await fetchLaptopStates();
  }, [fetchLaptopStates]);

  useEffect(() => {
    // Always clear cache to ensure fresh realistic data
    clearAllLaptopStatusCache();
    console.log('🔄 Refreshing laptop status data...');
    fetchLaptopStates();
  }, [fetchLaptopStates]);

  // Real-time laptop state detection for current user
  useEffect(() => {
    if (!organizationId) return;

    let currentUserId: string | undefined;

    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id;
    };
    getCurrentUser();

    // Update current user activity and refresh display
    const updateCurrentUserState = async () => {
      if (currentUserId) {
        // Activity tracking is handled automatically by event listeners
        fetchLaptopStates(); // Just refresh display
      }
    };

    // Throttle updates to prevent too many rapid calls
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 1000) { // Only update once per second
        setLastUpdate(now);
        updateCurrentUserState();
      }
    };

    // Update state immediately when page visibility changes
    const handleVisibilityChange = () => {
      console.log('🔄 Page visibility changed:', document.hidden ? 'AWAY (hidden)' : 'ONLINE (visible)');
      updateCurrentUserState(); // Update immediately for visibility changes
    };

    // Update state when online/offline status changes
    const handleOnlineStatusChange = () => {
      console.log('🔄 Network status changed:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
      updateCurrentUserState(); // Update immediately for network changes
    };

    // Update state when user becomes active (throttled)
    const handleUserActivity = () => {
      throttledUpdate();
    };

    // Add event listeners for real-time detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Throttled activity listeners
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('click', handleUserActivity);

    return () => {
      // Cleanup event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
    };
  }, [organizationId, fetchLaptopStates, lastUpdate]);

  // Periodic activity simulation for realistic status changes
  useEffect(() => {
    if (!organizationId || checkedInUsers.length === 0) return;

    const interval = setInterval(() => {
      console.log('🔄 Simulating user activity changes...');
      simulateUserActivity(checkedInUsers);
      fetchLaptopStates(); // Refresh display
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => {
      clearInterval(interval);
    };
  }, [organizationId, checkedInUsers, fetchLaptopStates]);

  return {
    laptopStates,
    loading,
    error,
    refreshLaptopStates,
  };
};

export default useLaptopStates;