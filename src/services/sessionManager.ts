/**
 * Session Manager
 * Handles session ID generation and management for agent conversations
 */

export class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;
  private readonly STORAGE_KEY = 'agent_session_id';

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Get or create session ID for this browser
   */
  getSessionId(): string {
    // Check memory first
    if (this.sessionId) {
      return this.sessionId;
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem(this.STORAGE_KEY);

      if (!sessionId) {
        // Generate new session ID
        sessionId = this.generateSessionId();
        localStorage.setItem(this.STORAGE_KEY, sessionId);
      }

      this.sessionId = sessionId;
      return sessionId;
    }

    // Fallback for SSR
    this.sessionId = this.generateSessionId();
    return this.sessionId;
  }

  /**
   * Create a new session (force new session ID)
   */
  createNewSession(): string {
    const sessionId = this.generateSessionId();

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, sessionId);
    }

    this.sessionId = sessionId;
    return sessionId;
  }

  /**
   * Clear session (logout, reset)
   */
  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.sessionId = null;
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(): Record<string, any> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      website_domain: window.location.hostname,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || null,
    };
  }

  /**
   * Check if session exists
   */
  hasSession(): boolean {
    if (this.sessionId) {
      return true;
    }

    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(this.STORAGE_KEY);
    }

    return false;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
