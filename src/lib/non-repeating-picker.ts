const MAX_HISTORY_ITEMS = 24;

interface PickNonRepeatingIndexOptions {
  storageKey: string;
  length: number;
  maxRecent?: number;
  exclude?: number[];
}

const hasLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const parseHistory = (rawValue: string | null, length: number): number[] => {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value < length);
  } catch {
    return [];
  }
};

const readHistory = (storageKey: string, length: number): number[] => {
  if (!hasLocalStorage()) return [];

  try {
    return parseHistory(localStorage.getItem(storageKey), length);
  } catch {
    return [];
  }
};

const writeHistory = (storageKey: string, history: number[]) => {
  if (!hasLocalStorage()) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Ignore storage errors and continue with runtime-only behavior.
  }
};

export const pickNonRepeatingIndex = ({
  storageKey,
  length,
  maxRecent = 6,
  exclude = [],
}: PickNonRepeatingIndexOptions): number => {
  if (length <= 1) return 0;

  const history = readHistory(storageKey, length);
  const blocked = new Set<number>();
  const recentLimit = Math.min(maxRecent, length - 1);

  for (const index of history.slice(0, recentLimit)) {
    blocked.add(index);
  }

  for (const index of exclude) {
    if (Number.isInteger(index) && index >= 0 && index < length) {
      blocked.add(index);
    }
  }

  const candidates: number[] = [];
  for (let i = 0; i < length; i += 1) {
    if (!blocked.has(i)) {
      candidates.push(i);
    }
  }

  const fallback: number[] = [];
  for (let i = 0; i < length; i += 1) {
    if (i !== history[0]) {
      fallback.push(i);
    }
  }

  const pool = candidates.length > 0 ? candidates : fallback.length > 0 ? fallback : [0];
  const nextIndex = pool[Math.floor(Math.random() * pool.length)];
  const nextHistory = [nextIndex, ...history.filter((item) => item !== nextIndex)];

  writeHistory(storageKey, nextHistory);
  return nextIndex;
};
