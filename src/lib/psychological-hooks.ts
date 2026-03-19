/**
 * Psychological Hooks & Loss Aversion Messages
 * Creates urgency, FOMO, and retention hooks
 */

import { quizStore } from '@/lib/quiz-store';
import { quizManager } from '@/lib/quiz-manager';
import { livesSystem } from '@/lib/lives-system';
import { timeEventsSystem } from '@/lib/time-events';
import { mysteryBoxSystem } from '@/lib/mystery-box';

export type LossAversionType = 'lives' | 'streak' | 'daily_reward' | 'event' | 'mystery_box';

export interface LossAversionMessage {
  type: LossAversionType;
  message: string;
  subMessage?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  color: string;
  actionText?: string;
  countdown?: string;
}

export class PsychologicalHooks {
  private static instance: PsychologicalHooks;

  static getInstance(): PsychologicalHooks {
    if (!PsychologicalHooks.instance) {
      PsychologicalHooks.instance = new PsychologicalHooks();
    }
    return PsychologicalHooks.instance;
  }

  // ===== LIVES SCARCITY =====
  
  getLivesScarcityMessage(): LossAversionMessage | null {
    const lives = livesSystem.getCurrentLives();
    const maxLives = livesSystem.getMaxLives();
    const timeUntilNext = livesSystem.getTimeUntilNextLife();

    if (lives === 1) {
      return {
        type: 'lives',
        message: '⚠️ LAST LIFE!',
        subMessage: 'You have 1 life remaining. Play carefully...',
        urgency: 'critical',
        icon: '💔',
        color: 'text-red-500 bg-red-50 border-red-200',
        actionText: 'Refill Now (100 XP)',
        countdown: timeUntilNext
      };
    }

    if (lives === 2) {
      return {
        type: 'lives',
        message: 'Only 2 lives left',
        subMessage: `Next life in ${timeUntilNext}`,
        urgency: 'high',
        icon: '❤️',
        color: 'text-orange-500 bg-orange-50 border-orange-200',
        actionText: 'Get More Lives'
      };
    }

    if (lives <= maxLives * 0.4) {
      return {
        type: 'lives',
        message: `${lives} lives remaining`,
        subMessage: `Next life in ${timeUntilNext}`,
        urgency: 'medium',
        icon: '💛',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      };
    }

    return null;
  }

  // ===== STREAK LOSS AVERSION =====

  getStreakLossMessage(): LossAversionMessage | null {
    const dailyStatus = quizStore.getDailyRewardStatus();
    
    if (!dailyStatus.canClaimToday && dailyStatus.currentStreak > 0) {
      return null; // Already claimed today
    }

    const hoursLeft = this.getHoursUntilMidnight();
    
    if (dailyStatus.currentStreak === 0) return null;

    if (hoursLeft <= 2 && dailyStatus.currentStreak > 5) {
      return {
        type: 'streak',
        message: `🔥 ${dailyStatus.currentStreak}-Day Streak in DANGER!`,
        subMessage: `Your streak expires in ${Math.ceil(hoursLeft)} hours! Play now to save it.`,
        urgency: 'critical',
        icon: '🔥',
        color: 'text-red-600 bg-red-50 border-red-200 animate-pulse',
        actionText: 'Play Now!',
        countdown: `${Math.ceil(hoursLeft)}h left`
      };
    }

    if (hoursLeft <= 4 && dailyStatus.currentStreak > 0) {
      return {
        type: 'streak',
        message: `${dailyStatus.currentStreak}-Day Streak`,
        subMessage: `Expires in ${Math.ceil(hoursLeft)} hours. Don't lose your progress!`,
        urgency: 'high',
        icon: '⏰',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        countdown: `${Math.ceil(hoursLeft)}h left`
      };
    }

    if (dailyStatus.currentStreak >= 6) {
      return {
        type: 'streak',
        message: `${dailyStatus.currentStreak}-Day Streak! 🎉`,
        subMessage: 'One more day for the 7-day bonus reward!',
        urgency: 'medium',
        icon: '🔥',
        color: 'text-amber-600 bg-amber-50 border-amber-200'
      };
    }

    return null;
  }

  // ===== DAILY REWARD EXPIRING =====

  getDailyRewardUrgency(): LossAversionMessage | null {
    const dailyStatus = quizStore.getDailyRewardStatus();
    
    if (!dailyStatus.canClaimToday) return null;

    const hoursLeft = this.getHoursUntilMidnight();
    const nextReward = dailyStatus.nextReward;

    if (hoursLeft <= 2) {
      return {
        type: 'daily_reward',
        message: 'Daily Reward EXPIRES SOON!',
        subMessage: `Day ${nextReward?.day || 1} reward waiting - Claim before midnight!`,
        urgency: 'high',
        icon: '🎁',
        color: 'text-purple-600 bg-purple-50 border-purple-200 animate-pulse',
        actionText: 'Claim Now!',
        countdown: `${Math.ceil(hoursLeft)}h left`
      };
    }

    if (hoursLeft <= 6) {
      return {
        type: 'daily_reward',
        message: 'Daily Reward Waiting',
        subMessage: `Claim your Day ${nextReward?.day || 1} rewards before they expire!`,
        urgency: 'medium',
        icon: '🎁',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      };
    }

    return null;
  }

  // ===== EVENT FOMO =====

  getEventFOMOMessage(): LossAversionMessage | null {
    const event = timeEventsSystem.getActiveEvent();
    if (!event) return null;

    const timeRemaining = timeEventsSystem.getTimeRemaining();
    const [hours, minutes] = timeRemaining.split(':').map(Number);

    if (hours === 0 && minutes < 30) {
      return {
        type: 'event',
        message: `${event.title} ENDING NOW!`,
        subMessage: `${event.multiplier}x XP ends in ${minutes}m! Don't miss out!`,
        urgency: 'critical',
        icon: event.icon,
        color: `text-white bg-gradient-to-r ${event.color} animate-pulse`,
        actionText: 'Play Now!',
        countdown: `${minutes}m left`
      };
    }

    if (hours === 0 && minutes < 60) {
      return {
        type: 'event',
        message: `${event.title} ends in 1 hour!`,
        subMessage: `${event.multiplier}x XP active - Last chance!`,
        urgency: 'high',
        icon: '⏰',
        color: `text-white bg-gradient-to-r ${event.color}`,
        actionText: 'Join Event',
        countdown: '1h left'
      };
    }

    if (hours < 3) {
      return {
        type: 'event',
        message: `${event.title} Active`,
        subMessage: `${event.multiplier}x XP - Ends in ${hours}h ${minutes}m`,
        urgency: 'medium',
        icon: event.icon,
        color: `text-white bg-gradient-to-r ${event.color}`,
        countdown: `${hours}h ${minutes}m left`
      };
    }

    return {
      type: 'event',
      message: `${event.title} Live!`,
      subMessage: `${event.multiplier}x XP for ${hours} more hours!`,
      urgency: 'low',
      icon: event.icon,
      color: `text-white bg-gradient-to-r ${event.color}`
    };
  }

  // ===== MYSTERY BOX AVAILABILITY =====

  getMysteryBoxUrgency(): LossAversionMessage | null {
    const canClaim = mysteryBoxSystem.canClaimDailyBox();
    
    if (!canClaim) {
      const timeUntil = mysteryBoxSystem.getTimeUntilNextBox();
      return {
        type: 'mystery_box',
        message: 'Free Mystery Box Tomorrow',
        subMessage: `Next free box in ${timeUntil}`,
        urgency: 'low',
        icon: '📦',
        color: 'text-slate-600 bg-slate-50 border-slate-200'
      };
    }

    return {
      type: 'mystery_box',
      message: '🎁 Free Mystery Box Ready!',
      subMessage: 'Open it now for random rewards - FREE!',
      urgency: 'medium',
      icon: '🎁',
      color: 'text-purple-600 bg-purple-50 border-purple-200 animate-pulse',
      actionText: 'Open Box!'
    };
  }

  // ===== COMBINED URGENCY CHECK =====

  getMostUrgentMessage(): LossAversionMessage | null {
    const messages: LossAversionMessage[] = [];

    const livesMsg = this.getLivesScarcityMessage();
    if (livesMsg) messages.push(livesMsg);

    const streakMsg = this.getStreakLossMessage();
    if (streakMsg) messages.push(streakMsg);

    const dailyMsg = this.getDailyRewardUrgency();
    if (dailyMsg) messages.push(dailyMsg);

    const eventMsg = this.getEventFOMOMessage();
    if (eventMsg) messages.push(eventMsg);

    const boxMsg = this.getMysteryBoxUrgency();
    if (boxMsg) messages.push(boxMsg);

    // Sort by urgency
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    messages.sort((a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency]);

    // Return the most urgent, or null if none
    return messages[0] || null;
  }

  // ===== PROGRESS HOOKS =====

  getProgressHook(): string | null {
    const stats = quizStore.getXPSummary();
    const levelProgress = quizManager.getLevelProgress();
    
    // Almost level up
    if (levelProgress.progress > 80) {
      return `🏆 Only ${levelProgress.remaining} XP to level up! One more quiz?`;
    }

    // XP milestone approaching
    const milestones = [1000, 2500, 5000, 10000, 25000];
    const nextMilestone = milestones.find(m => stats.current < m);
    if (nextMilestone) {
      const remaining = nextMilestone - stats.current;
      if (remaining <= 200) {
        return `✨ Just ${remaining} XP to reach ${nextMilestone.toLocaleString()} total!`;
      }
    }

    return null;
  }

  // ===== FOMO MESSAGES =====

  getFOMOMessage(): string | null {
    const messages: string[] = [];

    // Event FOMO
    const event = timeEventsSystem.getActiveEvent();
    if (event) {
      messages.push(`🔥 ${event.multiplier}x XP event active!`);
    }

    // Streak FOMO
    const dailyStatus = quizStore.getDailyRewardStatus();
    if (dailyStatus.currentStreak > 5) {
      messages.push(`🔥 Don't lose your ${dailyStatus.currentStreak}-day streak!`);
    }

    // Lives FOMO
    const lives = livesSystem.getCurrentLives();
    if (lives === livesSystem.getMaxLives()) {
      messages.push(`❤️ Lives full! You're wasting regeneration time.`);
    }

    // Mystery box FOMO
    if (mysteryBoxSystem.canClaimDailyBox()) {
      messages.push(`🎁 Free mystery box waiting!`);
    }

    return messages.length > 0 ? messages[0] : null;
  }

  // ===== MOTIVATION MESSAGES =====

  getMotivationMessage(): string | null {
    const messages = [
      "You're doing great! Keep the momentum going! 💪",
      "Every question makes you wiser! 📚",
      "Knowledge is power! You're getting stronger! ✨",
      "Almost at your next milestone! Don't stop now! 🎯",
      "Your dedication is inspiring! 🔥",
      "One more quiz for today? You can do it! 💪",
      "Learning Islam is the best investment! 🌟",
      "Your streak is building - don't break the chain! 🔗"
    ];

    // Return random message
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // ===== UTILITY =====

  private getHoursUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
  }
}

export const psychologicalHooks = PsychologicalHooks.getInstance();
