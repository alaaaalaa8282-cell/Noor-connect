/**
 * Quiz Store System - Data Types and Structures
 * Power-up store where users spend XP to buy items
 */

// Store Item Types
export type StoreItemCategory = 'basic' | 'premium' | 'legendary' | 'booster';
export type StoreItemType = 'powerup' | 'booster' | 'cosmetic' | 'protection';

// Store Item Interface
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number; // XP cost
  type: StoreItemType;
  quantity: number; // How many you get per purchase
  maxInventory: number; // Max you can hold
  category: StoreItemCategory;
  // Effect details for power-ups
  effect?: {
    type: string;
    value: number;
    duration?: number; // in seconds, for boosters
  };
  // Requirements to unlock (optional)
  requirements?: {
    minLevel?: number;
    achievementId?: string;
    categoryMastery?: string;
  };
}

// User Inventory
export interface UserInventory {
  items: Record<string, number>; // itemId -> quantity
  activeBoosters: ActiveBooster[];
}

// Active Booster
export interface ActiveBooster {
  itemId: string;
  activatedAt: string;
  expiresAt: string;
  effect: {
    type: string;
    value: number;
  };
}

// Purchase Record
export interface PurchaseRecord {
  itemId: string;
  itemName: string;
  cost: number;
  quantity: number;
  purchasedAt: string;
}

// Store State
export interface StoreState {
  inventory: UserInventory;
  purchaseHistory: PurchaseRecord[];
  totalSpent: number;
}

// Daily Reward
export interface DailyReward {
  day: number;
  xp: number;
  items?: { itemId: string; quantity: number }[];
  claimed: boolean;
  claimDate?: string;
}

// Daily Reward Status
export interface DailyRewardStatus {
  currentStreak: number;
  lastClaimDate: string | null;
  rewards: DailyReward[];
  canClaimToday: boolean;
  nextReward: DailyReward | null;
}

// Combo State
export interface ComboState {
  currentCombo: number;
  maxCombo: number;
  comboMultiplier: number;
  lastAnswerTime: number;
  isActive: boolean;
}

// Quiz Session for History
export interface QuizSession {
  id: string;
  date: string;
  mode: 'classic' | 'timeAttack' | 'survival' | 'daily' | 'category';
  score: number;
  totalQuestions: number;
  accuracy: number;
  xpEarned: number;
  maxCombo: number;
  powerUpsUsed: string[];
  categories: string[];
  timeSpent: number;
  difficulty?: string;
  streakAtEnd: number;
}

// Daily Challenge
export interface DailyChallenge {
  id: string;
  date: string;
  type: 'category' | 'speedRun' | 'noPowerups' | 'hardMode' | 'mystery';
  title: string;
  description: string;
  rules: {
    category?: string;
    questionCount: number;
    timeLimit?: number;
    allowPowerups: boolean;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  };
  reward: {
    xp: number;
    item?: { itemId: string; quantity: number };
  };
  completed: boolean;
  completedAt?: string;
}

// XP Transaction
export interface XPTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  source: string;
  timestamp: string;
  balanceAfter: number;
}

// Storage Keys
export const STORAGE_KEYS = {
  QUIZ_STATS: 'enhanced-quiz-stats',
  POWER_UPS: 'quiz-power-ups',
  ACHIEVEMENTS: 'quiz-achievements',
  INVENTORY: 'quiz-inventory',
  STORE_STATE: 'quiz-store-state',
  PURCHASE_HISTORY: 'quiz-purchase-history',
  DAILY_CHALLENGE: 'quiz-daily-challenge',
  DAILY_REWARDS: 'quiz-daily-rewards',
  QUIZ_HISTORY: 'quiz-history',
  COMBO_STATE: 'quiz-combo-state',
  XP_TRANSACTIONS: 'quiz-xp-transactions',
} as const;
