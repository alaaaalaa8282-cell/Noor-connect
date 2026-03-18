import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useIslamicCalendar } from "@/hooks/useIslamicCalendar";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Moon, 
  Star, 
  CheckCircle2, 
  RotateCcw,
  Calendar,
  Clock,
  Heart,
  Shirt,
  ShoppingBag,
  Users,
  Utensils,
  PartyPopper,
  Zap,
  Coffee,
  Sun,
  Droplets,
  Coins,
  Trash2,
  Plus,
  X,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: 'sunnah' | 'mandatory' | 'prep';
  icon: any;
  eidSpecific?: 'fitr' | 'adha' | 'both';
  isCustom?: boolean;
}

interface EidChecklistData {
  fitr: ChecklistItem[];
  adha: ChecklistItem[];
}

const defaultChecklistItems: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'ghusl', text: 'Perform Ghusl (ritual bath)', category: 'sunnah', icon: Droplets, eidSpecific: 'both' },
  { id: 'dates', text: 'Eat an odd number of dates before prayer', category: 'sunnah', icon: Coffee, eidSpecific: 'fitr' },
  { id: 'best-clothes', text: 'Wear your best available clothes', category: 'sunnah', icon: Shirt, eidSpecific: 'both' },
  { id: 'ittar', text: 'Apply ittar or perfume', category: 'sunnah', icon: Sparkles, eidSpecific: 'both' },
  { id: 'fitrana', text: 'Pay Zakat al-Fitr (before prayer)', category: 'mandatory', icon: Coins, eidSpecific: 'fitr' },
  { id: 'eid-prayer', text: 'Attend the Eid prayer congregation', category: 'mandatory', icon: Users, eidSpecific: 'both' },
  { id: 'takbirat', text: 'Recite Takbirat loudly on the way', category: 'sunnah', icon: Zap, eidSpecific: 'both' },
  { id: 'different-way', text: 'Return from prayer using a different path', category: 'sunnah', icon: Sun, eidSpecific: 'both' },
  { id: 'greet-family', text: 'Greet everyone with "Eid Mubarak"', category: 'prep', icon: Heart, eidSpecific: 'both' },
  { id: 'charity', text: 'Give additional Sadaqa to those in need', category: 'prep', icon: ShoppingBag, eidSpecific: 'both' },
  { id: 'adha-meat', text: 'Eat from your Udhiyah (Qurbani) meat', category: 'sunnah', icon: Utensils, eidSpecific: 'adha' },
];

export default function EidChecklist() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isEidAlFitr, isEidAlAdha, islamicInfo, isLoading } = useIslamicCalendar();

  // Determine current Eid type
  const currentEidType = useMemo(() => {
    if (!islamicInfo) return null;
    
    const hijriMonth = islamicInfo.hijriMonth;
    const hijriDay = islamicInfo.hijriDay;
    
    if (isEidAlFitr) return 'fitr';
    if (isEidAlAdha) return 'adha';
    if (hijriMonth === 9 && (hijriDay === 29 || hijriDay === 30)) return 'fitr'; // Last night of Ramadan
    return null;
  }, [isEidAlFitr, isEidAlAdha, islamicInfo]);

  // Load checklist data from localStorage
  const loadChecklistData = (): EidChecklistData => {
    try {
      const stored = localStorage.getItem('eid-checklist-data');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        const mergeData = (type: 'fitr' | 'adha') => {
          const storedItems = parsed[type] || [];
          
          // 1. Start with all current default items
          const defaults = defaultChecklistItems
            .filter(d => d.eidSpecific === 'both' || d.eidSpecific === type)
            .map(d => {
              const stored = storedItems.find((s: any) => s.id === d.id);
              return { ...d, checked: stored ? stored.checked : false };
            });
          
          // 2. Add custom items that aren't in defaults
          const customs = storedItems.filter((s: any) => s.isCustom);
          
          return [...defaults, ...customs];
        };

        return {
          fitr: mergeData('fitr'),
          adha: mergeData('adha')
        };
      }
    } catch (error) {
      console.error('Error loading checklist data:', error);
    }
    
    // Return default data if nothing stored
    return {
      fitr: defaultChecklistItems.map(item => ({ ...item, checked: false })),
      adha: defaultChecklistItems.map(item => ({ ...item, checked: false }))
    };
  };

  const [checklistData, setChecklistData] = useState<EidChecklistData>(loadChecklistData);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<'sunnah' | 'mandatory' | 'prep'>('prep');

  // Logic to add a task
  const addTask = () => {
    if (!currentEidType || !newTaskText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newTaskText,
      checked: false,
      category: newTaskCategory,
      icon: ClipboardList,
      isCustom: true,
      eidSpecific: 'both'
    };

    const updatedData = {
      ...checklistData,
      [currentEidType]: [...checklistData[currentEidType], newItem]
    };

    setChecklistData(updatedData);
    saveChecklistData(updatedData);
    setNewTaskText("");
    setIsAddDialogOpen(false);
    
    toast({
      title: "Task Added",
      description: "Your custom Eid task has been created.",
    });
  };

  // Logic to delete a task
  const deleteTask = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!currentEidType) return;

    const updatedData = {
      ...checklistData,
      [currentEidType]: checklistData[currentEidType].filter(item => item.id !== itemId)
    };

    setChecklistData(updatedData);
    saveChecklistData(updatedData);
    
    toast({
      title: "Task Removed",
      description: "The task has been removed from your list.",
    });
  };

  // Get current checklist based on Eid type
  const currentChecklist = useMemo(() => {
    if (!currentEidType) return [];
    return checklistData[currentEidType];
  }, [currentEidType, checklistData]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (currentChecklist.length === 0) return 0;
    const checkedCount = currentChecklist.filter(item => item.checked).length;
    return Math.round((checkedCount / currentChecklist.length) * 100);
  }, [currentChecklist]);

  // Save checklist data to localStorage
  const saveChecklistData = (data: EidChecklistData) => {
    try {
      localStorage.setItem('eid-checklist-data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving checklist data:', error);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    if (!currentEidType) return;
    
    const updatedData = { ...checklistData };
    const itemIndex = updatedData[currentEidType].findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      updatedData[currentEidType][itemIndex].checked = checked;
      setChecklistData(updatedData);
      saveChecklistData(updatedData);
      
      // Calculate completion count for immediate celebration
      const updatedList = updatedData[currentEidType].filter(item => 
        item.eidSpecific === 'both' || item.eidSpecific === currentEidType
      );
      const checkedCount = updatedList.filter(item => item.checked).length;
      
      // Haptic feedback if available
      if (checked && 'vibrate' in navigator) navigator.vibrate(10);

      // Show completion celebration if all items are checked
      if (checked && checkedCount === updatedList.length) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e0c097', '#d4af37', '#b38b5d', '#0a1128']
        });

        toast({
          title: "🎉 Eid Mubarak!",
          description: "You've completed all Eid preparations! May Allah accept it from us and you.",
        });
      }
    }
  };

  // Reset current checklist
  const resetChecklist = () => {
    if (!currentEidType) return;
    
    // Completely restore defaults
    const updatedData = { ...checklistData };
    updatedData[currentEidType] = defaultChecklistItems
      .filter(item => item.eidSpecific === 'both' || item.eidSpecific === currentEidType)
      .map(item => ({ ...item, checked: false }));
      
    setChecklistData(updatedData);
    saveChecklistData(updatedData);

    toast({
      title: "Restored Defaults",
      description: "Custom tasks removed and official tasks reset.",
    });
  };

  // Auto-reset when new Eid period begins
  useEffect(() => {
    if (currentEidType) {
      const today = new Date().toDateString();
      const lastResetKey = `eid-checklist-last-reset-${currentEidType}`;
      const lastReset = localStorage.getItem(lastResetKey);
      
      if (lastReset !== today) {
        // Check if this is the first day of Eid
        const isFirstDay = (currentEidType === 'fitr' && isEidAlFitr) || 
                         (currentEidType === 'adha' && isEidAlAdha);
        
        if (isFirstDay) {
          const updatedData = { ...checklistData };
          updatedData[currentEidType] = updatedData[currentEidType].map(item => ({ ...item, checked: false }));
          setChecklistData(updatedData);
          saveChecklistData(updatedData);
          localStorage.setItem(lastResetKey, today);
        }
      }
    }
  }, [currentEidType, isEidAlFitr, isEidAlAdha, checklistData]);

  // Get Eid title and greeting
  const getEidInfo = () => {
    if (!islamicInfo) return null;
    
    const hijriMonth = islamicInfo.hijriMonth;
    const hijriDay = islamicInfo.hijriDay;
    
    if (currentEidType === 'fitr') {
      return {
        title: 'Eid al-Fitr',
        greeting: 'Eid al-Fitr Mubarak',
        subtitle: 'Festival of Breaking the Fast'
      };
    } else if (currentEidType === 'adha') {
      return {
        title: 'Eid al-Adha',
        greeting: 'Eid al-Adha Mubarak',
        subtitle: 'Festival of Sacrifice'
      };
    } else if (hijriMonth === 9 && (hijriDay === 29 || hijriDay === 30)) {
      return {
        title: 'Prepare for Eid',
        greeting: 'Eid Preparation',
        subtitle: 'Get ready for Eid al-Fitr'
      };
    }
    return null;
  };

  const eidInfo = getEidInfo();

  // If not in Eid period or preparation night, show message
  if (!currentEidType && !isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col">
          <AppBar title="Eid Checklist" showBack={true} transparent border-0 />
          
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm relative overflow-hidden rounded-[40px] p-8 text-center"
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e]/20 via-[#0d1b40]/20 to-black/40 backdrop-blur-xl border border-white/10"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="inline-flex p-5 bg-[#e0c097]/10 rounded-3xl border border-[#e0c097]/20">
                  <Calendar className="w-10 h-10 text-[#e0c097]" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Soon, InshaAllah!</h2>
                  <p className="text-white/60 text-sm leading-relaxed">
                    The Eid checklist becomes available on the last day of Ramadan and during the days of Eid.
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/services')}
                    className="w-full h-12 rounded-2xl border-white/10 hover:bg-white/5 text-[#e0c097]"
                  >
                    Explore other services
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isLoading || !eidInfo) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-32">
          <AppBar title="Eid Checklist" showBack={true} />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const categories = [
    { id: 'mandatory', label: 'Mandatory', icon: CheckCircle2, color: 'text-red-500 bg-red-500/10' },
    { id: 'sunnah', label: 'Sunnah', icon: Sparkles, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'prep', label: 'Preparation', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0a0c] pb-32">
        <AppBar title="Eid Checklist" showBack={true} transparent className="border-0" />

        <div className="max-w-xl mx-auto p-4 space-y-8 mt-2">
          {/* Eid Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[40px] shadow-2xl p-8 group"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] via-[#0d1b40] to-black"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e0c097]/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-4">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <Moon className="w-8 h-8 text-[#e0c097]" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                {eidInfo.greeting}
              </h1>
              <p className="text-[#e0c097]/80 text-lg italic">
                {eidInfo.subtitle}
              </p>

              <div className="flex flex-col items-center pt-2 gap-6">
                {/* Minimal Progress Ring */}
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="364.4"
                      initial={{ strokeDashoffset: 364.4 }}
                      animate={{ strokeDashoffset: 364.4 - (364.4 * completionPercentage) / 100 }}
                      className="text-[#e0c097]"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{completionPercentage}%</span>
                    <span className="text-[10px] uppercase tracking-tighter text-white/40">Complete</span>
                  </div>
                </div>

                {/* Add Task Trigger */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl px-6 backdrop-blur-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Personal Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#121217] border-white/10 text-white rounded-[32px] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Custom Preparation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-text">What needs to be done?</Label>
                        <Input 
                          id="task-text"
                          placeholder="e.g. Call relatives, Buy sweets..."
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          className="bg-white/5 border-white/10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select 
                          value={newTaskCategory} 
                          onValueChange={(v: any) => setNewTaskCategory(v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121217] border-white/10 text-white">
                            <SelectItem value="mandatory">Mandatory</SelectItem>
                            <SelectItem value="sunnah">Sunnah</SelectItem>
                            <SelectItem value="prep">General Preparation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={addTask}
                        className="bg-[#e0c097] text-black hover:bg-[#d4af37] w-full rounded-xl"
                      >
                        Add to Checklist
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </motion.div>

          {/* Checklist Sections */}
          <div className="space-y-10">
            {categories.map((cat, catIdx) => {
              const items = currentChecklist.filter(item => item.category === cat.id);
              if (items.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className={cn("p-2 rounded-xl", cat.color)}>
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#e0c097]">{cat.label}</h2>
                    <div className="flex-1 h-[1px] bg-[#e0c097]/10"></div>
                  </div>

                  <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: (catIdx * 0.2) + (idx * 0.1) }}
                          className={cn(
                            "group relative overflow-hidden rounded-[24px] p-[1px] transition-all duration-300",
                            item.checked ? "opacity-60" : "scale-100"
                          )}
                        >
                          {/* Animated Border */}
                          <div className={cn(
                            "absolute inset-0 bg-gradient-to-r transition-opacity duration-300",
                            item.checked 
                              ? "from-emerald-500/20 to-emerald-500/10" 
                              : "from-white/10 to-transparent hover:from-[#e0c097]/30"
                          )}></div>

                          <div 
                            className="relative bg-[#16161a] rounded-[23px] p-5 flex items-center gap-4 cursor-pointer"
                            onClick={() => handleCheckboxChange(item.id, !item.checked)}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                              item.checked ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40 group-hover:text-white"
                            )}>
                              {item.checked ? (
                                <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-300" />
                              ) : (
                                <item.icon className="w-6 h-6" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-base font-medium transition-all duration-300",
                                item.checked ? "text-white/20 line-through" : "text-white"
                              )}>
                                {item.text}
                              </p>
                            </div>

                            {/* Action Area (Hover or Right Side) */}
                            <div className="flex items-center gap-2">
                              {!item.checked && (
                                <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#e0c097]/50 transition-colors">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#e0c097]"></div>
                                </div>
                              )}
                              
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => deleteTask(e, item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset Action */}
          <div className="flex flex-col items-center gap-6 pt-10">
            {completionPercentage === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <PartyPopper className="w-12 h-12 text-[#e0c097]" />
                <p className="text-white font-bold text-center">Truly a Blessed Eid!</p>
              </motion.div>
            )}

            <Button
              variant="ghost"
              onClick={resetChecklist}
              className="text-[#e0c097]/40 hover:text-[#e0c097] hover:bg-white/5 rounded-2xl px-8"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset All Tasks
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
