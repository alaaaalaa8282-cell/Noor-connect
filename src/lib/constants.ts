/**
 * Metal Price Constants and Configuration
 * Fallback prices and conversion ratios for Zakat calculations
 */

export const METAL_PRICE_CONSTANTS = {
  // Fallback prices in USD per gram (used when API fails)
  FALLBACK_GOLD_PRICE_PER_GRAM: 157, // USD
  FALLBACK_SILVER_PRICE_PER_GRAM: 2.24, // USD
  
  // Default gold-to-silver ratio (easily configurable)
  // Current market ratio is around 50-60:1, updated from outdated 70:1
  DEFAULT_GOLD_TO_SILVER_RATIO: 57,
  
  // Conversion constants
  OUNCES_PER_GRAM: 31.1035,
  
  // Nisab thresholds in grams
  NISAB_GOLD_GRAMS: 87.48,
  NISAB_SILVER_GRAMS: 612.36,
  
  // Caching configuration
  CACHE_TTL_MINUTES: 30,
  
  // API endpoints
  GOLD_PRICE_API: 'https://freegoldapi.com/data/latest.csv',
  GOLD_SILVER_RATIO_API: 'https://freegoldapi.com/data/gold_silver_ratio_enriched.csv',
  
  // Storage keys
  CACHE_KEY: 'metal-prices-cache',
} as const;

// Derived constants for easy access
export const NISAB_THRESHOLDS = {
  GOLD: METAL_PRICE_CONSTANTS.NISAB_GOLD_GRAMS,
  SILVER: METAL_PRICE_CONSTANTS.NISAB_SILVER_GRAMS,
} as const;
