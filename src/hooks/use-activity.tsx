import { useEffect, useRef, useState } from 'react';

interface ActivityStats {
  mouseActivity: number;
  keyboardActivity: number;
  isActive: boolean;
  lastActivityTime: Date;
}

export function useActivity(onActivity: (stats: ActivityStats) => void, interval: number = 1000) {
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [stats, setStats] = useState<ActivityStats>({
    mouseActivity: 0,
    keyboardActivity: 0,
    isActive: true,
    lastActivityTime: new Date()
  });
  
  useEffect(() => {
    let mouseEvents = 0;
    let keyboardEvents = 0;
    let lastUpdate = Date.now();

    const handleActivity = (type: 'mouse' | 'keyboard') => {
      const now = Date.now();
      if (now - lastActivityRef.current >= interval) {
        if (type === 'mouse') {
          mouseEvents++;
        } else {
          keyboardEvents++;
        }

        // Update stats every second
        if (now - lastUpdate >= 1000) {
          setStats(prev => ({
            ...prev,
            mouseActivity: mouseEvents,
            keyboardActivity: keyboardEvents,
            isActive: true,
            lastActivityTime: new Date()
          }));
          onActivity({
            mouseActivity: mouseEvents,
            keyboardActivity: keyboardEvents,
            isActive: true,
            lastActivityTime: new Date()
          });
          mouseEvents = 0;
          keyboardEvents = 0;
          lastUpdate = now;
        }
      }
      lastActivityRef.current = now;
    };
    
    // Add event listeners for user activity
    const mouseHandler = () => handleActivity('mouse');
    const keyboardHandler = () => handleActivity('keyboard');
    
    window.addEventListener('mousemove', mouseHandler);
    window.addEventListener('mousedown', mouseHandler);
    window.addEventListener('wheel', mouseHandler);
    window.addEventListener('keydown', keyboardHandler);
    
    // Set up periodic check for activity
    timeoutRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // Consider inactive after 5 minutes of no activity
      if (timeSinceLastActivity > 5 * 60 * 1000) {
        setStats(prev => ({
          ...prev,
          isActive: false
        }));
        onActivity({
          mouseActivity: 0,
          keyboardActivity: 0,
          isActive: false,
          lastActivityTime: new Date()
        });
      }
    }, 1000);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('mousemove', mouseHandler);
      window.removeEventListener('mousedown', mouseHandler);
      window.removeEventListener('wheel', mouseHandler);
      window.removeEventListener('keydown', keyboardHandler);
      
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [onActivity, interval]);

  return stats;
}
