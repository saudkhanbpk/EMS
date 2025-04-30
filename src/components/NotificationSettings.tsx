import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../lib/NotificationProvider';

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const { notificationsEnabled, requestPermission } = useNotifications();
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return;
    }
    
    setPermissionState(Notification.permission);
    
    // Check for permission changes
    const checkPermission = () => {
      setPermissionState(Notification.permission);
    };
    
    // Set up interval to check permission state (browsers don't reliably fire events for permission changes)
    const intervalId = setInterval(checkPermission, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleToggleNotifications = async () => {
    if (permissionState === 'granted') {
      alert('To disable notifications, please use your browser settings.');
      return;
    }
    
    try {
      await requestPermission();
      // Permission state will be updated by the effect
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (permissionState === 'unsupported') {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-600">Notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {permissionState === 'granted' ? (
            <Bell className="w-6 h-6 text-blue-600" />
          ) : (
            <BellOff className="w-6 h-6 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium">Notification Settings</h3>
            <p className="text-sm text-gray-500">
              {permissionState === 'granted'
                ? 'You will receive notifications for new tasks and updates.'
                : permissionState === 'denied'
                ? 'Notifications are blocked. Please update your browser settings to enable them.'
                : 'Enable notifications to stay updated on new tasks and important events.'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggleNotifications}
          disabled={permissionState === 'denied'}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            permissionState === 'granted'
              ? 'bg-green-100 text-green-700'
              : permissionState === 'denied'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {permissionState === 'granted'
            ? 'Enabled'
            : permissionState === 'denied'
            ? 'Blocked'
            : 'Enable Notifications'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
