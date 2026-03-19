/**
 * Lives System - Create scarcity and retention
 * Users have limited lives that regenerate over time
 */

import { quizStore } from '@/lib/quiz-store';

const LIVES_KEY = 'quiz-lives-system';
const MAX_LIVES = 5;
const REGENERATION_MINUTES = 30; // 1 life every 30 minutes
const REFILL_COST = 100; // XP cost to refill all lives

export interface LivesState {
  currentLives: number;
  maxLives: number;
  lastRegenerationTime: string;
  totalLivesUsed: number;
  totalRefills: number;
}

export class LivesSystem {
  private static instance: LivesSystem;

  static getInstance(): LivesSystem {
    if (!LivesSystem.instance) {
      LivesSystem.instance = new LivesSystem();
    }
    return LivesSystem.instance;
  }

  private getState(): LivesState {
    const saved = localStorage.getItem(LIVES_KEY);
    if (saved) {
      return { ...this.getDefaultState(), ...JSON.parse(saved) };
    }
    return this.getDefaultState();
  }

  private getDefaultState(): LivesState {
    return {
      currentLives: MAX_LIVES,
      maxLives: MAX_LIVES,
      lastRegenerationTime: new Date().toISOString(),
      totalLivesUsed: 0,
      totalRefills: 0
    };
  }

  private saveState(state: LivesState): void {
    localStorage.setItem(LIVES_KEY, JSON.stringify(state));
  }

  // Calculate regenerated lives based on time passed
  private calculateRegeneratedLives(state: LivesState): number {
    const now = new Date();
    const lastRegen = new Date(state.lastRegenerationTime);
    const minutesPassed = (now.getTime() - lastRegen.getTime()) / (1000 * 60);
    const livesToAdd = Math.floor(minutesPassed / REGENERATION_MINUTES);
    
    return Math.min(livesToAdd, state.maxLives - state.currentLives);
  }

  // Get current lives (with regeneration)
  getCurrentLives(): number {
    const state = this.getState();
    const regenerated = this.calculateRegeneratedLives(state);
    
    if (regenerated > 0) {
      state.currentLives = Math.min(state.currentLives + regenerated, state.maxLives);
      state.lastRegenerationTime = new Date().toISOString();
      this.saveState(state);
    }
    
    return state.currentLives;
  }

  // Get max lives
  getMaxLives(): number {
    return this.getState().maxLives;
  }

  // Check if user has lives
  hasLives(): boolean {
    return this.getCurrentLives() > 0;
  }

  // Use one life
  useLife(): boolean {
    const state = this.getState();
    
    // Refresh state first
    const regenerated = this.calculateRegeneratedLives(state);
    if (regenerated > 0) {
      state.currentLives = Math.min(state.currentLives + regenerated, state.maxLives);
      state.lastRegenerationTime = new Date().toISOString();
    }
    
    if (state.currentLives <= 0) {
      this.saveState(state);
      return false;
    }
    
    state.currentLives--;
    state.totalLivesUsed++;
    this.saveState(state);
    
    return true;
  }

  // Get time until next life regeneration
  getTimeUntilNextLife(): string {
    const state = this.getState();
    const now = new Date();
    const lastRegen = new Date(state.lastRegenerationTime);
    const minutesPassed = (now.getTime() - lastRegen.getTime()) / (1000 * 60);
    const minutesUntilNext = REGENERATION_MINUTES - (minutesPassed % REGENERATION_MINUTES);
    
    if (minutesUntilNext <= 0 || state.currentLives >= state.maxLives) {
      return '00:00';
    }
    
    const hours = Math.floor(minutesUntilNext / 60);
    const minutes = Math.floor(minutesUntilNext % 60);
    
    return hours > 0 
      ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
      : `${minutes.toString().padStart(2, '0')}m`;
  }

  // Refill all lives using XP
  refillLivesWithXP(): { success: boolean; message?: string } {
    const state = this.getState();
    
    if (state.currentLives >= state.maxLives) {
      return { success: false, message: 'Lives already full!' };
    }
    
    const spent = quizStore.spendXP(REFILL_COST, 'Life Refill');
    if (!spent) {
      return { success: false, message: `Need ${REFILL_COST} XP to refill` };
    }
    
    state.currentLives = state.maxLives;
    state.totalRefills++;
    this.saveState(state);
    
    return { success: true, message: 'Lives refilled!' };
  }

  // Add extra life (from rewards, gifts, etc.)
  addExtraLife(): boolean {
    const state = this.getState();
    if (state.currentLives < state.maxLives) {
      state.currentLives++;
      this.saveState(state);
      return true;
    }
    return false;
  }

  // Get lives progress for UI (0-100)
  getLivesProgress(): number {
    return (this.getCurrentLives() / this.getMaxLives()) * 100;
  }

  // Get loss aversion message based on lives
  getLossAversionMessage(): string | null {
    const lives = this.getCurrentLives();
    
    if (lives === 1) {
      return '⚠️ LAST LIFE! Play carefully...';
    } else if (lives === 2) {
      return '2 lives remaining. Refill in ' + this.getTimeUntilNextLife();
    } else if (lives <= MAX_LIVES * 0.5) {
      return `${lives} lives left. Next life in ${this.getTimeUntilNextLife()}`;
    }
    
    return null;
  }

  // Check if lives are critically low (for notifications)
  isCritical(): boolean {
    return this.getCurrentLives() <= 2;
  }

  // Get stats
  getStats(): { totalUsed: number; totalRefills: number } {
    const state = this.getState();
    return {
      totalUsed: state.totalLivesUsed,
      totalRefills: state.totalRefills
    };
  }

  // Reset all lives (for testing)
  resetLives(): void {
    localStorage.removeItem(LIVES_KEY);
  }
}

export const livesSystem = LivesSystem.getInstance();
