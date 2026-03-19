/**
 * Quiz Store Catalog - All purchasable items
 * Users spend XP to buy power-ups, boosters, and special items
 */

import { StoreItem } from './quiz-store-data';

// Basic Power-ups (Affordable, frequently used)
export const BASIC_POWERUPS: StoreItem[] = [
  {
    id: 'fifty_fifty',
    name: '50:50',
    description: 'Remove two incorrect answers',
    icon: '✂️',
    cost: 50,
    type: 'powerup',
    quantity: 1,
    maxInventory: 10,
    category: 'basic',
    effect: { type: 'removeWrong', value: 2 }
  },
  {
    id: 'extra_time',
    name: 'Extra Time',
    description: 'Add 30 seconds to the timer',
    icon: '⏰',
    cost: 40,
    type: 'powerup',
    quantity: 1,
    maxInventory: 10,
    category: 'basic',
    effect: { type: 'addTime', value: 30 }
  },
  {
    id: 'hint',
    name: 'Hint',
    description: 'Get a helpful clue about the answer',
    icon: '💡',
    cost: 30,
    type: 'powerup',
    quantity: 1,
    maxInventory: 15,
    category: 'basic',
    effect: { type: 'showHint', value: 1 }
  },
  {
    id: 'skip',
    name: 'Skip Question',
    description: 'Skip to the next question without penalty',
    icon: '⏭️',
    cost: 60,
    type: 'powerup',
    quantity: 1,
    maxInventory: 5,
    category: 'basic',
    effect: { type: 'skipQuestion', value: 1 }
  }
];

// Premium Power-ups (Mid-range cost, powerful effects)
export const PREMIUM_POWERUPS: StoreItem[] = [
  {
    id: 'double_points',
    name: 'Double Points',
    description: 'Earn 2x points for the next 3 questions',
    icon: '2️⃣',
    cost: 150,
    type: 'powerup',
    quantity: 1,
    maxInventory: 5,
    category: 'premium',
    effect: { type: 'multiplier', value: 2, duration: 3 }
  },
  {
    id: 'freeze_time',
    name: 'Freeze Time',
    description: 'Pause the timer for 15 seconds',
    icon: '❄️',
    cost: 120,
    type: 'powerup',
    quantity: 1,
    maxInventory: 5,
    category: 'premium',
    effect: { type: 'freezeTime', value: 15 }
  },
  {
    id: 'second_chance',
    name: 'Second Chance',
    description: 'Wrong answer doesn\'t break your streak',
    icon: '🛡️',
    cost: 200,
    type: 'powerup',
    quantity: 1,
    maxInventory: 3,
    category: 'premium',
    effect: { type: 'streakProtection', value: 1 }
  },
  {
    id: 'category_expert',
    name: 'Category Expert',
    description: 'Highlight answers from the correct category',
    icon: '📚',
    cost: 180,
    type: 'powerup',
    quantity: 1,
    maxInventory: 3,
    category: 'premium',
    effect: { type: 'categoryHint', value: 1 }
  },
  {
    id: 'reveal_answer',
    name: 'Reveal Answer',
    description: 'Show the correct answer (counts as correct)',
    icon: '👁️',
    cost: 250,
    type: 'powerup',
    quantity: 1,
    maxInventory: 3,
    category: 'premium',
    effect: { type: 'revealCorrect', value: 1 }
  }
];

// Legendary Power-ups (Expensive, game-changing effects)
export const LEGENDARY_POWERUPS: StoreItem[] = [
  {
    id: 'perfect_round',
    name: 'Perfect Round',
    description: 'Auto-correct the next 5 questions',
    icon: '✨',
    cost: 500,
    type: 'powerup',
    quantity: 1,
    maxInventory: 2,
    category: 'legendary',
    effect: { type: 'autoCorrect', value: 5 },
    requirements: { minLevel: 5 }
  },
  {
    id: 'time_warp',
    name: 'Time Warp',
    description: 'Timer resets to full on each question for 1 quiz',
    icon: '🌀',
    cost: 400,
    type: 'powerup',
    quantity: 1,
    maxInventory: 2,
    category: 'legendary',
    effect: { type: 'resetTimer', value: 1 },
    requirements: { minLevel: 5 }
  },
  {
    id: 'wisdom_sahaba',
    name: 'Wisdom of Sahaba',
    description: '50% chance to show the correct answer highlighted',
    icon: '🌟',
    cost: 350,
    type: 'powerup',
    quantity: 1,
    maxInventory: 3,
    category: 'legendary',
    effect: { type: 'probabilityHint', value: 0.5 },
    requirements: { minLevel: 3 }
  },
  {
    id: 'barakah_boost',
    name: 'Barakah Boost',
    description: 'Earn +50% XP for the next complete quiz',
    icon: '🌙',
    cost: 300,
    type: 'powerup',
    quantity: 1,
    maxInventory: 3,
    category: 'legendary',
    effect: { type: 'xpMultiplier', value: 1.5 },
    requirements: { minLevel: 3 }
  },
  {
    id: 'divine_guidance',
    name: 'Divine Guidance',
    description: 'Eliminate 1 wrong answer every question for 1 quiz',
    icon: '🤲',
    cost: 450,
    type: 'powerup',
    quantity: 1,
    maxInventory: 2,
    category: 'legendary',
    effect: { type: 'eliminateWrong', value: 1 },
    requirements: { minLevel: 4 }
  }
];

// Boosters (Temporary effects that last for a duration)
export const BOOSTERS: StoreItem[] = [
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: '+10% XP from all quizzes for 1 hour',
    icon: '📖',
    cost: 100,
    type: 'booster',
    quantity: 1,
    maxInventory: 5,
    category: 'basic',
    effect: { type: 'xpBonus', value: 0.1, duration: 3600 }
  },
  {
    id: 'fast_learner',
    name: 'Fast Learner',
    description: '-20% time limits for 30 minutes',
    icon: '⚡',
    cost: 150,
    type: 'booster',
    quantity: 1,
    maxInventory: 5,
    category: 'premium',
    effect: { type: 'timeReduction', value: 0.2, duration: 1800 }
  },
  {
    id: 'blessed_streak',
    name: 'Blessed Streak',
    description: 'Streak break protection for 1 quiz (1 wrong allowed)',
    icon: '🍀',
    cost: 200,
    type: 'booster',
    quantity: 1,
    maxInventory: 3,
    category: 'premium',
    effect: { type: 'streakProtection', value: 1, duration: 0 }
  },
  {
    id: 'scholars_aura',
    name: 'Scholar\'s Aura',
    description: 'Daily rewards doubled for 24 hours',
    icon: '👑',
    cost: 250,
    type: 'booster',
    quantity: 1,
    maxInventory: 3,
    category: 'legendary',
    effect: { type: 'dailyBonus', value: 2, duration: 86400 },
    requirements: { minLevel: 4 }
  },
  {
    id: 'hafiz_memory',
    name: 'Hafiz Memory',
    description: '+5 seconds per question for 1 hour',
    icon: '🧠',
    cost: 120,
    type: 'booster',
    quantity: 1,
    maxInventory: 5,
    category: 'premium',
    effect: { type: 'timeBonus', value: 5, duration: 3600 }
  }
];

// Protection Items
export const PROTECTION_ITEMS: StoreItem[] = [
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Maintain daily streak if you miss 1 day',
    icon: '🧊',
    cost: 200,
    type: 'protection',
    quantity: 1,
    maxInventory: 3,
    category: 'premium',
    effect: { type: 'freezeStreak', value: 1 }
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'Auto-activate to protect streak (lasts 24h)',
    icon: '🛡️',
    cost: 350,
    type: 'protection',
    quantity: 1,
    maxInventory: 2,
    category: 'legendary',
    effect: { type: 'autoStreakProtection', value: 1, duration: 86400 },
    requirements: { minLevel: 5 }
  }
];

// All store items combined
export const ALL_STORE_ITEMS: StoreItem[] = [
  ...BASIC_POWERUPS,
  ...PREMIUM_POWERUPS,
  ...LEGENDARY_POWERUPS,
  ...BOOSTERS,
  ...PROTECTION_ITEMS
];

// Get items by category
export function getStoreItemsByCategory(category: StoreItem['category']): StoreItem[] {
  return ALL_STORE_ITEMS.filter(item => item.category === category);
}

// Get items by type
export function getStoreItemsByType(type: StoreItem['type']): StoreItem[] {
  return ALL_STORE_ITEMS.filter(item => item.type === type);
}

// Get item by ID
export function getStoreItemById(id: string): StoreItem | undefined {
  return ALL_STORE_ITEMS.find(item => item.id === id);
}

// Check if user meets requirements to buy item
export function meetsRequirements(
  item: StoreItem,
  userLevel: number,
  achievements: string[],
  categoryMastery: Record<string, number>
): boolean {
  if (!item.requirements) return true;

  const { minLevel, achievementId, categoryMastery: masteryCategory } = item.requirements;

  if (minLevel && userLevel < minLevel) return false;
  if (achievementId && !achievements.includes(achievementId)) return false;
  if (masteryCategory && (categoryMastery[masteryCategory] || 0) < 90) return false;

  return true;
}

// Calculate discounted price (for future promotions)
export function getItemPrice(item: StoreItem, discountPercent: number = 0): number {
  if (discountPercent <= 0) return item.cost;
  return Math.ceil(item.cost * (1 - discountPercent / 100));
}
