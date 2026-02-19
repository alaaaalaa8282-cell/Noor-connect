export const PRAYER_ALARM_TOGGLE_EVENT = 'prayer-alarm-toggle';
export const PRAYER_ALARM_CONTROL_EVENT = 'prayer-alarm-control';
export const PRAYER_ALARM_STATE_EVENT = 'prayer-alarm-state-change';

export interface PrayerAlarmToggleDetail {
  enabled: boolean;
}

export interface PrayerAlarmControlDetail {
  action: 'stop' | 'test';
  prayerName?: string;
}

export interface PrayerAlarmStateDetail {
  isPlaying: boolean;
  prayerName: string | null;
}
