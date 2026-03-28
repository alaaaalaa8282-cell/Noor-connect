/**
 * Mystery Box / Loot Box System
 * Users can open boxes for random rewards
 */

import { StoreItem } from '@/data/quiz-store-data';
import { ALL_STORE_ITEMS } from '@/data/store-catalog';
import { quizStore } from '@/lib/quiz-store';

export interface MysteryBox {
  id: string;
  name: string;
  description: string;
  cost: number; // XP cost
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  drops: BoxDrop[];
}

export interface BoxDrop {
  itemId: string;
  quantity: number;
  probability: number; // 0-100
}

export interface BoxOpeningResult {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: string;
  icon: string;
}

// Mystery Box Types
export const MYSTERY_BOXES: MysteryBox[] = [
  {
    id: 'basic_box',
    name: 'Knowledge Box',
    description: 'Contains basic power-ups and small XP rewards',
    cost: 100,
    icon: '📦',
    rarity: 'common',
    drops: [
      { itemId: 'hint', quantity: 1, probability: 40 },
      { itemId: 'extra_time', quantity: 1, probability: 30 },
      { itemId: 'fifty_fifty', quantity: 1, probability: 20 },
      { itemId: 'xp_50', quantity: 1, probability: 10 } // Special XP drop
    ]
  },
  {
    id: 'premium_box',
    name: 'Wisdom Chest',
    description: 'Better rewards including premium items',
    cost: 250,
    icon: '💎',
    rarity: 'rare',
    drops: [
      { itemId: 'double_points', quantity: 1, probability: 35 },
      { itemId: 'freeze_time', quantity: 1, probability: 25 },
      { itemId: 'skip', quantity: 1, probability: 20 },
      { itemId: 'hint', quantity: 3, probability: 15 },
      { itemId: 'xp_150', quantity: 1, probability: 5 }
    ]
  },
  {
    id: 'legendary_box',
    name: 'Prophet\'s Treasure',
    description: 'Legendary items and massive XP rewards',
    cost: 500,
    icon: '👑',
    rarity: 'epic',
    drops: [
      { itemId: 'perfect_round', quantity: 1, probability: 30 },
      { itemId: 'barakah_boost', quantity: 1, probability: 25 },
      { itemId: 'wisdom_sahaba', quantity: 1, probability: 20 },
      { itemId: 'double_points', quantity: 2, probability: 15 },
      { itemId: 'xp_400', quantity: 1, probability: 8 },
      { itemId: 'divine_guidance', quantity: 1, probability: 2 }
    ]
  },
  {
    id: 'daily_free_box',
    name: 'Daily Gift',
    description: 'Free daily reward box',
    cost: 0,
    icon: '🎁',
    rarity: 'common',
    drops: [
      { itemId: 'hint', quantity: 1, probability: 50 },
      { itemId: 'extra_time', quantity: 1, probability: 30 },
      { itemId: 'fifty_fifty', quantity: 1, probability: 15 },
      { itemId: 'xp_25', quantity: 1, probability: 5 }
    ]
  }
];

// XP Drop items (virtual items that give XP directly)
export const XP_DROPS: Record<string, number> = {
  'xp_25': 25,
  'xp_50': 50,
  'xp_150': 150,
  'xp_400': 400
};

export class MysteryBoxSystem {
  private static instance: MysteryBoxSystem;

  static getInstance(): MysteryBoxSystem {
    if (!MysteryBoxSystem.instance) {
      MysteryBoxSystem.instance = new MysteryBoxSystem();
    }
    return MysteryBoxSystem.instance;
  }

  // Get all available boxes
  getBoxes(): MysteryBox[] {
    return MYSTERY_BOXES;
  }

  // Check if user can claim free daily box
  canClaimDailyBox(): boolean {
    const lastClaim = localStorage.getItem('mystery-box-last-claim');
    if (!lastClaim) return true;

    const lastDate = new Date(lastClaim);
    const now = new Date();
    
    // Check if it's a different day (not just 24 hours)
    const lastDay = lastDate.toDateString();
    const currentDay = now.toDateString();
    
    return lastDay !== currentDay;
  }

  // Get time until next free box
  getTimeUntilNextBox(): string {
    const lastClaim = localStorage.getItem('mystery-box-last-claim');
    if (!lastClaim || this.canClaimDailyBox()) return '00:00:00';

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of next day
    
    const diff = tomorrow.getTime() - now.getTime();

    if (diff <= 0) return '00:00:00';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Open a mystery box
  openBox(boxId: string): { success: boolean; results?: BoxOpeningResult[]; message?: string } {
    const box = MYSTERY_BOXES.find(b => b.id === boxId);
    if (!box) {
      return { success: false, message: 'Box not found' };
    }

    // Check if it's the daily free box
    if (boxId === 'daily_free_box') {
      if (!this.canClaimDailyBox()) {
        return { success: false, message: 'Daily box already claimed' };
      }
      localStorage.setItem('mystery-box-last-claim', new Date().toISOString());
    } else {
      // Spend XP for paid boxes
      const spent = quizStore.spendXP(box.cost, `Mystery Box: ${box.name}`);
      if (!spent) {
        return { success: false, message: 'Not enough XP' };
      }
    }

    // Determine drops
    const results: BoxOpeningResult[] = [];
    const numDrops = box.rarity === 'legendary' ? 3 : box.rarity === 'epic' ? 2 : 1;

    for (let i = 0; i < numDrops; i++) {
      const drop = this.rollDrop(box.drops);
      if (drop) {
        // Check if it's an XP drop
        if (XP_DROPS[drop.itemId]) {
          const xpAmount = XP_DROPS[drop.itemId];
          quizStore.addXP(xpAmount, 'Mystery Box XP Drop');
          results.push({
            itemId: drop.itemId,
            itemName: `${xpAmount} XP`,
            quantity: xpAmount,
            rarity: 'xp',
            icon: '✨'
          });
        } else {
          // It's a regular item
          const item = ALL_STORE_ITEMS.find(i => i.id === drop.itemId);
          if (item) {
            quizStore.addToInventory(item.id, drop.quantity);
            results.push({
              itemId: item.id,
              itemName: item.name,
              quantity: drop.quantity,
              rarity: item.category,
              icon: item.icon
            });
          }
        }
      }
    }

    // Record opening
    this.recordBoxOpening(boxId, results);

    return { success: true, results };
  }

  // Roll a drop based on probabilities
  private rollDrop(drops: BoxDrop[]): BoxDrop | null {
    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const drop of drops) {
      cumulative += drop.probability;
      if (roll <= cumulative) {
        return drop;
      }
    }

    // Fallback to first drop
    return drops[0] || null;
  }

  // Record box opening history
  private recordBoxOpening(boxId: string, results: BoxOpeningResult[]): void {
    const history = this.getBoxHistory();
    history.unshift({
      boxId,
      openedAt: new Date().toISOString(),
      results
    });

    // Keep only last 50 openings
    if (history.length > 50) {
      history.pop();
    }

    localStorage.setItem('mystery-box-history', JSON.stringify(history));
  }

  // Get box opening history
  getBoxHistory(): Array<{ boxId: string; openedAt: string; results: BoxOpeningResult[] }> {
    const saved = localStorage.getItem('mystery-box-history');
    return saved ? JSON.parse(saved) : [];
  }

  // Get total boxes opened
  getTotalBoxesOpened(): number {
    return this.getBoxHistory().length;
  }

  // Get best drop ever
  getBestDrop(): BoxOpeningResult | null {
    const history = this.getBoxHistory();
    let best: BoxOpeningResult | null = null;

    for (const entry of history) {
      for (const result of entry.results) {
        if (!best || this.getRarityValue(result.rarity) > this.getRarityValue(best.rarity)) {
          best = result;
        }
      }
    }

    return best;
  }

  private getRarityValue(rarity: string): number {
    const values: Record<string, number> = {
      'xp': 1,
      'basic': 2,
      'premium': 3,
      'legendary': 4,
      'epic': 5
    };
    return values[rarity] || 0;
  }
}

export const mysteryBoxSystem = MysteryBoxSystem.getInstance();
