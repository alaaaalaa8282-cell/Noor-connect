/**
 * Medication Analytics
 * Analyze medication effectiveness and generate insights
 */

import type { MedicationDefinition, MedicationEntry } from '@/types/menstrual';
import { parseISO, differenceInDays } from 'date-fns';

interface MedicationInsight {
  medication: string;
  insight: string;
  confidence: number;
  type: 'effectiveness' | 'pattern' | 'suggestion';
}

/**
 * Generate medication effectiveness insights
 */
export const analyzeMedEffectiveness = (medications: MedicationDefinition[]): MedicationInsight[] => {
  const insights: MedicationInsight[] = [];

  for (const med of medications) {
    const logsWithRating = med.logs.filter(l => l.effectiveness !== undefined);
    
    if (logsWithRating.length < 3) continue;

    const avgEffectiveness = logsWithRating.reduce((sum, l) => sum + (l.effectiveness || 0), 0) / logsWithRating.length;

    if (avgEffectiveness >= 4) {
      insights.push({
        medication: med.name,
        insight: `${med.name} is highly effective for you (avg: ${avgEffectiveness.toFixed(1)}/5)`,
        confidence: Math.min(0.9, 0.5 + logsWithRating.length * 0.05),
        type: 'effectiveness',
      });
    } else if (avgEffectiveness <= 2) {
      insights.push({
        medication: med.name,
        insight: `${med.name} may not be very effective (avg: ${avgEffectiveness.toFixed(1)}/5). Consider alternatives.`,
        confidence: Math.min(0.8, 0.4 + logsWithRating.length * 0.05),
        type: 'suggestion',
      });
    }

    // Timing patterns
    if (med.logs.length >= 5) {
      const hours = med.logs.map(l => parseISO(l.takenAt).getHours());
      const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
      const timeLabel = avgHour < 12 ? 'morning' : avgHour < 17 ? 'afternoon' : 'evening';
      
      insights.push({
        medication: med.name,
        insight: `You typically take ${med.name} in the ${timeLabel}`,
        confidence: 0.6,
        type: 'pattern',
      });
    }
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Generate refill predictions
 */
export const predictRefillDates = (medications: MedicationDefinition[]): Array<{
  medication: string;
  daysUntilEmpty: number;
  refillDate: Date;
}> => {
  const predictions = [];

  for (const med of medications) {
    if (med.logs.length < 2) continue;

    // Calculate average daily consumption
    const sortedLogs = [...med.logs].sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];
    const daysBetween = differenceInDays(parseISO(lastLog.takenAt), parseISO(firstLog.takenAt));
    
    if (daysBetween < 1) continue;

    const dailyConsumption = med.logs.length / daysBetween;
    const daysUntilEmpty = Math.floor(med.quantity / dailyConsumption);

    const refillDate = new Date();
    refillDate.setDate(refillDate.getDate() + daysUntilEmpty);

    predictions.push({
      medication: med.name,
      daysUntilEmpty,
      refillDate,
    });
  }

  return predictions.sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
};

/**
 * Generate supplement suggestions based on cycle phase
 */
export const getPhaseSupplementSuggestions = (phase: string): Array<{ name: string; reason: string; dosage: string }> => {
  const suggestions: Record<string, Array<{ name: string; reason: string; dosage: string }>> = {
    menstrual: [
      { name: 'Iron', reason: 'Replenish iron lost during menstruation', dosage: '65mg with vitamin C' },
      { name: 'Magnesium', reason: 'Helps reduce cramps and muscle tension', dosage: '400mg' },
      { name: 'Omega-3', reason: 'Natural anti-inflammatory for pain relief', dosage: '1000mg' },
    ],
    follicular: [
      { name: 'Vitamin B Complex', reason: 'Support energy and new cell growth', dosage: 'B-Complex 100' },
      { name: 'Probiotics', reason: 'Support gut health during rising estrogen', dosage: '10 billion CFU' },
    ],
    luteal: [
      { name: 'Magnesium', reason: 'Helps with PMS mood and sleep', dosage: '400mg' },
      { name: 'Vitamin B6', reason: 'Supports serotonin production', dosage: '100mg' },
      { name: 'Calcium', reason: 'Reduces PMS symptoms', dosage: '1000mg' },
    ],
    premenstrual: [
      { name: 'Evening Primrose Oil', reason: 'May reduce breast tenderness', dosage: '1000mg' },
      { name: 'Magnesium', reason: 'Calming effect for mood swings', dosage: '400mg' },
      { name: 'Chasteberry', reason: 'May help with PMS symptoms', dosage: '400mg' },
    ],
  };

  return suggestions[phase] || suggestions.follicular;
};
