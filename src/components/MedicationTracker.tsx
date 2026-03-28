/**
 * Medication Tracker Component
 * Log medications, track effectiveness, view history
 */

import { useState, useMemo } from 'react';
import { Pill, Plus, Clock, Star, Trash2, AlertTriangle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { MedicationDefinition, MedicationEntry, MedicationType } from '@/types/menstrual';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

interface MedicationTrackerProps {
  medications: MedicationDefinition[];
  lowSupply: MedicationDefinition[];
  onAdd: (med: { name: string; type: MedicationType; defaultDosage: string; quantity: number; refillThreshold: number }) => Promise<any>;
  onLogDose: (medicationId: string, dosage: string, effectiveness?: number, notes?: string) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

const MEDICATION_TYPES: { value: MedicationType; label: string; icon: string }[] = [
  { value: 'painReliever', label: 'Pain Reliever', icon: '💊' },
  { value: 'supplement', label: 'Supplement', icon: '🌿' },
  { value: 'birthControl', label: 'Birth Control', icon: '💊' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const QUICK_ADD_MEDS = [
  { name: 'Ibuprofen', type: 'painReliever' as MedicationType, defaultDosage: '400mg' },
  { name: 'Paracetamol', type: 'painReliever' as MedicationType, defaultDosage: '500mg' },
  { name: 'Iron', type: 'supplement' as MedicationType, defaultDosage: '65mg' },
  { name: 'Magnesium', type: 'supplement' as MedicationType, defaultDosage: '400mg' },
  { name: 'Vitamin B6', type: 'supplement' as MedicationType, defaultDosage: '100mg' },
  { name: 'Omega-3', type: 'supplement' as MedicationType, defaultDosage: '1000mg' },
];

export function MedicationTracker({ medications, lowSupply, onAdd, onLogDose, onDelete }: MedicationTrackerProps) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [newMed, setNewMed] = useState({ name: '', type: 'supplement' as MedicationType, dosage: '', quantity: '30' });
  const [logEffectiveness, setLogEffectiveness] = useState<Record<string, number>>({});
  const [logNotes, setLogNotes] = useState<Record<string, string>>({});

  const handleQuickAdd = async (med: typeof QUICK_ADD_MEDS[0]) => {
    await onAdd({
      name: med.name,
      type: med.type,
      defaultDosage: med.defaultDosage,
      quantity: 30,
      refillThreshold: 5,
    });
    toast({ title: 'Added', description: `${med.name} added to your medications.` });
  };

  const handleAddCustom = async () => {
    if (!newMed.name.trim() || !newMed.dosage.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    await onAdd({
      name: newMed.name.trim(),
      type: newMed.type,
      defaultDosage: newMed.dosage.trim(),
      quantity: parseInt(newMed.quantity, 10) || 30,
      refillThreshold: 5,
    });
    setNewMed({ name: '', type: 'supplement', dosage: '', quantity: '30' });
    setShowAddForm(false);
    toast({ title: 'Added', description: `${newMed.name} added to your medications.` });
  };

  const handleLogDose = async (med: MedicationDefinition) => {
    const effectiveness = logEffectiveness[med.id];
    const notes = logNotes[med.id];
    await onLogDose(med.id, med.defaultDosage, effectiveness, notes);
    setLogEffectiveness(prev => ({ ...prev, [med.id]: 0 }));
    setLogNotes(prev => ({ ...prev, [med.id]: '' }));
    toast({ title: 'Logged', description: `${med.name} dose recorded.` });
  };

  const formatLogDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  // Group logs by medication
  const recentLogs = useMemo(() => {
    const allLogs: Array<MedicationEntry & { medName: string }> = [];
    for (const med of medications) {
      for (const log of med.logs) {
        allLogs.push({ ...log, medName: med.name });
      }
    }
    return allLogs.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()).slice(0, 10);
  }, [medications]);

  return (
    <div className="space-y-4">
      {/* Low Supply Alerts */}
      {lowSupply.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-50 dark:bg-amber-900/10">
          <h3 className="font-bold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            Low Supply
          </h3>
          <div className="space-y-2">
            {lowSupply.map(med => (
              <div key={med.id} className="flex items-center justify-between text-sm">
                <span>{med.name}</span>
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  {med.quantity} left
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Medication List */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Medications & Supplements
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Quick Add */}
        {showAddForm && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Quick Add:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ADD_MEDS.map(med => (
                <Badge
                  key={med.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => handleQuickAdd(med)}
                >
                  {med.name}
                </Badge>
              ))}
            </div>

            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Or add custom:</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Medication name"
                  value={newMed.name}
                  onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 400mg)"
                  value={newMed.dosage}
                  onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                  className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select
                  value={newMed.type}
                  onChange={e => setNewMed(prev => ({ ...prev, type: e.target.value as MedicationType }))}
                  className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {MEDICATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newMed.quantity}
                  onChange={e => setNewMed(prev => ({ ...prev, quantity: e.target.value }))}
                  className="px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleAddCustom} className="flex-1">
                  <Check className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Medications */}
        {medications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No medications added yet. Tap "Add" to start tracking.
          </p>
        ) : (
          <div className="space-y-2">
            {medications.map(med => {
              const isExpanded = expandedMed === med.id;
              const typeInfo = MEDICATION_TYPES.find(t => t.value === med.type) || MEDICATION_TYPES[3];

              return (
                <div key={med.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedMed(isExpanded ? null : med.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {med.defaultDosage} • {med.quantity} remaining
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {med.quantity <= med.refillThreshold && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); handleLogDose(med); }}
                        className="h-7 text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" /> Log
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 border-t bg-muted/10 space-y-3">
                      {/* Effectiveness rating */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Effectiveness (optional)</Label>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => setLogEffectiveness(prev => ({ ...prev, [med.id]: star }))}
                              className={`p-1 ${logEffectiveness[med.id] >= star ? 'text-amber-500' : 'text-muted-foreground'}`}
                            >
                              <Star className="w-5 h-5" fill={logEffectiveness[med.id] >= star ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                        <input
                          type="text"
                          placeholder="How did it work?"
                          value={logNotes[med.id] || ''}
                          onChange={e => setLogNotes(prev => ({ ...prev, [med.id]: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Recent logs */}
                      {med.logs.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Recent Logs</Label>
                          <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                            {med.logs.slice(0, 5).map(log => (
                              <div key={log.id} className="flex items-center justify-between text-xs p-1.5 bg-muted/20 rounded">
                                <span>{formatLogDate(log.takenAt)}</span>
                                <span className="text-muted-foreground">{log.dosage}</span>
                                {log.effectiveness && (
                                  <span className="text-amber-500">
                                    {'★'.repeat(log.effectiveness)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(med.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{log.medName}</span>
                  <span className="text-xs text-muted-foreground">{log.dosage}</span>
                </div>
                <div className="flex items-center gap-2">
                  {log.effectiveness && (
                    <span className="text-amber-500 text-xs">{'★'.repeat(log.effectiveness)}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatLogDate(log.takenAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default MedicationTracker;
