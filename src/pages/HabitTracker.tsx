import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Target, Flame, Calendar, TrendingUp, CheckCircle, Circle, Trash2, Edit2, Save, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { habitTracker, type Habit, type HabitEntry, type HabitStats, DEFAULT_HABITS } from "@/lib/habit-tracker";

const HabitTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayEntries, setTodayEntries] = useState<HabitEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'general' as const,
    icon: '🌟',
    color: 'bg-gray-500',
    targetCount: 1,
    unit: ''
  });

  const categoryIcons = {
    quran: '📖',
    prayer: '🙏',
    dhikr: '🕌',
    charity: '💝',
    fasting: '🌅',
    general: '🌟'
  };

  const categoryColors = {
    quran: 'bg-green-500',
    prayer: 'bg-blue-500',
    dhikr: 'bg-purple-500',
    charity: 'bg-pink-500',
    fasting: 'bg-orange-500',
    general: 'bg-gray-500'
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = () => {
    const allHabits = habitTracker.getHabits();
    const entries = habitTracker.getEntriesForDate(selectedDate);
    
    setHabits(allHabits);
    setTodayEntries(entries);
  };

  const toggleHabit = (habitId: string) => {
    habitTracker.toggleHabit(habitId, selectedDate);
    loadData();
    
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = todayEntries.some(e => e.habitId === habitId);
    
    toast({
      title: isCompleted ? "Habit uncompleted" : "Habit completed!",
      description: `${habit?.name} marked as ${isCompleted ? 'incomplete' : 'complete'}`,
    });
  };

  const addCustomHabit = () => {
    if (!newHabit.name.trim()) {
      toast({
        title: "Error",
        description: "Habit name is required",
        variant: "destructive"
      });
      return;
    }

    habitTracker.addCustomHabit({
      ...newHabit,
      icon: categoryIcons[newHabit.category],
      color: categoryColors[newHabit.category]
    });

    setNewHabit({
      name: '',
      description: '',
      category: 'general',
      icon: '🌟',
      color: 'bg-gray-500',
      targetCount: 1,
      unit: ''
    });

    setShowAddHabit(false);
    loadData();
    
    toast({
      title: "Habit added",
      description: "New habit has been added successfully",
    });
  };

  const deleteCustomHabit = (habitId: string) => {
    if (confirm("Are you sure you want to delete this habit and all its entries?")) {
      habitTracker.deleteCustomHabit(habitId);
      loadData();
      
      toast({
        title: "Habit deleted",
        description: "Habit and all its entries have been removed",
      });
    }
  };

  const getHabitEntry = (habitId: string) => {
    return todayEntries.find(entry => entry.habitId === habitId);
  };

  const getHabitStats = (habitId: string): HabitStats => {
    return habitTracker.getHabitStats(habitId, 30);
  };

  const getOverallStats = () => {
    return habitTracker.getOverallStats(30);
  };

  const exportData = () => {
    const data = habitTracker.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your habit data has been exported successfully",
    });
  };

  const isCustomHabit = (habitId: string) => {
    return !DEFAULT_HABITS.some(h => h.id === habitId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Habit Tracker</h1>
            <p className="text-xs text-muted-foreground">Track your daily Islamic practices</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Stats
          </Button>
        </div>

        {/* Stats Overview */}
        {showStats && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              30-Day Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {getOverallStats().completedToday}/{getOverallStats().totalHabits}
                </div>
                <div className="text-xs text-muted-foreground">Today's Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getOverallStats().activeStreaks}
                </div>
                <div className="text-xs text-muted-foreground">Active Streaks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(getOverallStats().completionRate)}%
                </div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {getOverallStats().mostConsistentHabit?.habit.icon || '🌟'}
                </div>
                <div className="text-xs text-muted-foreground">Most Consistent</div>
              </div>
            </div>
          </Card>
        )}

        {/* Date Selector */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Tracking Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </Card>

        {/* Habits List */}
        <div className="space-y-3">
          {habits.map((habit) => {
            const entry = getHabitEntry(habit.id);
            const stats = getHabitStats(habit.id);
            const isCompleted = !!entry;
            
            return (
              <Card key={habit.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleHabit(habit.id)}
                      className="mt-1"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{habit.icon}</span>
                        <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.name}
                        </h3>
                        {isCustomHabit(habit.id) && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{habit.description}</p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span>{stats.streak.current} day streak</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-blue-500" />
                          <span>{Math.round(stats.completionRate)}% this month</span>
                        </div>
                      </div>
                      
                      {entry?.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isCustomHabit(habit.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCustomHabit(habit.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add Custom Habit Button */}
        <Button
          onClick={() => setShowAddHabit(!showAddHabit)}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Habit
        </Button>

        {/* Add Habit Form */}
        {showAddHabit && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Add Custom Habit</h3>
            
            <div>
              <Label htmlFor="habit-name">Habit Name</Label>
              <Input
                id="habit-name"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="e.g., Read Islamic Books"
              />
            </div>

            <div>
              <Label htmlFor="habit-description">Description</Label>
              <Textarea
                id="habit-description"
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                placeholder="Describe your habit..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="habit-category">Category</Label>
              <Select value={newHabit.category} onValueChange={(value: any) => setNewHabit({ ...newHabit, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quran">📖 Quran</SelectItem>
                  <SelectItem value="prayer">🙏 Prayer</SelectItem>
                  <SelectItem value="dhikr">🕌 Dhikr</SelectItem>
                  <SelectItem value="charity">💝 Charity</SelectItem>
                  <SelectItem value="fasting">🌅 Fasting</SelectItem>
                  <SelectItem value="general">🌟 General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={addCustomHabit} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Add Habit
              </Button>
              <Button variant="outline" onClick={() => setShowAddHabit(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Export Data */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Data Management</h3>
              <p className="text-xs text-muted-foreground">Export your habit tracking data</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportData}>
              Export Data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HabitTracker;
