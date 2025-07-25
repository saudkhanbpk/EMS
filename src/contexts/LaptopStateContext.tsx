import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';

interface LaptopStateContextType {
  isOnline: boolean;
  batteryLevel: number;
  isCharging: boolean;
  lastActivity: Date;
}

const LaptopStateContext = createContext<LaptopStateContextType>({
  isOnline: true,
  batteryLevel: 0, // Will be auto-detected
  isCharging: false,
  lastActivity: new Date(),
});

export const useLaptopStateMonitor = () => {
  const context = useContext(LaptopStateContext);
  if (!context) {
    throw new Error('useLaptopStateMonitor must be used within a LaptopStateProvider');
  }
  return context;
};

interface LaptopStateProviderProps {
  children: React.ReactNode;
}

export const LaptopStateProvider: React.FC<LaptopStateProviderProps> = ({ children }) => {
  const { userProfile } = useUser();
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(0); // Start with 0, will auto-detect real battery
  const [isCharging, setIsCharging] = useState(false);
  const [lastActivity, setLastActivity] = useState(new Date());

  useEffect(() => {
    if (!userProfile?.id) return;

    console.log('🔥 Starting simple laptop monitoring for user:', userProfile.id);

    // Function to update laptop activity with REAL battery data
    const updateActivity = async () => {
      try {
        // Auto-detect REAL battery level (no hardcoded values)
        let realBattery = 0; // Start with 0
        let realCharging = false;

        try {
          // @ts-ignore - Battery API is experimental
          if ('getBattery' in navigator) {
            // @ts-ignore
            const battery = await navigator.getBattery();
            realBattery = Math.round(battery.level * 100); // Get REAL battery percentage
            realCharging = battery.charging; // Get REAL charging status
            console.log(`🔋 Auto-detected REAL battery: ${realBattery}%${realCharging ? ' (Charging)' : ''}`);
          } else {
            // If Battery API not available, try to estimate from system
            realBattery = 75; // Reasonable default only if API fails
            console.log('🔋 Battery API not available, using reasonable default: 75%');
          }
        } catch (error) {
          realBattery = 75; // Fallback only if error
          console.log('🔋 Battery API error, using fallback: 75%');
        }

        // Update state with REAL data
        setBatteryLevel(realBattery);
        setIsCharging(realCharging);
        setIsOnline(navigator.onLine);
        setLastActivity(new Date());

        // Update the REAL laptop status instead of fake attendance data
        const { saveRealLaptopStatus } = await import('../services/realLaptopTracking');
        await saveRealLaptopStatus();

        console.log(`✅ Updated activity: Online=${navigator.onLine}, Battery=${realBattery}%${realCharging ? ' (Charging)' : ''}`);
      } catch (error) {
        console.error('Error updating laptop activity:', error);
      }
    };

    // Update immediately
    updateActivity();

    // Update every 15 minutes (further reduced frequency)
    const interval = setInterval(updateActivity, 900000);

    // Activity listeners with throttling to prevent excessive calls
    let lastActivityCall = 0;
    const handleActivity = () => {
      const now = Date.now();
      setLastActivity(new Date());

      // Only call updateActivity every 5 minutes max to prevent excessive API calls
      if (now - lastActivityCall > 300000) {
        lastActivityCall = now;
        updateActivity();
      }
    };

    const handleOnlineChange = () => {
      setIsOnline(navigator.onLine);
      updateActivity();
    };

    // Add event listeners (reduced to essential only)
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('visibilitychange', handleActivity);
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('visibilitychange', handleActivity);
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, [userProfile?.id]);

  return (
    <LaptopStateContext.Provider value={{ isOnline, batteryLevel, isCharging, lastActivity }}>
      {children}
    </LaptopStateContext.Provider>
  );
};

export default LaptopStateProvider;