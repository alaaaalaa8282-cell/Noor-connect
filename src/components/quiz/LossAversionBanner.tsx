/**
 * Loss Aversion Banner
 * Displays urgent messages to create FOMO and retention
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { psychologicalHooks, LossAversionMessage } from '@/lib/psychological-hooks';
import { X, AlertTriangle, Clock } from 'lucide-react';

interface LossAversionBannerProps {
  onAction?: (type: string) => void;
  dismissible?: boolean;
}

export function LossAversionBanner({ onAction, dismissible = true }: LossAversionBannerProps) {
  const [message, setMessage] = useState<LossAversionMessage | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMessage = () => {
      if (!dismissed) {
        const urgent = psychologicalHooks.getMostUrgentMessage();
        setMessage(urgent);
      }
    };

    checkMessage();
    const interval = setInterval(checkMessage, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setMessage(null);
  };

  const handleAction = () => {
    if (message) {
      onAction?.(message.type);
    }
  };

  if (!message || dismissed) return null;

  const urgencyVariants: Record<string, any> = {
    critical: { 
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
    },
    high: {
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity }
    },
    medium: {},
    low: {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="sticky top-0 z-50"
      >
        <motion.div
          animate={urgencyVariants[message.urgency]}
        >
          <Card className={`m-2 border-2 overflow-hidden ${message.color}`}>
            <div className="p-3 flex items-start gap-3">
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">
                {message.urgency === 'critical' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  message.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">
                  {message.message}
                </p>
                {message.subMessage && (
                  <p className="text-xs opacity-90 mt-0.5">
                    {message.subMessage}
                  </p>
                )}
                
                {/* Countdown */}
                {message.countdown && (
                  <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>{message.countdown}</span>
                  </div>
                )}

                {/* Action Button */}
                {message.actionText && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 h-7 text-xs"
                    onClick={handleAction}
                  >
                    {message.actionText}
                  </Button>
                )}
              </div>

              {/* Dismiss */}
              {dismissible && message.urgency !== 'critical' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={handleDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating notification badge for less urgent messages
export function FloatingNotification({ onClick }: { onClick?: () => void }) {
  const [fomo, setFomo] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      const msg = psychologicalHooks.getFOMOMessage();
      setFomo(msg);
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!fomo) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 cursor-pointer"
    >
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <span className="text-sm font-semibold">{fomo}</span>
      </div>
    </motion.div>
  );
}

// Motivation toast that appears periodically
export function MotivationToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const showMotivation = () => {
      const msg = psychologicalHooks.getMotivationMessage();
      setMessage(msg);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    };

    // Show first motivation after 30 seconds
    const initialTimeout = setTimeout(showMotivation, 30000);
    
    // Then show every 2 minutes
    const interval = setInterval(showMotivation, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed top-20 right-4 z-40 max-w-xs"
    >
      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm">{message}</p>
      </div>
    </motion.div>
  );
}
