/**
 * Time-Limited Events System
 * Special events with 2x/3x rewards, flash sales, weekend bonuses
 */

import { quizStore } from '@/lib/quiz-store';

const EVENTS_KEY = 'quiz-time-events';
const ACTIVE_EVENT_KEY = 'quiz-active-event';

export type EventType = 'ramadan' | 'friday' | 'flash_sale' | 'weekend' | 'special';

export interface TimeEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  icon: string;
  color: string;
  startTime: string;
  endTime: string;
  multiplier: number; // XP multiplier (2x, 3x, etc.)
  storeDiscount: number; // Percentage off store items
  bonusRewards: {
    dailyXP: number;
    mysteryBoxBonus: number;
    comboBonus: number;
  };
  active: boolean;
}

// Pre-defined event templates
const EVENT_TEMPLATES: Record<EventType, Omit<TimeEvent, 'id' | 'startTime' | 'endTime' | 'active'>> = {
  ramadan: {
    type: 'ramadan',
    title: '🌙 Ramadan Special',
    description: '2x XP all month long! Special Ramadan questions.',
    icon: '🌙',
    color: 'from-indigo-500 to-purple-600',
    multiplier: 2,
    storeDiscount: 20,
    bonusRewards: {
      dailyXP: 100,
      mysteryBoxBonus: 50,
      comboBonus: 10
    }
  },
  friday: {
    type: 'friday',
    title: '🕌 Jumu\'ah Blessing',
    description: '3x XP every Friday! Limited to Friday only.',
    icon: '🕌',
    color: 'from-emerald-500 to-teal-600',
    multiplier: 3,
    storeDiscount: 0,
    bonusRewards: {
      dailyXP: 50,
      mysteryBoxBonus: 25,
      comboBonus: 5
    }
  },
  flash_sale: {
    type: 'flash_sale',
    title: '⚡ Flash Sale!',
    description: '50% off ALL store items! Limited time only.',
    icon: '⚡',
    color: 'from-amber-500 to-orange-600',
    multiplier: 1,
    storeDiscount: 50,
    bonusRewards: {
      dailyXP: 0,
      mysteryBoxBonus: 0,
      comboBonus: 0
    }
  },
  weekend: {
    type: 'weekend',
    title: '🎉 Weekend Warrior',
    description: '1.5x XP all weekend! Perfect time to grind.',
    icon: '🎉',
    color: 'from-pink-500 to-rose-600',
    multiplier: 1.5,
    storeDiscount: 15,
    bonusRewards: {
      dailyXP: 25,
      mysteryBoxBonus: 15,
      comboBonus: 3
    }
  },
  special: {
    type: 'special',
    title: '✨ Special Event',
    description: 'Limited time special event with amazing rewards!',
    icon: '✨',
    color: 'from-violet-500 to-purple-600',
    multiplier: 2.5,
    storeDiscount: 30,
    bonusRewards: {
      dailyXP: 75,
      mysteryBoxBonus: 40,
      comboBonus: 8
    }
  }
};

export class TimeEventsSystem {
  private static instance: TimeEventsSystem;

  static getInstance(): TimeEventsSystem {
    if (!TimeEventsSystem.instance) {
      TimeEventsSystem.instance = new TimeEventsSystem();
    }
    return TimeEventsSystem.instance;
  }

  // Check and activate automatic events
  checkAndActivateEvents(): TimeEvent | null {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const hour = now.getHours();
    
    // Friday event (Jumu'ah) - Active all day Friday
    if (dayOfWeek === 5) {
      return this.createEvent('friday', now);
    }
    
    // Weekend event - Saturday and Sunday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return this.createEvent('weekend', now);
    }
    
    // Flash sale - Random 1-hour window (for demo: every day at 2 PM)
    if (dayOfWeek !== 5 && hour === 14) {
      return this.createEvent('flash_sale', now, 1); // 1 hour duration
    }
    
    return null;
  }

  // Create a time-limited event
  private createEvent(type: EventType, startTime: Date, durationHours: number = 24): TimeEvent {
    const template = EVENT_TEMPLATES[type];
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    
    const event: TimeEvent = {
      id: `event_${type}_${startTime.toISOString()}`,
      ...template,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      active: true
    };
    
    localStorage.setItem(ACTIVE_EVENT_KEY, JSON.stringify(event));
    return event;
  }

  // Get currently active event
  getActiveEvent(): TimeEvent | null {
    const saved = localStorage.getItem(ACTIVE_EVENT_KEY);
    if (!saved) {
      // Check for automatic events
      return this.checkAndActivateEvents();
    }
    
    const event: TimeEvent = JSON.parse(saved);
    const now = new Date();
    const endTime = new Date(event.endTime);
    
    if (now > endTime) {
      // Event expired
      localStorage.removeItem(ACTIVE_EVENT_KEY);
      return this.checkAndActivateEvents();
    }
    
    return event;
  }

  // Check if any event is active
  hasActiveEvent(): boolean {
    return this.getActiveEvent() !== null;
  }

  // Get current XP multiplier from active event
  getCurrentMultiplier(): number {
    const event = this.getActiveEvent();
    return event ? event.multiplier : 1;
  }

  // Get store discount from active event
  getStoreDiscount(): number {
    const event = this.getActiveEvent();
    return event ? event.storeDiscount : 0;
  }

  // Get time remaining for active event
  getTimeRemaining(): string {
    const event = this.getActiveEvent();
    if (!event) return '00:00:00';
    
    const now = new Date();
    const endTime = new Date(event.endTime);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Get urgency message for active event
  getUrgencyMessage(): string | null {
    const event = this.getActiveEvent();
    if (!event) return null;
    
    const timeRemaining = this.getTimeRemaining();
    const [hours, minutes] = timeRemaining.split(':').map(Number);
    
    if (hours === 0 && minutes < 30) {
      return `⏰ ${event.title} ends in ${minutes}m!`;
    } else if (hours === 0 && minutes < 60) {
      return `⏰ ${event.title} ends in 1h!`;
    }
    
    return null;
  }

  // Get event notification messages
  getEventNotifications(): string[] {
    const notifications: string[] = [];
    const event = this.getActiveEvent();
    
    if (event) {
      // Event active notification
      notifications.push(`🎉 ${event.title} is LIVE! ${event.multiplier}x XP now!`);
      
      // Store sale notification
      if (event.storeDiscount > 0) {
        notifications.push(`⚡ Flash Sale! ${event.storeDiscount}% off store items!`);
      }
      
      // Urgency notification
      const urgency = this.getUrgencyMessage();
      if (urgency) {
        notifications.push(urgency);
      }
    }
    
    return notifications;
  }

  // Calculate XP with event multiplier
  calculateEventXP(baseXP: number): number {
    const multiplier = this.getCurrentMultiplier();
    return Math.round(baseXP * multiplier);
  }

  // Format event for display
  formatEventDisplay(): { title: string; message: string; color: string; icon: string } | null {
    const event = this.getActiveEvent();
    if (!event) return null;
    
    return {
      title: event.title,
      message: `${event.multiplier}x XP Active! Ends in ${this.getTimeRemaining()}`,
      color: event.color,
      icon: event.icon
    };
  }

  // Check if it's almost Friday (for pre-event notifications)
  isFridayComing(): { hoursUntil: number; isSoon: boolean } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    // If it's Thursday after 6 PM
    if (dayOfWeek === 4 && hour >= 18) {
      const hoursUntil = 24 - hour + (dayOfWeek === 4 ? 0 : 0);
      return { hoursUntil: 24 - hour, isSoon: true };
    }
    
    return { hoursUntil: 0, isSoon: false };
  }

  // Get upcoming events preview
  getUpcomingEvents(): Array<{ type: EventType; title: string; when: string }> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const upcoming: Array<{ type: EventType; title: string; when: string }> = [];
    
    // Friday Jumu'ah
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    if (daysUntilFriday <= 3) {
      upcoming.push({
        type: 'friday',
        title: 'Jumu\'ah Blessing',
        when: daysUntilFriday === 0 ? 'Tomorrow' : `In ${daysUntilFriday} days`
      });
    }
    
    // Weekend
    const daysUntilWeekend = (6 - dayOfWeek + 7) % 7 || 7;
    if (daysUntilWeekend <= 2) {
      upcoming.push({
        type: 'weekend',
        title: 'Weekend Warrior',
        when: daysUntilWeekend === 0 ? 'Tomorrow' : `In ${daysUntilWeekend} days`
      });
    }
    
    return upcoming;
  }
}

export const timeEventsSystem = TimeEventsSystem.getInstance();
