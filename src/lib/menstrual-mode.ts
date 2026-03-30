export interface MenstrualModeHistoryEntry {
  startedAt: string;
  endedAt: string;
  durationDays: number;
}

export interface MenstrualModeData {
  isActive: boolean;
  startedAt: string | null;
  cycleLengthDays: number;
  pausePrayerNotifications: boolean;
  pauseQazaAutoSync: boolean;
  history: MenstrualModeHistoryEntry[];
}

const MENSTRUAL_MODE_STORAGE_KEY = "menstrual-mode-data";
const MAX_HISTORY_ITEMS = 24;

const DEFAULT_MENSTRUAL_MODE_DATA: MenstrualModeData = {
  isActive: false,
  startedAt: null,
  cycleLengthDays: 7,
  pausePrayerNotifications: true,
  pauseQazaAutoSync: true,
  history: [],
};

const clampCycleLength = (value: number): number => {
  return Math.min(15, Math.max(3, value));
};

const sanitizeData = (data: Partial<MenstrualModeData>): MenstrualModeData => {
  const history = Array.isArray(data.history) ? data.history : [];

  return {
    isActive: Boolean(data.isActive),
    startedAt: (data.startedAt && !isNaN(new Date(data.startedAt).getTime())) ? data.startedAt : null,
    cycleLengthDays: clampCycleLength(Number(data.cycleLengthDays) || DEFAULT_MENSTRUAL_MODE_DATA.cycleLengthDays),
    pausePrayerNotifications: data.pausePrayerNotifications ?? DEFAULT_MENSTRUAL_MODE_DATA.pausePrayerNotifications,
    pauseQazaAutoSync: data.pauseQazaAutoSync ?? DEFAULT_MENSTRUAL_MODE_DATA.pauseQazaAutoSync,
    history: history
      .filter((entry): entry is MenstrualModeHistoryEntry =>
        Boolean(
          entry &&
          typeof entry.startedAt === "string" &&
          typeof entry.endedAt === "string" &&
          typeof entry.durationDays === "number"
        )
      )
      .slice(0, MAX_HISTORY_ITEMS),
  };
};

const emitUpdateEvent = (data: MenstrualModeData): void => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent("menstrual-mode-updated", { detail: data }));
};

export const getMenstrualModeData = (): MenstrualModeData => {
  try {
    const stored = localStorage.getItem(MENSTRUAL_MODE_STORAGE_KEY);
    if (!stored) return DEFAULT_MENSTRUAL_MODE_DATA;

    const parsed = JSON.parse(stored) as Partial<MenstrualModeData>;
    return sanitizeData(parsed);
  } catch {
    return DEFAULT_MENSTRUAL_MODE_DATA;
  }
};

export const saveMenstrualModeData = (data: MenstrualModeData): MenstrualModeData => {
  const sanitized = sanitizeData(data);
  try {
    localStorage.setItem(MENSTRUAL_MODE_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.error('Failed to save menstrual mode data:', error);
  }
  emitUpdateEvent(sanitized);
  return sanitized;
};

export const isMenstrualModeActive = (): boolean => {
  const data = getMenstrualModeData();
  return data.isActive;
};

export const updateCycleLengthDays = (cycleLengthDays: number): MenstrualModeData => {
  const current = getMenstrualModeData();
  return saveMenstrualModeData({
    ...current,
    cycleLengthDays: clampCycleLength(cycleLengthDays),
  });
};

export const updateMenstrualModeSettings = (
  settings: Partial<Pick<MenstrualModeData, "pausePrayerNotifications" | "pauseQazaAutoSync">>
): MenstrualModeData => {
  const current = getMenstrualModeData();
  return saveMenstrualModeData({
    ...current,
    ...settings,
  });
};

export const activateMenstrualMode = (startedAt: Date = new Date()): MenstrualModeData => {
  const current = getMenstrualModeData();

  return saveMenstrualModeData({
    ...current,
    isActive: true,
    startedAt: startedAt.toISOString(),
  });
};

export const deactivateMenstrualMode = (endedAt: Date = new Date()): MenstrualModeData => {
  const current = getMenstrualModeData();

  if (!current.startedAt) {
    return saveMenstrualModeData({
      ...current,
      isActive: false,
      startedAt: null,
    });
  }

  const startDate = new Date(current.startedAt);
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endedAt);
  endDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.floor((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
  const durationDays = Math.max(1, dayDiff + 1);

  const newHistoryEntry: MenstrualModeHistoryEntry = {
    startedAt: current.startedAt,
    endedAt: endedAt.toISOString(),
    durationDays,
  };

  return saveMenstrualModeData({
    ...current,
    isActive: false,
    startedAt: null,
    history: [newHistoryEntry, ...current.history].slice(0, MAX_HISTORY_ITEMS),
  });
};
