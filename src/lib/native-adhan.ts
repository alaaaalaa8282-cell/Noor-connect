import { Capacitor } from '@capacitor/core';

export interface NativeAdhanAlarm {
  id: number;
  triggerAt: number;
  prayerName: string;
  adhanUrl: string;
}

interface NativeAdhanPlugin {
  schedule(options: { alarms: NativeAdhanAlarm[]; enabled?: boolean }): Promise<{ scheduled: number; enabled: boolean }>;
  clear(): Promise<{ status: string }>;
  setEnabled(options: { enabled: boolean }): Promise<{ enabled: boolean; count: number }>;
  getStatus(): Promise<{ enabled: boolean; count: number }>;
}

const NativeAdhanPlugin = Capacitor.registerPlugin<NativeAdhanPlugin>('NativeAdhanPlugin');

class NativeAdhanBridge {
  private isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  async schedule(alarms: NativeAdhanAlarm[], enabled: boolean): Promise<number> {
    if (!this.isNative()) return 0;

    try {
      const result = await NativeAdhanPlugin.schedule({ alarms, enabled });
      return result.scheduled ?? 0;
    } catch (error) {
      console.warn('Failed to schedule native adhan alarms:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await NativeAdhanPlugin.clear();
    } catch (error) {
      console.warn('Failed to clear native adhan alarms:', error);
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (!this.isNative()) return;

    try {
      await NativeAdhanPlugin.setEnabled({ enabled });
    } catch (error) {
      console.warn('Failed to update native adhan enabled state:', error);
    }
  }

  async getStatus(): Promise<{ enabled: boolean; count: number }> {
    if (!this.isNative()) {
      return { enabled: true, count: 0 };
    }

    try {
      return await NativeAdhanPlugin.getStatus();
    } catch (error) {
      console.warn('Failed to fetch native adhan status:', error);
      return { enabled: true, count: 0 };
    }
  }
}

export const nativeAdhan = new NativeAdhanBridge();
