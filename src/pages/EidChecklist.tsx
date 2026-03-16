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
  CheckCircle, 
  RotateCcw,
  Calendar,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  eidSpecific?: 'fitr' | 'adha' | 'both';
}

interface EidChecklistData {
  fitr: ChecklistItem[];
  adha: ChecklistItem[];
}

const defaultChecklistItems: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'ghusl', text: 'Perform Ghusl (ritual bath)', eidSpecific: 'both' },
  { id: 'eid-prayer', text: 'Attend Eid prayer', eidSpecific: 'both' },
  { id: 'fitrana', text: 'Pay Fitrana (Zakat al-Fitr)', eidSpecific: 'fitr' },
  { id: 'best-clothes', text: 'Wear best clothes', eidSpecific: 'both' },
  { id: 'ittar', text: 'Apply ittar (perfume)', eidSpecific: 'both' },
  { id: 'dates', text: 'Eat dates before prayer', eidSpecific: 'both' },
  { id: 'greet-family', text: 'Greet family with "Eid Mubarak"', eidSpecific: 'both' },
  { id: 'charity', text: 'Give charity (Sadaqa)', eidSpecific: 'both' },
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
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading checklist data:', error);
    }
    
    // Return default data
    return {
      fitr: defaultChecklistItems.map(item => ({ ...item, checked: false })),
      adha: defaultChecklistItems.map(item => ({ ...item, checked: false }))
    };
  };

  const [checklistData, setChecklistData] = useState<EidChecklistData>(loadChecklistData);

  // Get current checklist based on Eid type
  const currentChecklist = useMemo(() => {
    if (!currentEidType) return [];
    return checklistData[currentEidType].filter(item => 
      item.eidSpecific === 'both' || item.eidSpecific === currentEidType
    );
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
      
      // Show completion toast if all items are checked
      if (checked && completionPercentage === 100) {
        toast({
          title: "🎉 Eid Mubarak!",
          description: "You've completed all Eid preparations!",
        });
      }
    }
  };

  // Reset current checklist
  const resetChecklist = () => {
    if (!currentEidType) return;
    
    const updatedData = { ...checklistData };
    updatedData[currentEidType] = updatedData[currentEidType].map(item => ({ ...item, checked: false }));
    setChecklistData(updatedData);
    saveChecklistData(updatedData);
    
    toast({
      title: "Checklist Reset",
      description: "Eid checklist has been reset.",
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
        <div className="min-h-screen bg-background pb-32">
          <AppBar title="Eid Checklist" showBack={true} />
          
          <div className="max-w-lg mx-auto p-4">
            <Card className="text-center p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Eid Checklist Not Available</h2>
                <p className="text-muted-foreground">
                  The Eid checklist is only available during Eid periods and on the last night of Ramadan.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/services')}
                  className="mt-4"
                >
                  Back to Services
                </Button>
              </div>
            </Card>
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32">
        <AppBar title="Eid Checklist" showBack={true} />

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Eid Header Card */}
          <div className="relative overflow-hidden rounded-[28px] shadow-[var(--elevation-4)] transition-all duration-500 hover:shadow-[var(--elevation-6)] group">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#e0c097] via-[#d4af37] to-[#b38b5d] opacity-100"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent opacity-60 animate-pulse"></div>

            {/* Islamic Decorative Elements */}
            <div className="absolute top-4 right-4">
              <Moon className="w-6 h-6 text-white/80" />
            </div>
            <div className="absolute top-4 right-12">
              <Star className="w-4 h-4 text-white/60" />
            </div>
            <div className="absolute bottom-4 left-4">
              <Star className="w-3 h-3 text-white/40" />
            </div>

            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-white/90" />
                <span className="text-sm font-medium uppercase tracking-wider text-white/80">
                  {eidInfo.title}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{eidInfo.greeting}</h1>
              <p className="text-white/70 text-sm">{eidInfo.subtitle}</p>
            </div>

            {/* Bottom Gradient Line */}
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
          </div>

          {/* Progress Card */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Progress</h3>
                <span className="text-sm font-medium text-primary">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentChecklist.filter(item => item.checked).length} of {currentChecklist.length} completed</span>
                {completionPercentage === 100 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Complete!</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Checklist Items */}
          <Card className="p-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Eid Preparation Checklist</CardTitle>
              <CardDescription>
                Complete these important Eid preparations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentChecklist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={item.id}
                    className={`flex-1 text-sm leading-relaxed cursor-pointer ${
                      item.checked ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.text}
                  </label>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={resetChecklist}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Checklist
            </Button>
          </div>

          {/* Islamic Decorative Elements */}
          <div className="flex justify-center space-x-8 pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Moon className="w-4 h-4" />
              <span className="text-xs">Eid Mubarak</span>
              <Star className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
