/**
 * Adhan (Islamic Call to Prayer) Service
 * Provides Adhan audio notifications for prayer times
 */

export interface AdhanConfig {
  enabled: boolean;
  volume: number;
  fajrEnabled: boolean;
  dhuhrEnabled: boolean;
  asrEnabled: boolean;
  maghribEnabled: boolean;
  ishaEnabled: boolean;
  jummahEnabled: boolean;
  selectedMuezzin: string;
  playNotificationSound: boolean;
  vibrationEnabled: boolean;
}

export interface Muezzin {
  id: string;
  name: string;
  arabicName: string;
  url: string;
  duration: number;
}

export interface PrayerTime {
  name: string;
  time: string;
  adhanUrl?: string;
  hasPlayed: boolean;
}

export class AdhanService {
  private static instance: AdhanService;
  private audio: HTMLAudioElement | null = null;
  private notificationPermission: NotificationPermission = 'default';

  static getInstance(): AdhanService {
    if (!AdhanService.instance) {
      AdhanService.instance = new AdhanService();
    }
    return AdhanService.instance;
  }

  constructor() {
    this.initializeAudio();
    // Don't request notification permission eagerly - wait for user interaction
    // Permission will be requested when user enables adhan or toggles notifications
  }

  /**
   * Initialize audio element for Adhan playback
   */
  private initializeAudio(): void {
    this.audio = new Audio();
    this.audio.preload = 'auto';
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Get available muezzins (reciters)
   */
  getAvailableMuezzins(): Muezzin[] {
    return [
      {
        id: 'mishari-rashid',
        name: 'Mishari Rashid Al-Afasy',
        arabicName: 'مشاري راشد العفاسي',
        url: 'https://download.quranicaudio.com/qdc/mishari_al_afasy/adhan/',
        duration: 180
      },
      {
        id: 'abdul-basit',
        name: 'Abdul Basit Abdus-Samad',
        arabicName: 'عبد الباسط عبد الصمد',
        url: 'https://download.quranicaudio.com/qdc/abdul_baset/adhan/',
        duration: 200
      },
      {
        id: 'maher-al-muaiqly',
        name: 'Maher Al-Muaiqly',
        arabicName: 'ماهر المعيقلي',
        url: 'https://download.quranicaudio.com/qdc/maher_al_muaiqly/adhan/',
        duration: 170
      },
      {
        id: 'saad-al-ghamdi',
        name: 'Saad Al-Ghamdi',
        arabicName: 'سعد الغامدي',
        url: 'https://download.quranicaudio.com/qdc/saad_ghamdi/adhan/',
        duration: 160
      },
      {
        id: 'yasser-al-dosari',
        name: 'Yasser Al-Dosari',
        arabicName: 'ياسر الدوسري',
        url: 'https://download.quranicaudio.com/qdc/yasser_al_dosari/adhan/',
        duration: 190
      }
    ];
  }

  /**
   * Get Adhan configuration from localStorage
   */
  getAdhanConfig(): AdhanConfig {
    try {
      const stored = localStorage.getItem('adhan-config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load Adhan config:', error);
    }

    // Default configuration
    return {
      enabled: false,
      volume: 80,
      fajrEnabled: true,
      dhuhrEnabled: true,
      asrEnabled: true,
      maghribEnabled: true,
      ishaEnabled: true,
      jummahEnabled: true,
      selectedMuezzin: 'mishari-rashid',
      playNotificationSound: true,
      vibrationEnabled: true
    };
  }

  /**
   * Save Adhan configuration to localStorage
   */
  saveAdhanConfig(config: AdhanConfig): void {
    try {
      localStorage.setItem('adhan-config', JSON.stringify(config));
      console.log('Adhan configuration saved:', config);
    } catch (error) {
      console.error('Failed to save Adhan config:', error);
    }
  }

  /**
   * Toggle Adhan on/off
   */
  toggleAdhan(): AdhanConfig {
    const config = this.getAdhanConfig();
    config.enabled = !config.enabled;
    this.saveAdhanConfig(config);
    return config;
  }

  /**
   * Play Adhan for specific prayer
   */
  async playAdhan(prayerName: string, customUrl?: string): Promise<boolean> {
    if (!this.audio) return false;

    const config = this.getAdhanConfig();
    if (!config.enabled) {
      console.log('Adhan is disabled');
      return false;
    }

    // Respect per-prayer toggles
    const prayerToggleMap: Record<string, keyof AdhanConfig> = {
      fajr: 'fajrEnabled',
      dhuhr: 'dhuhrEnabled',
      asr: 'asrEnabled',
      maghrib: 'maghribEnabled',
      isha: 'ishaEnabled',
      jummah: 'jummahEnabled'
    };
    const prayerKey = prayerToggleMap[prayerName?.toLowerCase?.() || ''];
    if (prayerKey && (config as any)[prayerKey] === false) {
      console.log(`Adhan for ${prayerName} is disabled`);
      return false;
    }

    try {
      // Get muezzin and construct URL
      const muezzins = this.getAvailableMuezzins();
      const selectedMuezzin = muezzins.find(m => m.id === config.selectedMuezzin);

      if (!selectedMuezzin) {
        console.error('Selected muezzin not found');
        return false;
      }

      const adhanUrl = customUrl || `${selectedMuezzin.url}${prayerName}.mp3`;

      // Set audio properties
      this.audio.src = adhanUrl;
      this.audio.volume = config.volume / 100;

      // Play the Adhan
      await this.audio.play();

      // Show notification
      if (config.playNotificationSound && this.notificationPermission === 'granted') {
        this.showAdhanNotification(prayerName, selectedMuezzin.name);
      }

      // Vibrate if enabled
      if (config.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      console.log(`Playing Adhan for ${prayerName} by ${selectedMuezzin.name}`);
      return true;
    } catch (error) {
      console.error('Failed to play Adhan:', error);
      return false;
    }
  }

  /**
   * Stop current Adhan playback
   */
  stopAdhan(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('Adhan playback stopped');
    }
  }

  /**
   * Check if Adhan is currently playing
   */
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  /**
   * Show notification for Adhan
   */
  private showAdhanNotification(prayerName: string, muezzinName: string): void {
    if ('Notification' in window && this.notificationPermission === 'granted') {
      new Notification(`Adhan - ${this.getPrayerDisplayName(prayerName)}`, {
        body: `Recited by ${muezzinName}`,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: 'adhan',
        requireInteraction: false,
        silent: false
      });
    }
  }

  /**
   * Get display name for prayer
   */
  private getPrayerDisplayName(prayerName: string): string {
    const prayerNames: { [key: string]: string } = {
      'fajr': 'Fajr',
      'dhuhr': 'Dhuhr',
      'asr': 'Asr',
      'maghrib': 'Maghrib',
      'isha': 'Isha',
      'jummah': 'Jummah'
    };
    return prayerNames[prayerName] || prayerName;
  }

  /**
   * Test Adhan playback
   */
  async testAdhan(prayerName: string): Promise<boolean> {
    console.log(`Testing Adhan for ${prayerName}`);
    return await this.playAdhan(prayerName);
  }

  /**
   * Get next prayer time (mock implementation)
   * In real app, this would integrate with prayer times API
   */
  getNextPrayerTime(): PrayerTime | null {
    // This is a mock implementation
    // In a real app, you would integrate with a prayer times API
    const now = new Date();
    const hour = now.getHours();

    const prayerTimes = [
      { name: 'fajr', time: '05:30', hasPlayed: false },
      { name: 'dhuhr', time: '12:30', hasPlayed: false },
      { name: 'asr', time: '15:45', hasPlayed: false },
      { name: 'maghrib', time: '18:15', hasPlayed: false },
      { name: 'isha', time: '19:45', hasPlayed: false }
    ];

    // Find next prayer time
    for (const prayer of prayerTimes) {
      const [prayerHour] = prayer.time.split(':').map(Number);
      if (prayerHour > hour || (prayerHour === hour && !prayer.hasPlayed)) {
        return prayer;
      }
    }

    return null;
  }

  /**
   * Schedule Adhan for prayer times
   */
  scheduleAdhan(): void {
    // This would integrate with a prayer times calculation service
    // For now, it's a placeholder for future implementation
    console.log('Adhan scheduling - implement prayer times integration');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
  }
}

// Export singleton instance
export const adhanService = AdhanService.getInstance();
