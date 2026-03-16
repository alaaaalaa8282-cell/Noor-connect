/**
 * Enhanced Android Background Audio Helper
 * Provides comprehensive solutions for background playback across platforms
 */

export class AndroidAudioHelper {
  private static instance: AndroidAudioHelper;
  private wakeLock: WakeLockSentinel | null = null;
  private pageVisibilityHandler: ((isVisible: boolean) => void) | null = null;

  static getInstance(): AndroidAudioHelper {
    if (!AndroidAudioHelper.instance) {
      AndroidAudioHelper.instance = new AndroidAudioHelper();
    }
    return AndroidAudioHelper.instance;
  }

  /**
   * Request wake lock to keep audio playing in background
   */
  async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && this.wakeLock === null) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Wake lock acquired for background audio');
        return true;
      }
    } catch (error) {
      console.warn('Wake lock request failed:', error);
    }
    return false;
  }

  /**
   * Release wake lock
   */
  releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
      console.log('Wake lock released');
    }
  }

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  /**
   * Check if running in Chrome on Android
   */
  isChromeAndroid(): boolean {
    return this.isAndroid() && /Chrome/.test(navigator.userAgent);
  }

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Check if running on Safari
   */
  isSafari(): boolean {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  }

  /**
   * Setup platform-specific audio optimizations
   */
  setupPlatformOptimizations(audio: HTMLAudioElement): void {
    // Common optimizations for all platforms
    audio.preload = 'auto';
    audio.loop = false;
    
    // Platform-specific optimizations
    if (this.isAndroid()) {
      this.setupAndroidOptimizations(audio);
    } else if (this.isIOS()) {
      this.setupIOSOptimizations(audio);
    } else {
      this.setupDesktopOptimizations(audio);
    }
    
    console.log(`Platform optimizations applied: ${this.getPlatformName()}`);
  }

  /**
   * Setup Android-specific audio optimizations
   */
  setupAndroidOptimizations(audio: HTMLAudioElement): void {
    try {
      // Android-specific attributes
      (audio as any).setAttribute('playsinline', 'true');
      (audio as any).setAttribute('webkit-playsinline', 'true');
      (audio as any).setAttribute('x-webkit-airplay', 'allow');
      
      // Audio context for better background handling
      if (!this.audioContext && 'AudioContext' in window) {
        this.audioContext = new (window as any).AudioContext();
        this.audioContext.resume();
      }
      
      // Request wake lock for background playback
      this.requestWakeLock();
      
      // Set up visibility change handler for Android
      this.setupVisibilityHandler();
      
      console.log('Android audio optimizations applied');
    } catch (error) {
      console.warn('Failed to apply Android optimizations:', error);
    }
  }

  /**
   * Setup iOS-specific audio optimizations
   */
  setupIOSOptimizations(audio: HTMLAudioElement): void {
    try {
      // iOS-specific attributes
      (audio as any).setAttribute('playsinline', 'true');
      (audio as any).setAttribute('webkit-playsinline', 'true');
      
      // Prevent iOS from stopping audio
      audio.muted = false;
      audio.volume = 1.0;
      
      // Request wake lock
      this.requestWakeLock();
      
      console.log('iOS audio optimizations applied');
    } catch (error) {
      console.warn('Failed to apply iOS optimizations:', error);
    }
  }

  /**
   * Setup desktop browser optimizations
   */
  setupDesktopOptimizations(audio: HTMLAudioElement): void {
    try {
      // Desktop optimizations
      audio.crossOrigin = 'anonymous';
      
      // Request wake lock for desktop
      this.requestWakeLock();
      
      console.log('Desktop audio optimizations applied');
    } catch (error) {
      console.warn('Failed to apply desktop optimizations:', error);
    }
  }

  /**
   * Setup visibility change handler for background playback
   */
  setupVisibilityHandler(): void {
    if (this.pageVisibilityHandler) return;
    
    this.pageVisibilityHandler = (isVisible: boolean) => {
      console.log(`Page visibility changed: ${isVisible ? 'visible' : 'hidden'}`);
      
      // Handle background/foreground transitions
      if (!isVisible) {
        // Page went to background
        console.log('Page entered background mode');
      } else {
        // Page came to foreground
        console.log('Page entered foreground mode');
      }
    };
    
    document.addEventListener('visibilitychange', () => {
      this.pageVisibilityHandler?.(!document.hidden);
    });
  }

  /**
   * Get platform name for logging
   */
  getPlatformName(): string {
    if (this.isAndroid()) return 'Android';
    if (this.isIOS()) return 'iOS';
    if (this.isSafari()) return 'Safari';
    if (/Chrome/.test(navigator.userAgent)) return 'Chrome';
    if (/Firefox/.test(navigator.userAgent)) return 'Firefox';
    return 'Unknown';
  }

  /**
   * Check if browser supports background playback
   */
  supportsBackgroundPlayback(): boolean {
    // Most modern browsers support background playback with Media Session API
    return 'mediaSession' in navigator;
  }

  /**
   * Get background playback capabilities
   */
  getBackgroundCapabilities(): {
    mediaSession: boolean;
    wakeLock: boolean;
    pictureInPicture: boolean;
    platformOptimizations: boolean;
  } {
    return {
      mediaSession: 'mediaSession' in navigator,
      wakeLock: 'wakeLock' in navigator,
      pictureInPicture: 'documentPictureInPicture' in window,
      platformOptimizations: this.isAndroid() || this.isIOS()
    };
  }

  /**
   * Cleanup platform-specific resources
   */
  cleanup(): void {
    this.releaseWakeLock();
    
    // Clean up audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clean up visibility handler
    if (this.pageVisibilityHandler) {
      document.removeEventListener('visibilitychange', () => {});
      this.pageVisibilityHandler = null;
    }
    
    console.log('Background audio cleanup complete');
  }

  /**
   * Check if Capacitor media session plugin is needed
   */
  shouldUseCapacitorPlugin(): boolean {
    // Only suggest plugin if on Android and native APIs fail
    return this.isAndroid() && !('mediaSession' in navigator);
  }

  /**
   * Get recommendation for Capacitor plugin
   */
  getCapacitorPluginRecommendation(): string | null {
    if (!this.shouldUseCapacitorPlugin()) return null;

    return `
⚠️ Android Background Audio Issue Detected:

For reliable background playback on Android, consider installing:

npm install @capawesome-team/capacitor-media-session

Then in your main.tsx:
import { CapacitorMediaSession } from '@capawesome-team/capacitor-media-session';

CapacitorMediaSession.create({
  title: 'Quran Radio',
  artist: 'Noor Connect',
  album: 'Islamic Radio',
  artwork: [{ src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }]
});

This plugin provides:
✅ Reliable background playback on Android
✅ Lock screen media controls
✅ Audio focus management
✅ Small footprint (~15KB)
    `;
  }

  // Private audio context for better background handling
  private audioContext: AudioContext | null = null;
}

// Export singleton instance
export const androidAudioHelper = AndroidAudioHelper.getInstance();
