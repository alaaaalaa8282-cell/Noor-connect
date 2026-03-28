/**
 * Enhanced Menstrual Mode - React Hooks
 * Custom hooks for accessing and managing menstrual data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  profileOps,
  cycleOps,
  symptomOps,
  moodOps,
  medicationOps,
  MENSTRUAL_DATA_UPDATED,
  determinePhase,
  getCycleDay,
  type CyclePhase,
} from '@/lib/menstrual-storage';
import { autoMigrate, isMigrationCompleted } from '@/lib/menstrual-migration';
import type {
  Profile,
  CycleRecord,
  DailySymptoms,
  MoodEntry,
  MedicationDefinition,
  MedicationEntry,
  CyclePrediction,
  CycleStatistics,
  PatternInsight,
} from '@/types/menstrual';

// ============================================
// Migration Hook
// ============================================

export const useMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(() => isMigrationCompleted());

  useEffect(() => {
    if (migrationDone) return;

    const runMigration = async () => {
      setIsMigrating(true);
      try {
        await autoMigrate();
        setMigrationDone(true);
      } catch (error) {
        console.error('Migration error:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    runMigration();
  }, [migrationDone]);

  return { isMigrating, migrationDone };
};

// ============================================
// Profile Hook
// ============================================

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await profileOps.getDefault();
      setProfile(p);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const handleUpdate = () => loadProfile();
    window.addEventListener(MENSTRUAL_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(MENSTRUAL_DATA_UPDATED, handleUpdate);
  }, [loadProfile]);

  return { profile, loading, reload: loadProfile };
};

// ============================================
// Cycle Hook
// ============================================

export const useCycle = (profileId?: string) => {
  const [activeCycle, setActiveCycle] = useState<CycleRecord | null>(null);
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profileId) return;
    try {
      const [active, all] = await Promise.all([
        cycleOps.getActive(profileId),
        cycleOps.getAll(profileId),
      ]);
      setActiveCycle(active);
      setCycles(all);
    } catch (error) {
      console.error('Failed to load cycles:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener(MENSTRUAL_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(MENSTRUAL_DATA_UPDATED, handleUpdate);
  }, [loadData]);

  const isActive = activeCycle !== null;

  const startCycle = useCallback(async () => {
    if (!profileId) return;
    const cycle = await cycleOps.start(profileId);
    setActiveCycle(cycle);
    await loadData();
    return cycle;
  }, [profileId, loadData]);

  const endCycle = useCallback(async () => {
    if (!profileId || !activeCycle) return;
    const cycle = await cycleOps.end(activeCycle.id, profileId);
    setActiveCycle(null);
    await loadData();
    return cycle;
  }, [profileId, activeCycle, loadData]);

  // Phase calculation
  const currentPhase = useMemo(() => {
    if (!activeCycle) return null;
    const cycleDay = getCycleDay(new Date(activeCycle.startDate));
    const cycleLength = 28; // Default, can be customized
    const phaseInfo = determinePhase(cycleDay, cycleLength);
    return { ...phaseInfo, cycleDay };
  }, [activeCycle]);

  // Active days count
  const activeDays = useMemo(() => {
    if (!activeCycle) return 0;
    return getCycleDay(new Date(activeCycle.startDate));
  }, [activeCycle]);

  // Average cycle length from history
  const averageCycleLength = useMemo(() => {
    const completedCycles = cycles.filter(c => c.cycleLength !== undefined);
    if (completedCycles.length === 0) return 28;
    const sum = completedCycles.reduce((acc, c) => acc + (c.cycleLength || 28), 0);
    return Math.round(sum / completedCycles.length);
  }, [cycles]);

  return {
    activeCycle,
    cycles,
    loading,
    isActive,
    currentPhase,
    activeDays,
    averageCycleLength,
    startCycle,
    endCycle,
    reload: loadData,
  };
};

// ============================================
// Symptoms Hook
// ============================================

export const useSymptoms = (profileId?: string, cycleId?: string) => {
  const [todaySymptoms, setTodaySymptoms] = useState<DailySymptoms | null>(null);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    if (!profileId) return;
    try {
      const symptoms = await symptomOps.getForDate(profileId, new Date());
      setTodaySymptoms(symptoms);
    } catch (error) {
      console.error('Failed to load symptoms:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const saveSymptoms = useCallback(async (symptoms: DailySymptoms) => {
    if (!profileId || !cycleId) return;
    await symptomOps.save(profileId, cycleId, symptoms);
    setTodaySymptoms(symptoms);
  }, [profileId, cycleId]);

  const defaultSymptoms: DailySymptoms = useMemo(() => ({
    date: new Date().toISOString().split('T')[0],
    cramps: 0,
    headaches: 0,
    fatigue: 0,
    mood: 0,
    bloating: 0,
    breastTenderness: 0,
    backache: 0,
    acne: 0,
  }), []);

  return {
    todaySymptoms: todaySymptoms || defaultSymptoms,
    loading,
    saveSymptoms,
    defaultSymptoms,
  };
};

// ============================================
// Mood Hook
// ============================================

export const useMoods = (profileId?: string) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!profileId) return;
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const moods = await moodOps.getForRange(profileId, startDate, endDate);
      setEntries(moods);
    } catch (error) {
      console.error('Failed to load mood entries:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addMood = useCallback(async (mood: number, note: string) => {
    if (!profileId) return;
    const entry = await moodOps.add(profileId, mood, note);
    setEntries(prev => [entry, ...prev]);
    return entry;
  }, [profileId]);

  const averageMood = useMemo(() => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.mood, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }, [entries]);

  return {
    entries,
    loading,
    addMood,
    averageMood,
    reload: loadEntries,
  };
};

// ============================================
// Medications Hook
// ============================================

export const useMedications = (profileId?: string) => {
  const [medications, setMedications] = useState<MedicationDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeds = useCallback(async () => {
    if (!profileId) return;
    try {
      const meds = await medicationOps.getAll(profileId);
      setMedications(meds);
    } catch (error) {
      console.error('Failed to load medications:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadMeds();
  }, [loadMeds]);

  const addMedication = useCallback(async (med: Omit<MedicationDefinition, 'id' | 'logs'>) => {
    if (!profileId) return;
    const newMed = await medicationOps.add(profileId, med);
    setMedications(prev => [...prev, newMed]);
    return newMed;
  }, [profileId]);

  const logDose = useCallback(async (medicationId: string, dosage: string, effectiveness?: number, notes?: string) => {
    if (!profileId) return;
    const log = await medicationOps.logDose(profileId, medicationId, dosage, effectiveness, notes);
    await loadMeds(); // Reload to get updated quantities
    return log;
  }, [profileId, loadMeds]);

  const deleteMedication = useCallback(async (id: string) => {
    await medicationOps.delete(id);
    setMedications(prev => prev.filter(m => m.id !== id));
  }, []);

  const lowSupply = useMemo(() => {
    return medications.filter(m => m.quantity <= m.refillThreshold);
  }, [medications]);

  return {
    medications,
    loading,
    addMedication,
    logDose,
    deleteMedication,
    lowSupply,
    reload: loadMeds,
  };
};

// ============================================
// Predictions Hook
// ============================================

export const usePredictions = (profileId?: string, cycles?: CycleRecord[]) => {
  return useMemo((): CyclePrediction | null => {
    if (!cycles || cycles.length === 0) return null;

    const completedCycles = cycles.filter(c => c.cycleLength !== undefined);
    if (completedCycles.length === 0) return null;

    const avgCycleLength = Math.round(
      completedCycles.reduce((sum, c) => sum + (c.cycleLength || 28), 0) / completedCycles.length
    );

    const lastCycle = cycles[0]; // Most recent (sorted desc)
    const lastStart = new Date(lastCycle.startDate);
    
    const nextPeriodDate = new Date(lastStart);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);

    const ovulationDay = avgCycleLength - 14;
    const ovulationDate = new Date(lastStart);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay);

    const fertilityStart = new Date(ovulationDate);
    fertilityStart.setDate(fertilityStart.getDate() - 5);
    const fertilityEnd = new Date(ovulationDate);
    fertilityEnd.setDate(fertilityEnd.getDate() + 1);

    const pmsStart = new Date(nextPeriodDate);
    pmsStart.setDate(pmsStart.getDate() - 7);

    const confidence = Math.min(0.9, 0.3 + completedCycles.length * 0.1);

    return {
      nextPeriodDate: nextPeriodDate.toISOString(),
      confidence,
      ovulationDate: ovulationDate.toISOString(),
      fertilityWindowStart: fertilityStart.toISOString(),
      fertilityWindowEnd: fertilityEnd.toISOString(),
      pmsStartDate: pmsStart.toISOString(),
    };
  }, [cycles]);
};

// ============================================
// Statistics Hook
// ============================================

export const useStatistics = (cycles?: CycleRecord[]): CycleStatistics | null => {
  return useMemo((): CycleStatistics | null => {
    if (!cycles || cycles.length === 0) return null;

    const completedCycles = cycles.filter(c => c.cycleLength !== undefined);
    const cycleLengths = completedCycles.map(c => c.cycleLength || 28);
    const periodLengths = cycles.filter(c => c.periodLength !== undefined).map(c => c.periodLength || 5);

    if (cycleLengths.length === 0) {
      return {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        shortestCycle: 28,
        longestCycle: 28,
        cycleRegularity: 1,
        totalCyclesTracked: cycles.length,
        mostCommonSymptoms: [],
      };
    }

    const avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    const avgPeriod = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

    // Regularity: standard deviation based
    const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avgCycle, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);
    const regularity = Math.max(0, 1 - stdDev / avgCycle);

    // Most common symptoms
    const symptomTotals: Record<string, { sum: number; count: number }> = {};
    const symptomKeys = ['cramps', 'headaches', 'fatigue', 'mood', 'bloating', 'breastTenderness', 'backache', 'acne'];
    
    for (const cycle of cycles) {
      for (const symptom of cycle.symptoms) {
        for (const key of symptomKeys) {
          const value = (symptom as any)[key] || 0;
          if (value > 0) {
            if (!symptomTotals[key]) symptomTotals[key] = { sum: 0, count: 0 };
            symptomTotals[key].sum += value;
            symptomTotals[key].count += 1;
          }
        }
      }
    }

    const mostCommonSymptoms = Object.entries(symptomTotals)
      .map(([symptom, data]) => ({
        symptom,
        averageSeverity: Math.round((data.sum / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.averageSeverity - a.averageSeverity)
      .slice(0, 5);

    return {
      averageCycleLength: avgCycle,
      averagePeriodLength: avgPeriod,
      shortestCycle: Math.min(...cycleLengths),
      longestCycle: Math.max(...cycleLengths),
      cycleRegularity: Math.round(regularity * 100) / 100,
      totalCyclesTracked: cycles.length,
      mostCommonSymptoms,
    };
  }, [cycles]);
};
