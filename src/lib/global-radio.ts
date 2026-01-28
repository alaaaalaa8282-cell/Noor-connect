/**
 * Global Radio State Management
 * Persistent radio playback across app navigation
 */

import { useState, useEffect, useCallback } from 'react';

export interface RadioState {
  isPlaying: boolean;
  currentStation: {
    id: number;
    name: string;
    url: string;
  } | null;
  volume: number;
  isMuted: boolean;
  currentTrackInfo: string;
}

const DEFAULT_RADIO_STATE: RadioState = {
  isPlaying: false,
  currentStation: null,
  volume: 70,
  isMuted: false,
  currentTrackInfo: ''
};

const STORAGE_KEY = 'global-radio-state';

// Load radio state from localStorage
const loadStoredRadioState = (): RadioState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored state
      return {
        ...DEFAULT_RADIO_STATE,
        ...parsed,
        isPlaying: false // Always start paused when loading from storage
      };
    }
  } catch {
    return DEFAULT_RADIO_STATE;
  }
};

// Save radio state to localStorage
const saveRadioState = (state: RadioState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save radio state:', error);
  }
};

// Global radio state hook
export const useGlobalRadio = () => {
  const [radioState, setRadioState] = useState<RadioState>(loadStoredRadioState());

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveRadioState(radioState);
  }, [radioState]);

  // Update radio state
  const updateRadioState = useCallback((updates: Partial<RadioState>) => {
    setRadioState(prev => ({ ...prev, ...updates }));
  }, []);

  // Play radio
  const playRadio = useCallback((station: { id: number; name: string; url: string }) => {
    updateRadioState({
      currentStation: station,
      isPlaying: true,
      currentTrackInfo: station.name
    });
  }, [updateRadioState]);

  // Pause radio
  const pauseRadio = useCallback(() => {
    updateRadioState({ isPlaying: false });
  }, [updateRadioState]);

  // Stop radio
  const stopRadio = useCallback(() => {
    updateRadioState({
      isPlaying: false,
      currentStation: null,
      currentTrackInfo: ''
    });
  }, [updateRadioState]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    updateRadioState({ 
      volume: Math.max(0, Math.min(100, volume)),
      isMuted: false // Unmute when setting volume
    });
  }, [updateRadioState]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    updateRadioState({ isMuted: !radioState.isMuted });
  }, [updateRadioState, radioState.isMuted]);

  return {
    ...radioState,
    updateRadioState,
    playRadio,
    pauseRadio,
    stopRadio,
    setVolume,
    toggleMute
  };
};

// Global radio instance for direct access
let globalAudioRef: HTMLAudioElement | null = null;

export const getGlobalAudioRef = (): HTMLAudioElement | null => {
  return globalAudioRef;
};

export const setGlobalAudioRef = (audio: HTMLAudioElement | null): void => {
  globalAudioRef = audio;
};
