/**
 * Enhanced Menstrual Mode - Migration Utility
 * Migrates data from localStorage to IndexedDB
 */

import { db, generateId, getOrCreateDefaultProfile, isIndexedDBAvailable, type DBCycleRecord, type DBDailySymptom, type DBMoodEntry } from './menstrual-db';
import type { LegacyMenstrualModeData, LegacyMenstrualModeHistoryEntry } from '@/types/menstrual';

const MIGRATION_FLAG = 'menstrual-migration-completed';

interface LegacySymptoms {
  cramps: number;
  headaches: number;
  fatigue: number;
  mood: number;
  bloating: number;
  breastTenderness: number;
  backache: number;
  acne: number;
}

interface LegacyMoodEntry {
  date: string;
  mood: number;
  note: string;
}

/**
 * Check if migration has already been completed
 */
export const isMigrationCompleted = (): boolean => {
  return localStorage.getItem(MIGRATION_FLAG) === 'true';
};

/**
 * Mark migration as completed
 */
const markMigrationCompleted = (): void => {
  localStorage.setItem(MIGRATION_FLAG, 'true');
};

/**
 * Check if legacy data exists that needs migration
 */
export const hasLegacyData = (): boolean => {
  const modeData = localStorage.getItem('menstrual-mode-data');
  const symptoms = localStorage.getItem('menstrual-symptoms');
  const moodEntries = localStorage.getItem('menstrual-mood-entries');
  
  return !!(modeData || symptoms || moodEntries);
};

/**
 * Perform full migration from localStorage to IndexedDB
 * Returns a summary of what was migrated
 */
export const performMigration = async (): Promise<{
  success: boolean;
  cyclesMigrated: number;
  symptomsMigrated: number;
  moodsMigrated: number;
  error?: string;
}> => {
  // Check IndexedDB availability
  const dbAvailable = await isIndexedDBAvailable();
  if (!dbAvailable) {
    return {
      success: false,
      cyclesMigrated: 0,
      symptomsMigrated: 0,
      moodsMigrated: 0,
      error: 'IndexedDB is not available',
    };
  }

  // Check if already migrated
  if (isMigrationCompleted()) {
    return {
      success: true,
      cyclesMigrated: 0,
      symptomsMigrated: 0,
      moodsMigrated: 0,
    };
  }

  try {
    const profile = await getOrCreateDefaultProfile();
    let cyclesMigrated = 0;
    let symptomsMigrated = 0;
    let moodsMigrated = 0;

    // 1. Migrate cycle history
    const modeDataRaw = localStorage.getItem('menstrual-mode-data');
    if (modeDataRaw) {
      try {
        const modeData: LegacyMenstrualModeData = JSON.parse(modeDataRaw);
        
        // Migrate history entries as completed cycles
        if (modeData.history && Array.isArray(modeData.history)) {
          for (const entry of modeData.history) {
            const cycleRecord: DBCycleRecord = {
              id: generateId(),
              profileId: profile.id,
              startDate: new Date(entry.startedAt),
              endDate: new Date(entry.endedAt),
              periodLength: entry.durationDays,
            };
            await db.cycles.add(cycleRecord);
            cyclesMigrated++;
          }
        }

        // If there's an active cycle, create it
        if (modeData.isActive && modeData.startedAt) {
          const activeCycle: DBCycleRecord = {
            id: generateId(),
            profileId: profile.id,
            startDate: new Date(modeData.startedAt),
          };
          await db.cycles.add(activeCycle);
          cyclesMigrated++;
        }
      } catch (e) {
        console.warn('Failed to migrate menstrual mode data:', e);
      }
    }

    // 2. Migrate symptoms
    const symptomsRaw = localStorage.getItem('menstrual-symptoms');
    if (symptomsRaw) {
      try {
        const symptoms: LegacySymptoms = JSON.parse(symptomsRaw);
        
        // Find the active cycle to attach symptoms to
        const activeCycle = await db.cycles
          .where('profileId')
          .equals(profile.id)
          .filter(c => c.endDate === undefined)
          .first();

        const cycleId = activeCycle?.id || generateId();
        
        // If no active cycle, create one for the symptoms
        if (!activeCycle) {
          await db.cycles.add({
            id: cycleId,
            profileId: profile.id,
            startDate: new Date(),
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const symptomRecord: DBDailySymptom = {
          profileId: profile.id,
          cycleId,
          date: today,
          cramps: symptoms.cramps || 0,
          headaches: symptoms.headaches || 0,
          fatigue: symptoms.fatigue || 0,
          mood: symptoms.mood || 0,
          bloating: symptoms.bloating || 0,
          breastTenderness: symptoms.breastTenderness || 0,
          backache: symptoms.backache || 0,
          acne: symptoms.acne || 0,
        };
        await db.dailySymptoms.add(symptomRecord);
        symptomsMigrated++;
      } catch (e) {
        console.warn('Failed to migrate symptoms:', e);
      }
    }

    // 3. Migrate mood entries
    const moodRaw = localStorage.getItem('menstrual-mood-entries');
    if (moodRaw) {
      try {
        const entries: LegacyMoodEntry[] = JSON.parse(moodRaw);
        
        for (const entry of entries) {
          const moodEntry: DBMoodEntry = {
            id: generateId(),
            profileId: profile.id,
            date: new Date(entry.date),
            mood: entry.mood,
            note: entry.note || '',
            timestamp: new Date(entry.date),
          };
          await db.moodEntries.add(moodEntry);
          moodsMigrated++;
        }
      } catch (e) {
        console.warn('Failed to migrate mood entries:', e);
      }
    }

    markMigrationCompleted();

    return {
      success: true,
      cyclesMigrated,
      symptomsMigrated,
      moodsMigrated,
    };
  } catch (error) {
    return {
      success: false,
      cyclesMigrated: 0,
      symptomsMigrated: 0,
      moodsMigrated: 0,
      error: error instanceof Error ? error.message : 'Unknown migration error',
    };
  }
};

/**
 * Rollback migration - clears IndexedDB data and removes migration flag
 * Useful if migration causes issues
 */
export const rollbackMigration = async (): Promise<void> => {
  await db.delete();
  localStorage.removeItem(MIGRATION_FLAG);
};

/**
 * Force re-migration - clears the flag so migration runs again
 */
export const forceRemigration = (): void => {
  localStorage.removeItem(MIGRATION_FLAG);
};

/**
 * Auto-migrate on app startup
 * Call this once in your app initialization
 */
export const autoMigrate = async (): Promise<void> => {
  if (isMigrationCompleted()) return;
  if (!hasLegacyData()) {
    markMigrationCompleted();
    return;
  }

  console.log('[MenstrualMode] Starting data migration from localStorage to IndexedDB...');
  const result = await performMigration();
  
  if (result.success) {
    console.log(`[MenstrualMode] Migration complete: ${result.cyclesMigrated} cycles, ${result.symptomsMigrated} symptoms, ${result.moodsMigrated} moods`);
  } else {
    console.error('[MenstrualMode] Migration failed:', result.error);
  }
};
