/**
 * Pattern Analysis Engine
 * Analyzes menstrual cycle data to detect patterns, correlations, and generate insights
 */

import type { CycleRecord, DailySymptoms, PatternInsight, SymptomCorrelation, CyclePhase } from '@/types/menstrual';
import { determinePhase } from './menstrual-storage';
import { parseISO, differenceInDays } from 'date-fns';

type SymptomKey = keyof Omit<DailySymptoms, 'date' | 'flow' | 'notes'>;

const SYMPTOM_KEYS: SymptomKey[] = [
  'cramps', 'headaches', 'fatigue', 'mood', 'bloating',
  'breastTenderness', 'backache', 'acne'
];

/**
 * Generate all pattern insights from cycle data
 */
export const generateInsights = (cycles: CycleRecord[]): PatternInsight[] => {
  const insights: PatternInsight[] = [];
  const now = new Date().toISOString();

  // Cycle length insights
  const cycleLengthInsights = analyzeCycleLength(cycles);
  insights.push(...cycleLengthInsights.map(msg => ({
    id: `cycle-length-${Math.random().toString(36).substr(2, 9)}`,
    type: 'cycle' as const,
    message: msg,
    confidence: 0.8,
    createdAt: now,
  })));

  // Symptom pattern insights
  const symptomInsights = analyzeSymptomPatterns(cycles);
  insights.push(...symptomInsights.map(({ msg, confidence }) => ({
    id: `symptom-${Math.random().toString(36).substr(2, 9)}`,
    type: 'symptom' as const,
    message: msg,
    confidence,
    createdAt: now,
  })));

  // Correlation insights
  const correlations = analyzeCorrelations(cycles);
  insights.push(...correlations
    .filter(c => Math.abs(c.correlation) > 0.5)
    .slice(0, 3)
    .map(c => ({
      id: `corr-${Math.random().toString(36).substr(2, 9)}`,
      type: 'correlation' as const,
      message: formatCorrelation(c),
      confidence: Math.abs(c.correlation),
      relatedData: [c.symptom1, c.symptom2],
      createdAt: now,
    }))
  );

  // PMS pattern insights
  const pmsInsights = analyzePMSPatterns(cycles);
  insights.push(...pmsInsights.map(msg => ({
    id: `pms-${Math.random().toString(36).substr(2, 9)}`,
    type: 'prediction' as const,
    message: msg,
    confidence: 0.7,
    createdAt: now,
  })));

  return insights.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Analyze cycle length patterns
 */
const analyzeCycleLength = (cycles: CycleRecord[]): string[] => {
  const insights: string[] = [];
  const completed = cycles.filter(c => c.cycleLength !== undefined);

  if (completed.length < 2) return insights;

  const lengths = completed.map(c => c.cycleLength!);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  insights.push(`Your cycle averages ${Math.round(avg)} days (range: ${min}-${max} days)`);

  if (stdDev <= 2) {
    insights.push('Your cycle is very regular - consistent within 2 days');
  } else if (stdDev <= 4) {
    insights.push('Your cycle is fairly regular with minor variations');
  } else {
    insights.push('Your cycle shows some irregularity - variations of several days are normal');
  }

  // Trend detection
  if (lengths.length >= 3) {
    const recent3 = lengths.slice(-3);
    const isIncreasing = recent3.every((l, i) => i === 0 || l > recent3[i - 1]);
    const isDecreasing = recent3.every((l, i) => i === 0 || l < recent3[i - 1]);

    if (isIncreasing) {
      insights.push('Your last 3 cycles have been getting slightly longer');
    } else if (isDecreasing) {
      insights.push('Your last 3 cycles have been getting slightly shorter');
    }
  }

  return insights;
};

/**
 * Analyze symptom patterns by cycle phase
 */
const analyzeSymptomPatterns = (cycles: CycleRecord[]): Array<{ msg: string; confidence: number }> => {
  const insights: Array<{ msg: string; confidence: number }> = [];

  // Group symptoms by phase
  const phaseSymptoms: Record<string, Record<SymptomKey, number[]>> = {
    menstrual: {},
    follicular: {},
    ovulatory: {},
    luteal: {},
    premenstrual: {},
  };

  for (const cycle of cycles) {
    const cycleLength = cycle.cycleLength || 28;
    for (const symptom of cycle.symptoms) {
      const date = parseISO(symptom.date);
      const cycleStart = parseISO(cycle.startDate);
      const cycleDay = differenceInDays(date, cycleStart) + 1;
      const { phase } = determinePhase(cycleDay, cycleLength);

      for (const key of SYMPTOM_KEYS) {
        if (!phaseSymptoms[phase][key]) phaseSymptoms[phase][key] = [];
        phaseSymptoms[phase][key].push(symptom[key] || 0);
      }
    }
  }

  // Find dominant symptoms per phase
  for (const [phase, symptoms] of Object.entries(phaseSymptoms)) {
    for (const [key, values] of Object.entries(symptoms)) {
      if (values.length < 3) continue;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg >= 2.5) {
        const readablePhase = phase.charAt(0).toUpperCase() + phase.slice(1);
        const readableSymptom = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        insights.push({
          msg: `Your ${readableSymptom} tends to peak during the ${readablePhase} phase (avg: ${avg.toFixed(1)}/5)`,
          confidence: Math.min(0.9, 0.4 + values.length * 0.05),
        });
      }
    }
  }

  // Peak day analysis
  for (const key of SYMPTOM_KEYS) {
    const dayData: Record<number, number[]> = {};
    for (const cycle of cycles) {
      for (const symptom of cycle.symptoms) {
        const date = parseISO(symptom.date);
        const cycleStart = parseISO(cycle.startDate);
        const cycleDay = differenceInDays(date, cycleStart) + 1;
        if (!dayData[cycleDay]) dayData[cycleDay] = [];
        dayData[cycleDay].push(symptom[key] || 0);
      }
    }

    // Find the day with highest average
    let peakDay = 0;
    let peakAvg = 0;
    for (const [day, values] of Object.entries(dayData)) {
      if (values.length < 2) continue;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > peakAvg) {
        peakAvg = avg;
        peakDay = parseInt(day);
      }
    }

    if (peakDay > 0 && peakAvg >= 2) {
      const readableSymptom = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      insights.push({
        msg: `${readableSymptom.charAt(0).toUpperCase() + readableSymptom.slice(1)} typically peaks on day ${peakDay} of your cycle`,
        confidence: Math.min(0.85, 0.3 + peakAvg * 0.1),
      });
    }
  }

  return insights;
};

/**
 * Analyze correlations between symptoms
 */
export const analyzeCorrelations = (cycles: CycleRecord[]): SymptomCorrelation[] => {
  const correlations: SymptomCorrelation[] = [];

  // Collect all symptom data points
  const allSymptoms: DailySymptoms[] = [];
  for (const cycle of cycles) {
    allSymptoms.push(...cycle.symptoms);
  }

  if (allSymptoms.length < 5) return correlations;

  // Calculate Pearson correlation for each pair
  for (let i = 0; i < SYMPTOM_KEYS.length; i++) {
    for (let j = i + 1; j < SYMPTOM_KEYS.length; j++) {
      const key1 = SYMPTOM_KEYS[i];
      const key2 = SYMPTOM_KEYS[j];

      const pairs = allSymptoms.map(s => [s[key1] || 0, s[key2] || 0]);
      const correlation = pearsonCorrelation(pairs);

      if (!isNaN(correlation)) {
        correlations.push({
          symptom1: key1,
          symptom2: key2,
          correlation: Math.round(correlation * 100) / 100,
          sampleSize: pairs.length,
        });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
};

/**
 * Analyze PMS patterns
 */
const analyzePMSPatterns = (cycles: CycleRecord[]): string[] => {
  const insights: string[] = [];
  const completed = cycles.filter(c => c.cycleLength !== undefined);

  if (completed.length < 3) return insights;

  // Collect premenstrual symptoms (last 7 days of cycle)
  const pmsSymptoms: Record<SymptomKey, number[]> = {};
  SYMPTOM_KEYS.forEach(k => pmsSymptoms[k] = []);

  for (const cycle of completed) {
    const cycleLength = cycle.cycleLength!;
    for (const symptom of cycle.symptoms) {
      const date = parseISO(symptom.date);
      const cycleStart = parseISO(cycle.startDate);
      const cycleDay = differenceInDays(date, cycleStart) + 1;

      if (cycleDay >= cycleLength - 7) {
        for (const key of SYMPTOM_KEYS) {
          pmsSymptoms[key].push(symptom[key] || 0);
        }
      }
    }
  }

  // Find PMS indicators
  const pmsIndicators: Array<{ symptom: string; avg: number }> = [];
  for (const [key, values] of Object.entries(pmsSymptoms)) {
    if (values.length < 3) continue;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg >= 1.5) {
      pmsIndicators.push({
        symptom: key.replace(/([A-Z])/g, ' $1').toLowerCase(),
        avg,
      });
    }
  }

  if (pmsIndicators.length > 0) {
    const sorted = pmsIndicators.sort((a, b) => b.avg - a.avg);
    const top = sorted.slice(0, 3).map(i => i.symptom);
    insights.push(`Your PMS symptoms typically include: ${top.join(', ')}`);

    const avgCycleLength = completed.reduce((sum, c) => sum + (c.cycleLength || 28), 0) / completed.length;
    insights.push(`PMS symptoms usually appear around day ${Math.round(avgCycleLength - 7)} of your cycle`);
  }

  return insights;
};

/**
 * Calculate Pearson correlation coefficient
 */
const pearsonCorrelation = (pairs: number[][]): number => {
  const n = pairs.length;
  if (n < 3) return NaN;

  const sumX = pairs.reduce((sum, p) => sum + p[0], 0);
  const sumY = pairs.reduce((sum, p) => sum + p[1], 0);
  const sumXY = pairs.reduce((sum, p) => sum + p[0] * p[1], 0);
  const sumX2 = pairs.reduce((sum, p) => sum + p[0] * p[0], 0);
  const sumY2 = pairs.reduce((sum, p) => sum + p[1] * p[1], 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

/**
 * Format correlation into readable insight
 */
const formatCorrelation = (correlation: SymptomCorrelation): string => {
  const s1 = correlation.symptom1.replace(/([A-Z])/g, ' $1').toLowerCase();
  const s2 = correlation.symptom2.replace(/([A-Z])/g, ' $1').toLowerCase();
  const strength = Math.abs(correlation.correlation);
  const direction = correlation.correlation > 0 ? 'tend to occur together' : 'are inversely related';

  if (strength > 0.7) {
    return `Strong link: ${s1} and ${s2} ${direction}`;
  } else if (strength > 0.5) {
    return `Moderate link: ${s1} and ${s2} ${direction}`;
  }
  return `${s1} and ${s2} may be related`;
};

/**
 * Generate cycle length chart data
 */
export const generateCycleLengthChartData = (cycles: CycleRecord[]) => {
  return cycles
    .filter(c => c.cycleLength !== undefined)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(-12)
    .map(c => ({
      date: new Date(c.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      length: c.cycleLength!,
      periodLength: c.periodLength || 0,
    }));
};

/**
 * Generate symptom correlation heatmap data
 */
export const generateCorrelationHeatmap = (cycles: CycleRecord[]) => {
  const correlations = analyzeCorrelations(cycles);
  const matrix: Record<string, Record<string, number>> = {};

  for (const key of SYMPTOM_KEYS) {
    matrix[key] = {};
    for (const key2 of SYMPTOM_KEYS) {
      matrix[key][key2] = key === key2 ? 1 : 0;
    }
  }

  for (const corr of correlations) {
    matrix[corr.symptom1][corr.symptom2] = corr.correlation;
    matrix[corr.symptom2][corr.symptom1] = corr.correlation;
  }

  return { matrix, keys: SYMPTOM_KEYS };
};
