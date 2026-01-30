/**
 * Global Time Formatter Utility
 * Handles consistent time formatting across the app based on user preferences
 */

export interface TimeFormatOptions {
  format?: '12' | '24';
  showSeconds?: boolean;
  showAMPM?: boolean;
}

/**
 * Format time string or Date object based on user preference
 * @param time - Time string (HH:MM) or Date object
 * @param format - Time format preference ('12' or '24')
 * @param options - Additional formatting options
 * @returns Formatted time string
 */
export function formatTime(
  time: string | Date, 
  format: '12' | '24' = '24',
  options: TimeFormatOptions = {}
): string {
  const { showSeconds = false, showAMPM = true } = options;
  
  let date: Date;
  
  if (typeof time === 'string') {
    // Parse time string (HH:MM or HH:MM:SS)
    const [hours, minutes, seconds] = time.split(':').map(Number);
    date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
  } else {
    date = time;
  }

  if (format === '12') {
    // 12-hour format
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: showAMPM
    };
    
    if (showSeconds) {
      timeOptions.second = '2-digit';
    }
    
    return date.toLocaleTimeString('en-US', timeOptions);
  } else {
    // 24-hour format
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    if (showSeconds) {
      timeOptions.second = '2-digit';
    }
    
    return date.toLocaleTimeString('en-US', timeOptions);
  }
}

/**
 * Format time for prayer cards (shorter version)
 * @param time - Time string (HH:MM) or Date object
 * @param format - Time format preference ('12' or '24')
 * @returns Formatted time string
 */
export function formatPrayerTime(time: string | Date, format: '12' | '24' = '24'): string {
  return formatTime(time, format, { showSeconds: false, showAMPM: true });
}

/**
 * Format time for countdown display
 * @param time - Time string (HH:MM) or Date object
 * @param format - Time format preference ('12' or '24')
 * @returns Formatted time string
 */
export function formatCountdownTime(time: string | Date, format: '12' | '24' = '24'): string {
  return formatTime(time, format, { showSeconds: false, showAMPM: true });
}

/**
 * Get current time format from localStorage
 * @returns Current time format preference
 */
export function getTimeFormat(): '12' | '24' {
  return (localStorage.getItem('timeFormat') as '12' | '24') || '24';
}

/**
 * Set time format preference
 * @param format - Time format preference ('12' or '24')
 */
export function setTimeFormat(format: '12' | '24'): void {
  localStorage.setItem('timeFormat', format);
}
