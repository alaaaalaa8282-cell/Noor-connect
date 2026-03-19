# Enhanced Islamic Quiz - Full Implementation Plan

## Overview
Transform the current quiz system into a more engaging, gamified experience with a **Power-Up Store** where users spend XP to buy power-ups, new game modes, combo systems, daily challenges, and visual effects.

---

## Phase 1: Power-Up Store System 💰

### 1.1 Store Data Structure
```typescript
interface StoreItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number; // XP cost
  type: 'powerup' | 'booster' | 'cosmetic';
  quantity: number; // How many you get per purchase
  maxInventory: number; // Max you can hold
  category: 'basic' | 'premium' | 'legendary';
}

interface UserInventory {
  items: Record<string, number>; // itemId -> quantity
  activeBoosters: string[]; // Currently active boosters
  purchasedHistory: PurchaseRecord[];
}

interface PurchaseRecord {
  itemId: string;
  cost: number;
  purchasedAt: string;
}
```

### 1.2 Store Items Catalog

#### Basic Power-ups (Affordable)
| Item | Cost (XP) | Effect | Max Inventory |
|------|-----------|--------|---------------|
| 50:50 | 50 XP | Remove 2 wrong answers | 10 |
| Extra Time | 40 XP | +30 seconds | 10 |
| Hint | 30 XP | Show helpful clue | 15 |
| Skip | 60 XP | Skip current question | 5 |

#### Premium Power-ups (Mid-range)
| Item | Cost (XP) | Effect | Max Inventory |
|------|-----------|--------|---------------|
| Double Points | 150 XP | 2x points for next 3 questions | 5 |
| Freeze Time | 120 XP | Pause timer for 15 seconds | 5 |
| Second Chance | 200 XP | Wrong answer doesn't break streak | 3 |
| Category Expert | 180 XP | All answers shown from correct category | 3 |

#### Legendary Power-ups (Expensive)
| Item | Cost (XP) | Effect | Max Inventory |
|------|-----------|--------|---------------|
| Perfect Round | 500 XP | Auto-correct next 5 questions | 2 |
| Time Warp | 400 XP | Reset timer to full on each question for 1 quiz | 2 |
| Wisdom of Sahaba | 350 XP | 50% chance to show correct answer highlight | 3 |
| Barakah Boost | 300 XP | +50% XP earned for next quiz | 3 |

#### Boosters (Temporary Effects)
| Booster | Cost (XP) | Duration | Effect |
|---------|-----------|----------|--------|
| Knowledge Seeker | 100 XP | 1 hour | +10% XP from all quizzes |
| Fast Learner | 150 XP | 30 min | -20% time limits |
| Blessed Streak | 200 XP | 1 quiz | Streak break protection (1 wrong answer allowed) |
| Scholar's Aura | 250 XP | 24 hours | Daily rewards doubled |

### 1.3 Store Manager (`src/lib/quiz-store.ts`)
```typescript
export class QuizStore {
  // Purchase item with XP
  purchaseItem(itemId: string): boolean;
  
  // Get user's inventory
  getInventory(): UserInventory;
  
  // Use an item from inventory
  useItem(itemId: string): boolean;
  
  // Get available store items with user's current inventory status
  getStoreItems(): StoreItem[];
  
  // Check if user can afford item
  canAfford(cost: number): boolean;
  
  // Get purchase history
  getPurchaseHistory(): PurchaseRecord[];
}
```

---

## Phase 2: New Quiz Game Modes 🎮

### 2.1 Time Attack Mode ⏱️
- **Concept**: Answer as many questions as possible in 2 minutes
- **Scoring**: Base points + speed bonus (faster = more points)
- **Combo**: Each correct answer adds +2 seconds to timer
- **Leaderboard**: Track personal best scores
- **Rewards**: Bonus XP for every 10 correct answers

### 2.2 Survival Mode ☠️
- **Concept**: Endless questions, one life, increasing difficulty
- **Mechanics**:
  - Start with easy questions
  - Every 5 correct answers = difficulty increases
  - One wrong answer = game over
  - Time per question decreases as you progress
- **Rewards**: Exponential XP scaling (question 1 = 10 XP, question 50 = 500 XP)
- **Checkpoints**: Every 10 questions grants a checkpoint power-up

### 2.3 Daily Challenge Mode 📅
- **Concept**: Special challenge every day with unique rules
- **Challenge Types**:
  1. **Category Focus**: Only questions from one category
  2. **Speed Run**: Answer 20 questions as fast as possible
  3. **No Power-ups**: Pure knowledge test with 2x XP reward
  4. **Hard Mode**: Only hard questions, 3x XP reward
  5. **Mystery Mix**: Random categories, random difficulties
- **Rewards**: Daily completion = 100 XP + random power-up
- **Streak**: 7-day streak = 500 XP bonus + legendary power-up

### 2.4 Category Mastery Mode 🏆
- **Concept**: Master each category to unlock special rewards
- **Progression**:
  - Bronze: 50% accuracy in category
  - Silver: 70% accuracy in category
  - Gold: 90% accuracy in category
  - Platinum: 100 questions correct in category
- **Unlocks**: Platinum mastery unlocks legendary power-ups for that category

---

## Phase 3: Combo & Streak System 🔥

### 3.1 Combo Mechanics
```typescript
interface ComboState {
  currentCombo: number;
  maxCombo: number;
  comboMultiplier: number;
  lastAnswerTime: number; // For time-based combos
}
```

- **Combo Multiplier**: Every 3 correct answers = +0.1x multiplier
- **Max Multiplier**: 3x (at 30 correct answers in a row)
- **Visual Feedback**: Combo counter with flame animation
- **Combo Break**: Wrong answer or time out breaks combo
- **Combo Reward**: Every 10 combo = free random power-up

### 3.2 Streak System Enhancements
- **Daily Streak**: Already implemented, add streak protection items
- **Quiz Streak**: Consecutive correct answers in a single quiz
- **Streak Rewards**:
  - 5 streak: +10 XP bonus
  - 10 streak: +25 XP + 1 hint power-up
  - 15 streak: +50 XP + 1 skip power-up
  - 20+ streak: +100 XP + random premium power-up

### 3.3 Streak Protection
- **Second Chance Power-up**: One wrong answer doesn't break streak
- **Daily Shield**: Purchasable item protects daily streak for 1 day of inactivity
- **Streak Freeze**: Automatically maintains streak if user misses 1 day (cost: 200 XP)

---

## Phase 4: Visual Effects & Animations ✨

### 4.1 Answer Feedback
- **Correct Answer**:
  - Green flash + checkmark animation
  - Particles/confetti for streak milestones
  - Screen shake for 10+ combo
  - XP gain floating animation
- **Wrong Answer**:
  - Red shake animation
  - Glass crack effect (non-intrusive)
  - Gentle haptic feedback (mobile)

### 4.2 Power-up Effects
- **50:50**: Two wrong answers fade out with poof animation
- **Extra Time**: Clock spins and gains golden glow
- **Double Points**: Numbers turn gold with sparkle effect
- **Freeze Time**: Everything turns blue/icy with particle freeze effect

### 4.3 Achievement Unlocks
- **Popup**: Slide-in from top with golden glow
- **Sound**: Gentle notification sound
- **Animation**: Trophy spins, confetti bursts
- **Persistence**: Achievement stays visible for 5 seconds

### 4.4 Combo Visuals
- **Counter**: Large number with pulsing animation
- **Flames**: Fire effect that grows with combo
- **Background**: Subtle gradient shift based on combo level

---

## Phase 5: Daily Rewards System 🎁

### 5.1 Daily Login Rewards
```
Day 1: 50 XP
Day 2: 75 XP + 1x 50:50
Day 3: 100 XP + 1x Hint
Day 4: 125 XP + 1x Extra Time
Day 5: 150 XP + 1x Skip
Day 6: 200 XP + 1x Double Points
Day 7: 300 XP + 1x Legendary Power-up (random)
```

### 5.2 Daily Challenges
- **New Challenge Every Day**: 00:00 local time
- **Challenge Notifications**: Reminder if not completed by 20:00
- **Completion Streak**: Track consecutive days of completing daily challenge

---

## Phase 6: Quiz History & Stats 📊

### 6.1 Quiz History
```typescript
interface QuizSession {
  id: string;
  date: string;
  mode: 'classic' | 'timeAttack' | 'survival' | 'daily';
  score: number;
  totalQuestions: number;
  accuracy: number;
  xpEarned: number;
  maxCombo: number;
  powerUpsUsed: string[];
  categories: string[];
  timeSpent: number;
}
```

### 6.2 Statistics Dashboard
- **Overall Stats**: Total XP, quizzes played, accuracy rate
- **Category Breakdown**: Performance per category with visual charts
- **Progress Over Time**: Line graph of XP/level progression
- **Best Performances**: Personal records for each mode
- **Power-up Usage**: Most/least used power-ups

---

## Phase 7: UI Components 📱

### 7.1 Store Component (`src/components/quiz/QuizStore.tsx`)
- **Layout**: Grid of cards with item details
- **Categories**: Tabs for Basic/Premium/Legendary/Boosters
- **XP Display**: Top bar showing current XP
- **Purchase Flow**: Confirm dialog + success animation
- **Inventory**: Badge showing owned quantity on each item

### 7.2 Game Mode Selector (`src/components/quiz/GameModeSelector.tsx`)
- **Cards**: Visual cards for each game mode
- **Descriptions**: Brief explanation of each mode
- **High Scores**: Personal best displayed on each mode card
- **Daily Challenge**: Special highlight for today's challenge

### 7.3 Combo Display (`src/components/quiz/ComboDisplay.tsx`)
- **Counter**: Large animated number
- **Multiplier**: Shows current XP multiplier
- **Progress**: Visual bar to next milestone
- **Effects**: Flame/particle animations

### 7.4 Daily Rewards Panel (`src/components/quiz/DailyRewards.tsx`)
- **Calendar**: 7-day grid showing claimed/unclaimed days
- **Current Day**: Highlighted with pulse animation
- **Claim Button**: Animated claim action
- **Streak Counter**: Days completed in current streak

### 7.5 Quiz History (`src/components/quiz/QuizHistory.tsx`)
- **List View**: Scrollable list of past quizzes
- **Filter**: By date, mode, category
- **Details**: Expandable cards with full stats
- **Share**: Option to share achievements

---

## Phase 8: Data & State Management 🗄️

### 8.1 Storage Keys
```typescript
const STORAGE_KEYS = {
  QUIZ_STATS: 'enhanced-quiz-stats',
  POWER_UPS: 'quiz-power-ups',
  ACHIEVEMENTS: 'quiz-achievements',
  INVENTORY: 'quiz-inventory',              // NEW
  STORE_ITEMS: 'quiz-store-items',          // NEW
  PURCHASE_HISTORY: 'quiz-purchase-history', // NEW
  DAILY_CHALLENGE: 'quiz-daily-challenge',  // NEW
  DAILY_REWARDS: 'quiz-daily-rewards',      // NEW
  QUIZ_HISTORY: 'quiz-history',             // NEW
  COMBO_STATE: 'quiz-combo-state',          // NEW
  ACTIVE_BOOSTERS: 'quiz-active-boosters',  // NEW
};
```

### 8.2 Quiz State Manager Updates
Add to existing `quiz-manager.ts`:
```typescript
// Inventory management
spendXP(amount: number): boolean;
addXP(amount: number, source: string): void;

// Combo tracking
updateCombo(isCorrect: boolean): ComboState;
getComboState(): ComboState;
resetCombo(): void;

// History tracking
saveQuizSession(session: QuizSession): void;
getQuizHistory(): QuizSession[];

// Daily challenge
getDailyChallenge(): DailyChallenge;
completeDailyChallenge(): void;
getDailyRewardStatus(): DailyRewardStatus;
claimDailyReward(): boolean;

// Boosters
activateBooster(boosterId: string): boolean;
getActiveBoosters(): string[];
checkBoosterExpiry(): void;
```

---

## Phase 9: Implementation Order 📝

### Week 1: Foundation
1. **Day 1-2**: Create store data structures and `QuizStore` class
2. **Day 3-4**: Build Store UI component with basic power-ups
3. **Day 5**: Integrate store with existing quiz flow
4. **Day 6-7**: Add XP spending/earning logic

### Week 2: Game Modes
1. **Day 1-2**: Implement Time Attack mode
2. **Day 3-4**: Implement Survival mode
3. **Day 5**: Implement Daily Challenge system
4. **Day 6-7**: Create Game Mode Selector UI

### Week 3: Fun Features
1. **Day 1-2**: Build Combo system with visual feedback
2. **Day 3-4**: Implement Daily Rewards system
3. **Day 5-6**: Add new premium/legendary power-ups
4. **Day 7**: Polish power-up effects and animations

### Week 4: Polish & History
1. **Day 1-2**: Create Quiz History tracking
2. **Day 3-4**: Build Statistics Dashboard
3. **Day 5-6**: Add visual effects and animations
4. **Day 7**: Testing, bug fixes, and optimization

---

## Phase 10: XP Economy Balance 💎

### XP Sources
| Action | XP Reward |
|--------|-----------|
| Correct Answer (Easy) | 10 XP |
| Correct Answer (Medium) | 20 XP |
| Correct Answer (Hard) | 30 XP |
| 5 Streak | +10 XP |
| 10 Streak | +25 XP |
| Perfect Quiz (100%) | +50 XP |
| Daily Challenge Complete | 100 XP |
| Time Attack (per question) | 15 XP + speed bonus |
| Survival Mode | Progressive (10-500 XP) |
| New Achievement | 50-500 XP |

### XP Sinks (Store Purchases)
- Basic power-ups: 30-60 XP
- Premium power-ups: 120-200 XP
- Legendary power-ups: 300-500 XP
- Boosters: 100-250 XP
- Streak protection: 200 XP

### Balance Goals
- User should be able to buy 1-2 basic power-ups per quiz
- Premium power-ups require saving XP over 3-5 quizzes
- Legendary power-ups are rare rewards for dedicated players
- XP should feel valuable but not scarce

---

## Files to Create/Modify

### New Files
```
src/
├── lib/
│   ├── quiz-store.ts          # Store management
│   ├── quiz-combo.ts          # Combo system
│   └── quiz-daily.ts          # Daily challenges & rewards
├── components/quiz/
│   ├── QuizStore.tsx          # Store UI
│   ├── GameModeSelector.tsx   # Mode selection
│   ├── ComboDisplay.tsx       # Combo counter
│   ├── DailyRewards.tsx       # Daily rewards panel
│   ├── QuizHistory.tsx        # History list
│   ├── TimeAttackMode.tsx     # Time attack implementation
│   ├── SurvivalMode.tsx       # Survival mode implementation
│   ├── PowerUpEffect.tsx      # Power-up animations
│   └── AchievementPopup.tsx   # Achievement notifications
└── data/
    └── store-items.ts         # Store item catalog
```

### Modified Files
```
src/
├── lib/
│   └── quiz-manager.ts        # Add inventory & combo methods
├── data/
│   └── enhanced-quiz-data.ts  # Add new types
├── pages/
│   └── EnhancedIslamicQuiz.tsx # Add store & modes
└── App.tsx                    # Add new routes if needed
```

---

## Success Metrics

1. **Engagement**: Users play 3+ quizzes per week
2. **Store Usage**: 60%+ of users purchase at least 1 power-up
3. **Retention**: 40%+ return for daily challenges
4. **Progression**: Average user reaches level 5 within 2 weeks
5. **Fun Factor**: Combo system makes users feel accomplished

---

## Next Steps

1. **Review this plan** with user feedback
2. **Start Phase 1** (Store System) - highest priority
3. **Test XP economy** with mock data
4. **Gather feedback** after each phase
5. **Iterate** based on user engagement
