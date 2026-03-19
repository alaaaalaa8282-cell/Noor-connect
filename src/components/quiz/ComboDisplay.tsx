/**
 * Combo Display Component
 * Shows combo counter with animated visual effects
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizStore } from '@/lib/quiz-store';
import { ComboState } from '@/data/quiz-store-data';
import { Flame, TrendingUp, Zap } from 'lucide-react';

interface ComboDisplayProps {
  combo: number;
  multiplier: number;
  isActive: boolean;
}

export function ComboDisplay({ combo, multiplier, isActive }: ComboDisplayProps) {
  const [showReward, setShowReward] = useState(false);
  const [rewardText, setRewardText] = useState('');

  useEffect(() => {
    // Show reward notification at combo milestones
    if (combo > 0 && combo % 10 === 0) {
      setRewardText(`🔥 ${combo} COMBO! Free Power-Up!`);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    } else if (combo === 5 || combo === 15 || combo === 20) {
      const rewards: Record<number, string> = {
        5: '+10 XP Bonus!',
        15: '+50 XP + Skip Power-Up!',
        20: '+100 XP Bonus!'
      };
      setRewardText(rewards[combo] || '');
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    }
  }, [combo]);

  if (!isActive && combo === 0) return null;

  // Calculate flame intensity based on combo
  const flameIntensity = Math.min(combo / 30, 1);
  const flameScale = 1 + flameIntensity * 0.5;

  return (
    <div className="relative">
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -80 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-50"
          >
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              {rewardText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex items-center gap-3"
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          repeat: isActive ? Infinity : 0,
          repeatDelay: 0.5
        }}
      >
        {/* Combo Counter */}
        <div className="relative">
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg"
            animate={{
              boxShadow: isActive
                ? [
                    '0 0 0 0 rgba(249, 115, 22, 0)',
                    '0 0 20px 5px rgba(249, 115, 22, 0.3)',
                    '0 0 0 0 rgba(249, 115, 22, 0)'
                  ]
                : '0 0 0 0 rgba(249, 115, 22, 0)'
            }}
            transition={{
              duration: 1,
              repeat: isActive ? Infinity : 0
            }}
          >
            <motion.div
              animate={{
                scale: [1, flameScale, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.2
              }}
            >
              <Flame className="w-5 h-5" />
            </motion.div>
            <span className="font-bold text-lg">{combo}</span>
            <span className="text-sm opacity-90">combo</span>
          </motion.div>

          {/* Flame particles effect */}
          {isActive && combo >= 10 && (
            <div className="absolute -top-1 -right-1">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  opacity: [1, 0, 1],
                  scale: [1, 0.5, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity
                }}
                className="text-orange-400"
              >
                🔥
              </motion.div>
            </div>
          )}
        </div>

        {/* Multiplier Badge */}
        {multiplier > 1 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full shadow-md"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold">{multiplier.toFixed(1)}x</span>
          </motion.div>
        )}
      </motion.div>

      {/* Progress to next milestone */}
      {combo > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Next milestone: {Math.ceil((combo + 1) / 5) * 5}</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${((combo % 5) / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for using combo in quiz
export function useCombo() {
  const [comboState, setComboState] = useState<ComboState>({
    currentCombo: 0,
    maxCombo: 0,
    comboMultiplier: 1,
    lastAnswerTime: 0,
    isActive: false
  });

  useEffect(() => {
    // Load initial state
    setComboState(quizStore.getComboState());
  }, []);

  const updateCombo = (isCorrect: boolean) => {
    const newState = quizStore.updateCombo(isCorrect);
    setComboState(newState);
    return newState;
  };

  const resetCombo = () => {
    quizStore.resetCombo();
    setComboState(quizStore.getComboState());
  };

  const getMultiplier = () => {
    return quizStore.getCurrentMultiplier();
  };

  return {
    combo: comboState.currentCombo,
    maxCombo: comboState.maxCombo,
    multiplier: comboState.comboMultiplier,
    isActive: comboState.isActive,
    updateCombo,
    resetCombo,
    getMultiplier
  };
}
