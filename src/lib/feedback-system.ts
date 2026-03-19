/**
 * Haptic & Audio Feedback System
 * Provides tactile and auditory feedback for engagement
 */

export class FeedbackSystem {
  private static instance: FeedbackSystem;
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  static getInstance(): FeedbackSystem {
    if (!FeedbackSystem.instance) {
      FeedbackSystem.instance = new FeedbackSystem();
    }
    return FeedbackSystem.instance;
  }

  // Initialize audio context (must be called after user interaction)
  init(): void {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Enable/disable feedback
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // ===== HAPTIC FEEDBACK =====

  // Trigger haptic vibration
  haptic(pattern: number | number[] = 50): void {
    if (!this.enabled) return;
    if (!('vibrate' in navigator)) return;

    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore haptic errors
    }
  }

  // Correct answer haptic
  hapticCorrect(): void {
    this.haptic([50, 30, 50]); // Short double pulse
  }

  // Wrong answer haptic
  hapticWrong(): void {
    this.haptic([100]); // Long buzz
  }

  // Combo milestone haptic
  hapticCombo(milestone: number): void {
    if (milestone === 5) {
      this.haptic([30, 20, 30, 20, 30]);
    } else if (milestone === 10) {
      this.haptic([50, 30, 50, 30, 50, 30, 50]);
    } else if (milestone >= 20) {
      this.haptic([30, 20, 30, 20, 30, 20, 30, 20, 30]);
    }
  }

  // Level up haptic
  hapticLevelUp(): void {
    this.haptic([50, 30, 50, 30, 100, 50, 100]);
  }

  // Power-up haptic
  hapticPowerUp(): void {
    this.haptic([20, 20, 20, 40]);
  }

  // Box opening haptic
  hapticBoxOpen(): void {
    this.haptic([100, 50, 100, 50, 200]);
  }

  // Button press haptic
  hapticButton(): void {
    this.haptic(10);
  }

  // ===== AUDIO FEEDBACK =====

  // Play a tone with specific frequency and duration
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Correct answer sound - pleasant chime
  soundCorrect(): void {
    if (!this.enabled) return;
    this.playTone(523.25, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 50); // E5
  }

  // Wrong answer sound - low buzz
  soundWrong(): void {
    if (!this.enabled) return;
    this.playTone(200, 0.3, 'sawtooth');
  }

  // Combo sound - rising pitch
  soundCombo(combo: number): void {
    if (!this.enabled) return;
    const baseFreq = 440;
    const increment = 50;
    
    for (let i = 0; i < Math.min(combo % 5, 4); i++) {
      setTimeout(() => {
        this.playTone(baseFreq + (i * increment), 0.1);
      }, i * 50);
    }
  }

  // Level up sound - victory fanfare
  soundLevelUp(): void {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2), i * 100);
    });
  }

  // Power-up sound - magical spark
  soundPowerUp(): void {
    if (!this.enabled) return;
    this.playTone(880, 0.1);
    setTimeout(() => this.playTone(1108.73, 0.15), 100);
    setTimeout(() => this.playTone(1318.51, 0.2), 200);
  }

  // Box opening sound - anticipation then reward
  soundBoxOpen(): void {
    if (!this.enabled) return;
    // Build up
    this.playTone(300, 0.1);
    setTimeout(() => this.playTone(400, 0.1), 150);
    setTimeout(() => this.playTone(500, 0.1), 300);
    // Reward reveal
    setTimeout(() => {
      this.playTone(800, 0.2);
      setTimeout(() => this.playTone(1000, 0.3), 100);
    }, 500);
  }

  // Countdown tick
  soundTick(): void {
    if (!this.enabled) return;
    this.playTone(800, 0.05);
  }

  // Timer warning - urgent
  soundTimerWarning(): void {
    if (!this.enabled) return;
    this.playTone(600, 0.1, 'square');
  }

  // Streak break sound
  soundStreakBreak(): void {
    if (!this.enabled) return;
    this.playTone(300, 0.2, 'sawtooth');
    setTimeout(() => this.playTone(250, 0.3), 100);
  }

  // Achievement unlock
  soundAchievement(): void {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15), i * 80);
    });
  }

  // Store purchase
  soundPurchase(): void {
    if (!this.enabled) return;
    this.playTone(600, 0.1);
    setTimeout(() => this.playTone(800, 0.15), 50);
    setTimeout(() => this.playTone(1000, 0.2), 150);
  }

  // Button click
  soundButton(): void {
    if (!this.enabled) return;
    this.playTone(600, 0.05);
  }

  // ===== COMBINED FEEDBACK =====

  // Correct answer - haptic + audio
  feedbackCorrect(): void {
    this.hapticCorrect();
    this.soundCorrect();
  }

  // Wrong answer - haptic + audio
  feedbackWrong(): void {
    this.hapticWrong();
    this.soundWrong();
  }

  // Combo milestone
  feedbackCombo(milestone: number): void {
    this.hapticCombo(milestone);
    this.soundCombo(milestone);
  }

  // Level up celebration
  feedbackLevelUp(): void {
    this.hapticLevelUp();
    this.soundLevelUp();
  }

  // Power up
  feedbackPowerUp(): void {
    this.hapticPowerUp();
    this.soundPowerUp();
  }

  // Box opening
  feedbackBoxOpen(): void {
    this.hapticBoxOpen();
    this.soundBoxOpen();
  }

  // Achievement
  feedbackAchievement(): void {
    this.haptic([50, 30, 50, 30, 50, 30, 100]);
    this.soundAchievement();
  }

  // Purchase
  feedbackPurchase(): void {
    this.haptic([20, 20, 40]);
    this.soundPurchase();
  }

  // Button press
  feedbackButton(): void {
    this.hapticButton();
    this.soundButton();
  }

  // Timer warning
  feedbackTimerWarning(): void {
    this.haptic([30, 30]);
    this.soundTimerWarning();
  }

  // Streak break
  feedbackStreakBreak(): void {
    this.haptic([100, 50, 200]);
    this.soundStreakBreak();
  }
}

export const feedbackSystem = FeedbackSystem.getInstance();
