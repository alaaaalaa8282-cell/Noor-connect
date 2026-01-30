/**
 * Android Background Audio Helper
 * Provides fallback solutions for Android background playback issues
 */

export class AndroidAudioHelper {
  private static instance: AndroidAudioHelper;
  private wakeLock: WakeLockSentinel | null = null;

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
   * Setup Android-specific audio optimizations
   */
  setupAndroidOptimizations(audio: HTMLAudioElement): void {
    if (!this.isAndroid()) return;

    try {
      // Set audio properties for better Android background playback
      audio.preload = 'auto';
      audio.loop = false;
      
      // Enable background playback hints
      (audio as any).setAttribute('playsinline', 'true');
      (audio as any).setAttribute('webkit-playsinline', 'true');
      
      // Request wake lock for background playback
      this.requestWakeLock();
      
      console.log('Android audio optimizations applied');
    } catch (error) {
      console.warn('Failed to apply Android optimizations:', error);
    }
  }

  /**
   * Cleanup Android-specific resources
   */
  cleanup(): void {
    this.releaseWakeLock();
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
}

// Export singleton instance
export const androidAudioHelper = AndroidAudioHelper.getInstance();
