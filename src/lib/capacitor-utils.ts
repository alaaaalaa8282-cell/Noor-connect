import { Capacitor } from '@capacitor/core';

/**
 * Check if running on a native platform (iOS/Android)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on web platform
 */
export const isWebPlatform = (): boolean => {
  return !Capacitor.isNativePlatform();
};

/**
 * Run a function only on native platforms, safely handling web fallback
 * @param fn Function that returns a promise to execute on native platforms
 * @returns Promise that resolves on web or executes fn on native
 */
export const runIfNative = async <T>(fn: () => Promise<T>): Promise<T | void> => {
  if (isNativePlatform()) {
    try {
      return await fn();
    } catch (error) {
      console.error('Native platform operation failed:', error);
      throw error;
    }
  }
  // On web, resolve with undefined to avoid breaking chains
  return undefined;
};

/**
 * Run a function only on web platform
 * @param fn Function to execute on web platforms
 * @returns Result of fn on web or undefined on native
 */
export const runIfWeb = <T>(fn: () => T): T | undefined => {
  if (isWebPlatform()) {
    try {
      return fn();
    } catch (error) {
      console.error('Web platform operation failed:', error);
      throw error;
    }
  }
  return undefined;
};