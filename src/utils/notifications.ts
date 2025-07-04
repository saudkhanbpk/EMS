// Notification utility functions

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.permission = Notification.permission;
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission;
  }

  // Check if notifications are supported and permitted
  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public isPermitted(): boolean {
    return this.permission === 'granted';
  }

  // Show notification
  public async showNotification(options: NotificationOptions, forceShow: boolean = false): Promise<Notification | null> {
    console.log('showNotification called with:', { options, forceShow });
    
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return null;
    }

    // Update permission status
    this.permission = Notification.permission;
    console.log('Current permission status:', this.permission);

    // Request permission if not already granted
    if (this.permission !== 'granted') {
      console.log('Requesting permission...');
      this.permission = await Notification.requestPermission();
      console.log('Permission after request:', this.permission);
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission denied:', this.permission);
      return null;
    }

    // Only skip notification if page is visible AND focused AND not forced
    if (!forceShow && document.visibilityState === 'visible' && document.hasFocus()) {
      console.log('Skipping notification - page is visible and focused');
      return null;
    }

    console.log('Creating notification with title:', options.title);
    
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        tag: options.tag,
        requireInteraction: forceShow ? true : (options.requireInteraction || false),
        silent: options.silent || false,
      });

      notification.onshow = () => {
        console.log('✅ Notification shown:', options.title);
        if (forceShow) {
          console.log('🔔 Check your system tray or notification area!');
        }
      };
      notification.onerror = (error) => console.error('❌ Notification error:', error);
      notification.onclick = () => {
        console.log('👆 Notification clicked');
        window.focus();
      };

      console.log('Notification created successfully:', notification);

      if (!options.requireInteraction && !forceShow) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Show message notification
  public async showMessageNotification(
    senderName: string,
    messageContent: string,
    senderAvatar?: string,
    forceShow: boolean = false
  ): Promise<Notification | null> {
    const truncatedMessage = messageContent.length > 100 
      ? messageContent.substring(0, 100) + '...' 
      : messageContent;

    console.log('Attempting to show notification for:', senderName, truncatedMessage);

    return this.showNotification({
      title: `New message from ${senderName}`,
      body: truncatedMessage,
      icon: senderAvatar || '/favicon.ico',
      tag: `message-${senderName}`,
      requireInteraction: false,
      silent: false,
    }, forceShow);
  }

  // Play notification sound
  public playNotificationSound(): void {
    console.log('Attempting to play notification sound...');
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('Notification sound played successfully');
    } catch (error) {
      console.warn('Error playing notification sound:', error);
      // Fallback: try to play a simple audio file
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(err => console.warn('Fallback audio also failed:', err));
      } catch (fallbackError) {
        console.warn('Fallback audio failed:', fallbackError);
      }
    }
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

// Utility function to request permission on app initialization
export const initializeNotifications = async (): Promise<void> => {
  const manager = NotificationManager.getInstance();
  await manager.requestPermission();
};