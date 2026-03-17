/**
 * Islamic Remedies Gamification System
 * Tracks user engagement, favorites, streaks, and achievements
 */

export interface RemedyStats {
  totalRemediesViewed: number;
  favoritesCount: number;
  currentStreak: number;
  longestStreak: number;
  lastUsedDate: string;
  dailyRemedyCompleted: boolean;
  achievements: string[];
  moodUsage: Record<string, number>;
  typeUsage: Record<string, number>;
  xp: number;
  level: number;
}

export interface RemedyAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'remedies' | 'streak' | 'favorites' | 'mood' | 'type' | 'daily' | 'level';
    value: number;
    target?: string;
  };
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface FavoriteRemedy {
  id: string;
  moodId: string;
  content: string;
  arabic?: string;
  reference: string;
  type: string;
  addedAt: string;
}

export interface DailyRemedy {
  id: string;
  moodId: string;
  content: string;
  arabic?: string;
  reference: string;
  type: string;
  date: string;
  completed: boolean;
}

const REMEDY_STATS_KEY = 'remedy-stats';
const FAVORITES_KEY = 'remedy-favorites';
const DAILY_REMEDY_KEY = 'daily-remedy';
const ACHIEVEMENTS_KEY = 'remedy-achievements';

export class RemedyGamification {
  private static instance: RemedyGamification;
  
  static getInstance(): RemedyGamification {
    if (!RemedyGamification.instance) {
      RemedyGamification.instance = new RemedyGamification();
    }
    return RemedyGamification.instance;
  }

  // Get user stats
  getStats(): RemedyStats {
    const saved = localStorage.getItem(REMEDY_STATS_KEY);
    if (saved) {
      return { ...this.getDefaultStats(), ...JSON.parse(saved) };
    }
    return this.getDefaultStats();
  }

  private getDefaultStats(): RemedyStats {
    return {
      totalRemediesViewed: 0,
      favoritesCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastUsedDate: '',
      dailyRemedyCompleted: false,
      achievements: [],
      moodUsage: {},
      typeUsage: {},
      xp: 0,
      level: 1
    };
  }

  // Update stats after viewing a remedy
  updateStats(moodId: string, remedyType: string): RemedyStats {
    const stats = this.getStats();
    const today = new Date().toDateString();
    
    // Update basic stats
    stats.totalRemediesViewed += 1;
    stats.lastUsedDate = today;
    
    // Update mood usage
    stats.moodUsage[moodId] = (stats.moodUsage[moodId] || 0) + 1;
    
    // Update type usage
    stats.typeUsage[remedyType] = (stats.typeUsage[remedyType] || 0) + 1;
    
    // Update streak
    this.updateStreak(stats);
    
    // Calculate XP
    const xpEarned = this.calculateXPEarned(stats);
    stats.xp += xpEarned;
    
    // Update level
    stats.level = this.calculateLevel(stats.xp);
    
    // Save stats
    localStorage.setItem(REMEDY_STATS_KEY, JSON.stringify(stats));
    
    // Check achievements
    this.checkAchievements(stats);
    
    return stats;
  }

  private updateStreak(stats: RemedyStats): void {
    const today = new Date().toDateString();
    const lastUsed = stats.lastUsedDate;
    
    if (!lastUsed) {
      stats.currentStreak = 1;
      return;
    }
    
    const lastDate = new Date(lastUsed);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      stats.currentStreak += 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    } else if (diffDays > 1) {
      // Streak broken
      stats.currentStreak = 1;
    }
    // If diffDays === 0, same day, don't change streak
  }

  private calculateXPEarned(stats: RemedyStats): number {
    let xp = 5; // Base XP for viewing remedy
    
    // Streak bonus
    xp += stats.currentStreak * 2;
    
    // First time bonus
    if (stats.totalRemediesViewed === 1) xp += 20;
    
    // Milestone bonuses
    if (stats.totalRemediesViewed % 10 === 0) xp += 15;
    if (stats.totalRemediesViewed % 50 === 0) xp += 50;
    if (stats.totalRemediesViewed % 100 === 0) xp += 100;
    
    return xp;
  }

  private calculateLevel(xp: number): number {
    const thresholds = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) return i + 1;
    }
    return 1;
  }

  // Favorites management
  getFavorites(): FavoriteRemedy[] {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  addToFavorites(remedy: any): boolean {
    const favorites = this.getFavorites();
    const exists = favorites.find(f => f.id === remedy.id);
    
    if (exists) return false;
    
    const favorite: FavoriteRemedy = {
      id: remedy.id,
      moodId: remedy.moodId,
      content: remedy.text,
      arabic: remedy.arabic,
      reference: remedy.reference,
      type: remedy.type,
      addedAt: new Date().toISOString()
    };
    
    favorites.push(favorite);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    
    // Update stats
    const stats = this.getStats();
    stats.favoritesCount = favorites.length;
    localStorage.setItem(REMEDY_STATS_KEY, JSON.stringify(stats));
    
    return true;
  }

  removeFromFavorites(remedyId: string): boolean {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(f => f.id !== remedyId);
    
    if (filtered.length === favorites.length) return false;
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    
    // Update stats
    const stats = this.getStats();
    stats.favoritesCount = filtered.length;
    localStorage.setItem(REMEDY_STATS_KEY, JSON.stringify(stats));
    
    return true;
  }

  isFavorite(remedyId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(f => f.id === remedyId);
  }

  // Daily remedy management
  getDailyRemedy(): DailyRemedy | null {
    const saved = localStorage.getItem(DAILY_REMEDY_KEY);
    if (saved) {
      const remedy: DailyRemedy = JSON.parse(saved);
      const today = new Date().toDateString();
      const remedyDate = new Date(remedy.date).toDateString();
      
      if (today === remedyDate) {
        return remedy;
      }
    }
    
    return null;
  }

  generateDailyRemedy(moodId: string, content: any): DailyRemedy {
    const remedy: DailyRemedy = {
      id: `daily-${Date.now()}`,
      moodId,
      content: content.text,
      arabic: content.arabic,
      reference: content.reference,
      type: content.type,
      date: new Date().toISOString(),
      completed: false
    };
    
    localStorage.setItem(DAILY_REMEDY_KEY, JSON.stringify(remedy));
    return remedy;
  }

  completeDailyRemedy(): boolean {
    const remedy = this.getDailyRemedy();
    if (!remedy || remedy.completed) return false;
    
    remedy.completed = true;
    localStorage.setItem(DAILY_REMEDY_KEY, JSON.stringify(remedy));
    
    // Update stats
    const stats = this.getStats();
    stats.dailyRemedyCompleted = true;
    stats.xp += 25; // Bonus XP for daily remedy
    localStorage.setItem(REMEDY_STATS_KEY, JSON.stringify(stats));
    
    return true;
  }

  // Achievements system
  getAchievements(): RemedyAchievement[] {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      const savedAchievements = JSON.parse(saved);
      return ACHIEVEMENTS.map(achievement => {
        const saved = savedAchievements.find((a: RemedyAchievement) => a.id === achievement.id);
        return saved || achievement;
      });
    }
    return ACHIEVEMENTS;
  }

  private checkAchievements(stats: RemedyStats): RemedyAchievement[] {
    const unlockedAchievements: RemedyAchievement[] = [];
    const currentAchievements = this.getAchievements();
    
    ACHIEVEMENTS.forEach(achievement => {
      if (currentAchievements.find(a => a.id === achievement.id)?.unlocked) {
        return; // Already unlocked
      }
      
      let unlocked = false;
      
      switch (achievement.requirement.type) {
        case 'remedies':
          unlocked = stats.totalRemediesViewed >= achievement.requirement.value;
          break;
        case 'streak':
          unlocked = stats.longestStreak >= achievement.requirement.value;
          break;
        case 'favorites':
          unlocked = stats.favoritesCount >= achievement.requirement.value;
          break;
        case 'mood':
          if (achievement.requirement.target) {
            unlocked = (stats.moodUsage[achievement.requirement.target] || 0) >= achievement.requirement.value;
          }
          break;
        case 'type':
          if (achievement.requirement.target) {
            unlocked = (stats.typeUsage[achievement.requirement.target] || 0) >= achievement.requirement.value;
          }
          break;
        case 'daily':
          unlocked = stats.dailyRemedyCompleted;
          break;
        case 'level':
          unlocked = stats.level >= achievement.requirement.value;
          break;
      }
      
      if (unlocked) {
        const updatedAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
        
        currentAchievements.push(updatedAchievement);
        unlockedAchievements.push(updatedAchievement);
        
        // Add achievement points to XP
        stats.xp += achievement.points;
      }
    });
    
    // Save achievements
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(currentAchievements));
    
    return unlockedAchievements;
  }

  // Get level progress
  getLevelProgress(): { current: number; next: number; progress: number; remaining: number } {
    const stats = this.getStats();
    const thresholds = [0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000];
    const currentLevelIndex = stats.level - 1;
    
    if (currentLevelIndex >= thresholds.length - 1) {
      return { current: stats.xp, next: stats.xp, progress: 100, remaining: 0 };
    }
    
    const currentXP = stats.xp - thresholds[currentLevelIndex];
    const neededXP = thresholds[currentLevelIndex + 1] - thresholds[currentLevelIndex];
    const progress = (currentXP / neededXP) * 100;
    
    return {
      current: currentXP,
      next: neededXP,
      progress: Math.min(100, Math.max(0, progress)),
      remaining: Math.max(0, neededXP - currentXP)
    };
  }

  // Reset all stats (for testing)
  resetStats(): void {
    localStorage.removeItem(REMEDY_STATS_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(DAILY_REMEDY_KEY);
    localStorage.removeItem(ACHIEVEMENTS_KEY);
  }
}

// Achievement definitions
export const ACHIEVEMENTS: RemedyAchievement[] = [
  {
    id: 'first_remedy',
    name: 'First Step',
    description: 'View your first remedy',
    icon: '🌱',
    requirement: { type: 'remedies', value: 1 },
    points: 20,
    unlocked: false
  },
  {
    id: 'remedy_collector',
    name: 'Remedy Collector',
    description: 'View 10 remedies',
    icon: '📚',
    requirement: { type: 'remedies', value: 10 },
    points: 50,
    unlocked: false
  },
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: { type: 'streak', value: 7 },
    points: 100,
    unlocked: false
  },
  {
    id: 'favorite_keeper',
    name: 'Favorite Keeper',
    description: 'Save 5 favorite remedies',
    icon: '❤️',
    requirement: { type: 'favorites', value: 5 },
    points: 75,
    unlocked: false
  },
  {
    id: 'daily_devotee',
    name: 'Daily Devotee',
    description: 'Complete your daily remedy',
    icon: '⭐',
    requirement: { type: 'daily', value: 1 },
    points: 25,
    unlocked: false
  },
  {
    id: 'quran_master',
    name: 'Quran Master',
    description: 'View 20 Quran verses/ayahs',
    icon: '📖',
    requirement: { type: 'type', value: 20, target: 'ayah' },
    points: 150,
    unlocked: false
  },
  {
    id: 'dua_specialist',
    name: 'Dua Specialist',
    description: 'View 15 duas',
    icon: '🤲',
    requirement: { type: 'type', value: 15, target: 'dua' },
    points: 125,
    unlocked: false
  },
  {
    id: 'level_5',
    name: 'Seeker Level 5',
    description: 'Reach level 5',
    icon: '🌟',
    requirement: { type: 'level', value: 5 },
    points: 200,
    unlocked: false
  }
];

export const remedyGamification = RemedyGamification.getInstance();
