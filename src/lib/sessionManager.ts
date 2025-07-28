import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_KEY = 'supabaseSession';

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session management
   */
  async initialize(): Promise<void> {
    // Try to restore session from localStorage
    await this.restoreSession();
    
    // Start periodic refresh
    this.startPeriodicRefresh();
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Session Manager - Auth state change:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          this.storeSession(session);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        this.clearSession();
        this.stopPeriodicRefresh();
      }
    });
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: Session): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem('user_id', session.user.id);
      localStorage.setItem('user_email', session.user.email || '');
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Restore session from localStorage
   */
  private async restoreSession(): Promise<boolean> {
    try {
      const storedSession = localStorage.getItem(this.SESSION_KEY);
      if (!storedSession) return false;

      const session: Session = JSON.parse(storedSession);
      
      // Check if session is expired
      if (this.isSessionExpired(session)) {
        console.log('Stored session is expired, attempting refresh...');
        this.clearSession();
        
        // Try to refresh the session
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          console.error('Failed to refresh expired session:', error);
          return false;
        }
        
        this.storeSession(data.session);
        return true;
      }

      // Session is still valid, verify with Supabase
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.error('Session verification failed:', error);
        this.clearSession();
        return false;
      }

      // Update stored session with fresh data
      this.storeSession(data.session);
      return true;
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: Session): boolean {
    if (!session.expires_at) return false;
    
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return now >= (expiresAt - bufferTime);
  }

  /**
   * Clear session from localStorage
   */
  private clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
  }

  /**
   * Start periodic session refresh
   */
  private startPeriodicRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Periodic session check failed:', error);
          return;
        }

        if (data.session) {
          // Check if session needs refresh
          if (this.isSessionExpired(data.session)) {
            console.log('Session needs refresh, attempting...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Session refresh failed:', refreshError);
              // Don't clear session immediately, let user continue until they manually logout
              return;
            }
            
            if (refreshData.session) {
              this.storeSession(refreshData.session);
              console.log('Session refreshed successfully');
            }
          } else {
            // Update stored session with current data
            this.storeSession(data.session);
          }
        }
      } catch (error) {
        console.error('Error during periodic session refresh:', error);
      }
    }, this.REFRESH_INTERVAL);
  }

  /**
   * Stop periodic session refresh
   */
  private stopPeriodicRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Manually refresh session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Manual session refresh failed:', error);
        return false;
      }
      
      this.storeSession(data.session);
      return true;
    } catch (error) {
      console.error('Error during manual session refresh:', error);
      return false;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        // Try to restore from localStorage as fallback
        const storedSession = localStorage.getItem(this.SESSION_KEY);
        if (storedSession) {
          const session: Session = JSON.parse(storedSession);
          if (!this.isSessionExpired(session)) {
            return session;
          }
        }
        return null;
      }
      
      return data.session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Sign out and clear session
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.clearSession();
      this.stopPeriodicRefresh();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Clear local session even if remote signout fails
      this.clearSession();
      this.stopPeriodicRefresh();
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();