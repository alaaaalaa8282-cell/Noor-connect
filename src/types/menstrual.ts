/**
 * Enhanced Menstrual Mode - Type Definitions
 * Centralized types for the comprehensive health tracking system
 */

// ============================================
// Profile Types
// ============================================

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  createdAt: string; // ISO date string
  isDefault: boolean;
  settings: ProfileSettings;
}

export interface ProfileSettings {
  defaultCycleLength: number; // days, typically 21-35
  defaultPeriodLength: number; // days, typically 3-7
  notificationsEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  maxNotificationsPerDay: number;
  prayerTimeIntegration: boolean;
}

// ============================================
// Symptom & Flow Types
// ============================================

export type FlowIntensity = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export interface DailySymptoms {
  date: string; // ISO date string (YYYY-MM-DD)
  cramps: number; // 0-5
  headaches: number; // 0-5
  fatigue: number; // 0-5
  mood: number; // 0-5
  bloating: number; // 0-5
  breastTenderness: number; // 0-5
  backache: number; // 0-5
  acne: number; // 0-5
  flow?: FlowIntensity;
  notes?: string;
}

export interface MoodEntry {
  id: string;
  date: string; // ISO date string
  mood: number; // 1-5
  note: string;
  timestamp: string; // ISO datetime string
}

// ============================================
// Medication Types
// ============================================

export type MedicationType = 'painReliever' | 'supplement' | 'birthControl' | 'other';

export interface MedicationEntry {
  id: string;
  name: string;
  type: MedicationType;
  dosage: string;
  takenAt: string; // ISO datetime string
  effectiveness?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface MedicationDefinition {
  id: string;
  name: string;
  type: MedicationType;
  defaultDosage: string;
  quantity: number; // remaining doses
  refillThreshold: number;
  logs: MedicationEntry[];
}

// ============================================
// Cycle Record Types
// ============================================

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'premenstrual';

export interface CycleRecord {
  id: string;
  profileId: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  cycleLength?: number; // days
  periodLength?: number; // days
  symptoms: DailySymptoms[];
  moodEntries: MoodEntry[];
  medications: MedicationEntry[];
  notes: DailyNote[];
}

export interface DailyNote {
  date: string; // ISO date string
  text: string;
  createdAt: string; // ISO datetime string
}

// ============================================
// Notification Types
// ============================================

export type NotificationType =
  | 'phaseChange'
  | 'symptomCheckin'
  | 'medicationReminder'
  | 'pmsWarning'
  | 'periodPrediction'
  | 'fertilityWindow'
  | 'refillAlert'
  | 'prayerAdjustment';

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  timing?: string; // HH:mm for scheduled notifications
  customMessage?: string;
}

export interface ScheduledNotification {
  id: string;
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledAt: string; // ISO datetime string
  sent: boolean;
  sentAt?: string; // ISO datetime string
  createdAt: string; // ISO datetime string
}

// ============================================
// Analytics & Prediction Types
// ============================================

export interface CyclePrediction {
  nextPeriodDate: string; // ISO date string
  confidence: number; // 0-1
  ovulationDate?: string; // ISO date string
  fertilityWindowStart?: string; // ISO date string
  fertilityWindowEnd?: string; // ISO date string
  pmsStartDate?: string; // ISO date string
}

export interface CycleStatistics {
  averageCycleLength: number;
  averagePeriodLength: number;
  shortestCycle: number;
  longestCycle: number;
  cycleRegularity: number; // 0-1 score
  totalCyclesTracked: number;
  mostCommonSymptoms: Array<{ symptom: string; averageSeverity: number }>;
}

export interface PatternInsight {
  id: string;
  type: 'symptom' | 'cycle' | 'correlation' | 'prediction';
  message: string;
  confidence: number; // 0-1
  relatedData?: string[];
  createdAt: string; // ISO datetime string
}

export interface SymptomCorrelation {
  symptom1: string;
  symptom2: string;
  correlation: number; // -1 to 1
  sampleSize: number;
}

// ============================================
// Export/Report Types
// ============================================

export interface ExportOptions {
  profileId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  includeSymptoms: boolean;
  includeMoods: boolean;
  includeMedications: boolean;
  includeNotes: boolean;
  includeCharts: boolean;
  includeIslamicContext: boolean;
  format: 'personal' | 'doctor';
}

// ============================================
// Backward Compatibility Types
// (matching existing menstrual-mode.ts interfaces)
// ============================================

export interface LegacyMenstrualModeHistoryEntry {
  startedAt: string;
  endedAt: string;
  durationDays: number;
}

export interface LegacyMenstrualModeData {
  isActive: boolean;
  startedAt: string | null;
  cycleLengthDays: number;
  pausePrayerNotifications: boolean;
  pauseQazaAutoSync: boolean;
  history: LegacyMenstrualModeHistoryEntry[];
}

// ============================================
// Utility Types
// ============================================

export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

export interface PhaseInfo {
  phase: CyclePhase;
  day: number;
  dayOfPhase: number;
  phaseLength: number;
  color: string;
  icon: string;
}
