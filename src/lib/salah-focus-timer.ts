/**
 * Salah Focus Timer Service
 * Practical prayer tracking without intrusive UI changes
 */

export interface SalahSession {
  id: string;
  date: string;
  prayerType: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  duration: number;
  rakahs: number;
  currentRakah: number;
  startTime: number;
  endTime?: number;
  completed: boolean;
  onTime: boolean;
}

export interface SalahFocusSettings {
  enableHaptics: boolean;
  muteAudio: boolean;
  showOverlay: boolean;
  autoDetectPrayer: boolean;
}

export class SalahFocusTimer {
  private static instance: SalahFocusTimer;
  private currentSession: SalahSession | null = null;
  private listeners: Map<string, ((session: SalahSession | null) => void)[]> = new Map();
  private settings: SalahFocusSettings = {
    enableHaptics: true,
    muteAudio: true,
    showOverlay: true,
    autoDetectPrayer: true
  };

  static getInstance(): SalahFocusTimer {
    if (!SalahFocusTimer.instance) {
      SalahFocusTimer.instance = new SalahFocusTimer();
    }
    return SalahFocusTimer.instance;
  }

  private constructor() {
    this.loadSettings();
    this.loadCurrentSession();
  }

  // Settings management
  private loadSettings() {
    try {
      const stored = localStorage.getItem('salah-focus-settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load Salah focus settings:', error);
    }
  }

  saveSettings(settings: Partial<SalahFocusSettings>) {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('salah-focus-settings', JSON.stringify(this.settings));
    this.notifyListeners('settings-changed', this.currentSession);
  }

  getSettings(): SalahFocusSettings {
    return { ...this.settings };
  }

  // Session management
  async startSession(prayerType: SalahSession['prayerType'], rakahs: number = 4): Promise<SalahSession> {
    // End any existing session
    if (this.currentSession) {
      this.endSession(false);
    }

    const session: SalahSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      prayerType,
      duration: 0,
      rakahs,
      currentRakah: 1,
      startTime: Date.now(),
      completed: false,
      onTime: this.isOnTime(prayerType)
    };

    this.currentSession = session;
    this.saveCurrentSession();

    // Mute audio if enabled
    if (this.settings.muteAudio) {
      await this.muteAppAudio();
    }

    // Trigger haptic feedback
    if (this.settings.enableHaptics) {
      this.triggerHaptic('session-start');
    }

    this.notifyListeners('session-started', session);
    return session;
  }

  endSession(completed: boolean = true): SalahSession | null {
    if (!this.currentSession) return null;

    const session = {
      ...this.currentSession,
      endTime: Date.now(),
      duration: Date.now() - this.currentSession.startTime,
      completed
    };

    // Restore audio if muted
    if (this.settings.muteAudio) {
      this.restoreAppAudio();
    }

    // Trigger haptic feedback
    if (this.settings.enableHaptics) {
      this.triggerHaptic(completed ? 'session-complete' : 'session-cancel');
    }

    // Save to history
    this.saveToHistory(session);

    this.currentSession = null;
    this.saveCurrentSession();
    this.notifyListeners('session-ended', session);

    return session;
  }

  updateRakah(rakah: number): void {
    if (!this.currentSession) return;

    this.currentSession.currentRakah = rakah;
    this.saveCurrentSession();

    if (this.settings.enableHaptics) {
      this.triggerHaptic('rakah-complete');
    }

    this.notifyListeners('rakah-updated', this.currentSession);
  }

  getCurrentSession(): SalahSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  // Audio management
  private async muteAppAudio(): Promise<void> {
    try {
      // Store current audio states
      const audioStates = {
        quranVolume: localStorage.getItem('quran-volume'),
        radioVolume: localStorage.getItem('radio-volume'),
        notificationsEnabled: localStorage.getItem('notifications-enabled')
      };

      localStorage.setItem('salah-audio-backup', JSON.stringify(audioStates));

      // Mute app audio
      localStorage.setItem('quran-volume', '0');
      localStorage.setItem('radio-volume', '0');
      localStorage.setItem('notifications-enabled', 'false');

      // Trigger audio mute event
      window.dispatchEvent(new CustomEvent('salah-audio-muted'));
    } catch (error) {
      console.error('Failed to mute app audio:', error);
    }
  }

  private async restoreAppAudio(): Promise<void> {
    try {
      const backup = localStorage.getItem('salah-audio-backup');
      if (backup) {
        const audioStates = JSON.parse(backup);

        // Restore audio states
        if (audioStates.quranVolume) {
          localStorage.setItem('quran-volume', audioStates.quranVolume);
        }
        if (audioStates.radioVolume) {
          localStorage.setItem('radio-volume', audioStates.radioVolume);
        }
        if (audioStates.notificationsEnabled) {
          localStorage.setItem('notifications-enabled', audioStates.notificationsEnabled);
        }

        localStorage.removeItem('salah-audio-backup');
      }

      // Trigger audio restore event
      window.dispatchEvent(new CustomEvent('salah-audio-restored'));
    } catch (error) {
      console.error('Failed to restore app audio:', error);
    }
  }

  // Haptic feedback
  private triggerHaptic(type: 'session-start' | 'session-complete' | 'session-cancel' | 'rakah-complete'): void {
    if (!('vibrate' in navigator)) return;

    const patterns = {
      'session-start': [50, 30, 50],
      'session-complete': [100, 50, 100, 50, 100],
      'session-cancel': [100, 100],
      'rakah-complete': [30]
    };

    navigator.vibrate(patterns[type]);
  }

  // Prayer time detection
  private isOnTime(prayerType: SalahSession['prayerType']): boolean {
    const now = new Date();
    const prayerTimes = this.getTodayPrayerTimes();
    
    if (!prayerTimes[prayerType]) return false;

    const prayerTime = new Date(prayerTimes[prayerType]);
    const timeDiff = Math.abs(now.getTime() - prayerTime.getTime());
    
    // Within 15 minutes is considered "on time"
    return timeDiff <= 15 * 60 * 1000;
  }

  private getTodayPrayerTimes(): Record<string, string> {
    try {
      const stored = localStorage.getItem('prayer-times-today');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get prayer times:', error);
    }
    return {};
  }

  // Storage
  private saveCurrentSession(): void {
    if (this.currentSession) {
      localStorage.setItem('salah-current-session', JSON.stringify(this.currentSession));
    } else {
      localStorage.removeItem('salah-current-session');
    }
  }

  private loadCurrentSession(): void {
    try {
      const stored = localStorage.getItem('salah-current-session');
      if (stored) {
        this.currentSession = JSON.parse(stored);
        
        // If session is older than 2 hours, clear it
        if (this.currentSession && Date.now() - this.currentSession.startTime > 2 * 60 * 60 * 1000) {
          this.currentSession = null;
          this.saveCurrentSession();
        }
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
    }
  }

  private saveToHistory(session: SalahSession): void {
    try {
      const history = JSON.parse(localStorage.getItem('salah-session-history') || '[]');
      history.push(session);
      
      // Keep only last 100 sessions
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      localStorage.setItem('salah-session-history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save session to history:', error);
    }
  }

  getSessionHistory(): SalahSession[] {
    try {
      return JSON.parse(localStorage.getItem('salah-session-history') || '[]');
    } catch (error) {
      console.error('Failed to load session history:', error);
      return [];
    }
  }

  // Event listeners
  on(event: string, callback: (session: SalahSession | null) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (session: SalahSession | null) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, session: SalahSession | null): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(session));
    }
  }

  // Analytics
  getSalahStats(): {
    totalPrayers: number;
    averageDuration: number;
    onTimePercentage: number;
    currentStreak: number;
    longestStreak: number;
  } {
    const history = this.getSessionHistory();
    const completedPrayers = history.filter(s => s.completed);
    
    const totalPrayers = completedPrayers.length;
    const averageDuration = totalPrayers > 0 
      ? completedPrayers.reduce((sum, s) => sum + s.duration, 0) / totalPrayers 
      : 0;
    
    const onTimeCount = completedPrayers.filter(s => s.onTime).length;
    const onTimePercentage = totalPrayers > 0 ? (onTimeCount / totalPrayers) * 100 : 0;
    
    // Calculate streak
    const currentStreak = this.calculateCurrentStreak(completedPrayers);
    const longestStreak = this.calculateLongestStreak(completedPrayers);

    return {
      totalPrayers,
      averageDuration,
      onTimePercentage,
      currentStreak,
      longestStreak
    };
  }

  private calculateCurrentStreak(completedPrayers: SalahSession[]): number {
    if (completedPrayers.length === 0) return 0;
    
    const sorted = [...completedPrayers].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date().toDateString();
    
    for (const prayer of sorted) {
      if (prayer.completed && prayer.date === today) {
        streak++;
        break;
      }
      if (prayer.completed) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateLongestStreak(completedPrayers: SalahSession[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    const sorted = [...completedPrayers].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (const prayer of sorted) {
      if (prayer.completed) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }
}

export const salahFocusTimer = SalahFocusTimer.getInstance();
