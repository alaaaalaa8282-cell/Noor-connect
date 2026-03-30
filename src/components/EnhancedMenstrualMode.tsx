/**
 * Enhanced Menstrual Mode Features
 * Comprehensive support for women during their menstrual cycle
 */

import { useState, useEffect } from 'react';
import { Heart, Droplets, Moon, Sun, Thermometer, Activity, BookOpen, Brain, Flower2, Calendar, Clock, AlertCircle, Bell, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export interface MenstrualSymptoms {
  cramps: number; // 0-5 scale
  headaches: number; // 0-5 scale
  fatigue: number; // 0-5 scale
  mood: number; // 0-5 scale
  bloating: number; // 0-5 scale
  breastTenderness: number; // 0-5 scale
  backache: number; // 0-5 scale
  acne: number; // 0-5 scale
}

export interface CyclePhase {
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'premenstrual';
  day: number;
  symptoms: MenstrualSymptoms;
  recommendations: string[];
}

export interface WellnessTips {
  nutrition: string[];
  exercise: string[];
  mentalHealth: string[];
  spiritual: string[];
  selfCare: string[];
}

const symptomLabels = {
  cramps: 'Cramps',
  headaches: 'Headaches', 
  fatigue: 'Fatigue',
  mood: 'Mood Changes',
  bloating: 'Bloating',
  breastTenderness: 'Breast Tenderness',
  backache: 'Backache',
  acne: 'Acne'
};

const symptomIcons = {
  cramps: Droplets,
  headaches: AlertCircle,
  fatigue: Moon,
  mood: Heart,
  bloating: Activity,
  breastTenderness: Flower2,
  backache: Thermometer,
  acne: Sun
};

const phaseRecommendations = {
  menstrual: {
    nutrition: [
      'Increase iron-rich foods: spinach, red meat, lentils, beans, fortified cereals',
      'Stay hydrated with warm water, herbal teas (chamomile, ginger, peppermint)',
      'Eat dark chocolate (70%+) for magnesium and mood boost',
      'Include omega-3 fatty acids: salmon, walnuts, flaxseeds, chia seeds',
      'Add vitamin C foods to boost iron absorption: oranges, strawberries, bell peppers',
      'Consume warm soups and stews for comfort and nourishment',
      'Avoid cold drinks and raw foods in Traditional Chinese Medicine practice',
      'Limit caffeine and alcohol which can worsen cramps',
      'Eat small, frequent meals to maintain energy levels',
      'Include turmeric and ginger for natural anti-inflammatory benefits'
    ],
    exercise: [
      'Gentle restorative yoga poses: Child\'s pose, Cat-Cow, Legs up the wall',
      'Light walking (20-30 minutes) to boost circulation',
      'Pelvic floor exercises and Kegels for muscle support',
      'Stretching and foam rolling for lower back relief',
      'Avoid high-intensity workouts, HIIT, and heavy lifting',
      'Try Tai Chi or Qi Gong for gentle movement',
      'Swimming in warm water can be very soothing',
      'Rest completely on heavy flow days if needed',
      'Practice deep breathing exercises combined with light stretching',
      'Gentle hip openers and forward folds for cramp relief'
    ],
    mentalHealth: [
      'Practice meditation and deep breathing exercises',
      'Allow yourself to rest without guilt - this is self-care',
      'Journal your thoughts, feelings, and symptoms',
      'Take warm baths with Epsom salts and essential oils',
      'Use affirmations: "My body is doing what it\'s meant to do"',
      'Practice self-compassion and patience',
      'Listen to calming music or nature sounds',
      'Connect with supportive female friends or family',
      'Consider talking to a therapist if emotions feel overwhelming',
      'Practice mindful acceptance of your body\'s natural rhythms'
    ],
    spiritual: [
      'Focus on personal dhikr and reflection - Allah is always near',
      'Read Quran at a comfortable pace, even just one verse',
      'Make sincere dua for ease, comfort, and acceptance',
      'Listen to peaceful Quran recitations and nasheeds',
      'Practice gratitude for your body\'s amazing capabilities',
      'Remember: Allah created this system with wisdom and purpose',
      'Use this time for spiritual introspection and self-growth',
      'Read Islamic books about women\'s health and spirituality',
      'Make dhikr while resting: SubhanAllah, Alhamdulillah, Allahu Akbar',
      'Connect with Allah through quiet contemplation'
    ],
    selfCare: [
      'Use heating pads or hot water bottles on lower abdomen',
      'Wear comfortable, loose, breathable cotton clothing',
      'Get extra sleep (8-9 hours) and take naps when needed',
      'Practice gentle self-massage on feet, hands, and abdomen',
      'Apply essential oils: lavender, clary sage, peppermint (diluted)',
      'Keep a hot drink nearby: ginger tea, cinnamon tea, warm milk',
      'Use period products that feel comfortable: pads, cups, or tampons',
      'Create a cozy rest space with blankets and pillows',
      'Take warm showers to relax muscles',
      'Apply castor oil packs for deep cramp relief'
    ]
  },
  follicular: {
    nutrition: [
      'Eat fresh fruits and vegetables for vitamins and antioxidants',
      'Include probiotic-rich foods: yogurt, kefir, sauerkraut, kimchi',
      'Focus on light, nourishing meals with whole grains',
      'Stay well hydrated with 8-10 glasses of water daily',
      'Add lean proteins: chicken, fish, tofu, legumes',
      'Include fermented foods for gut health',
      'Eat sprouted grains and seeds for vitality',
      'Add fresh herbs: parsley, cilantro, mint for detoxification',
      'Consume foods rich in B vitamins for energy',
      'Try new healthy recipes and experiment in kitchen'
    ],
    exercise: [
      'Moderate cardio: jogging, cycling, swimming',
      'Strength training and weight lifting - build muscle',
      'Dancing, aerobics, and fun group fitness classes',
      'Outdoor activities: hiking, cycling, tennis',
      'Try new sports or fitness challenges',
      'High-energy workout videos at home',
      'Join group fitness classes for motivation',
      'Practice yoga flows that build heat and strength',
      'Start a new fitness routine or program',
      'Set fitness goals for this energetic phase'
    ],
    mentalHealth: [
      'Engage in social activities and reconnect with friends',
      'Start new creative projects and pursue hobbies',
      'Learn new skills or take up a class',
      'Use positive affirmations about growth and new beginnings',
      'Plan and organize your goals for the month',
      'Take on new challenges at work or school',
      'Practice visualization for your dreams and aspirations',
      'Express yourself through art, writing, or music',
      'Try new experiences and step out of comfort zone',
      'Build confidence through achievement and growth'
    ],
    spiritual: [
      'Increase voluntary prayers (Nafl) and Sunnah prayers',
      'Attend study circles and Islamic lectures',
      'Teach others what you\'ve learned about Islam',
      'Engage in community service and volunteering',
      'Read Islamic books and expand your knowledge',
      'Memorize new Quran verses or Surahs',
      'Attend congregational prayers at the masjid',
      'Make dua for growth in all areas of life',
      'Practice fasting on Mondays and Thursdays (Sunnah)',
      'Engage in charitable giving and helping others'
    ],
    selfCare: [
      'Establish or refresh skincare routines',
      'Try new hair care treatments and styles',
      'Plan and set goals for the upcoming month',
      'Spring clean your living space and declutter',
      'Shop for new clothes or update your wardrobe',
      'Experiment with new makeup looks',
      'Organize your schedule and productivity systems',
      'Try new beauty treatments or self-care rituals',
      'Plan social outings and gatherings with friends',
      'Refresh your environment with plants or flowers'
    ]
  },
  ovulatory: {
    nutrition: [
      'Eat antioxidant-rich foods: berries, dark leafy greens, nuts',
      'Include healthy fats: avocado, olive oil, nuts, seeds',
      'Focus on high-quality protein and colorful vegetables',
      'Avoid processed foods, excess sugar, and trans fats',
      'Add foods that support hormone balance: maca, flaxseeds',
      'Eat raw or lightly cooked vegetables for enzymes',
      'Include fiber-rich foods for digestive health',
      'Stay hydrated with infused water and herbal teas',
      'Consume foods rich in zinc: pumpkin seeds, oysters, beef',
      'Try light, fresh meals that don\'t weigh you down'
    ],
    exercise: [
      'High-intensity interval training (HIIT) workouts',
      'Sports and competitive team activities',
      'Dance classes: salsa, hip-hop, contemporary',
      'Adventure activities: rock climbing, kayaking',
      'Push your limits with challenging workouts',
      'Try power yoga or hot yoga sessions',
      'Engage in group fitness challenges',
      'Play competitive sports with friends',
      'Set personal records in your exercises',
      'Cross-training and varied workout routines'
    ],
    mentalHealth: [
      'Attend social gatherings and networking events',
      'Take on public speaking or presentation opportunities',
      'Engage in leadership activities and roles',
      'Practice confidence-building exercises and affirmations',
      'Express yourself clearly and communicate effectively',
      'Connect with others and build relationships',
      'Feel confident in your appearance and presence',
      'Take on challenges that require courage',
      'Practice assertiveness and setting boundaries',
      'Celebrate your strengths and capabilities'
    ],
    spiritual: [
      'Engage in intense worship with full energy',
      'Practice night prayers (Tahajjud) and Qiyam',
      'Increase charitable activities and giving',
      'Attend spiritual retreats or Islamic programs',
      'Make heartfelt dua for your deepest needs',
      'Read Quran with deep reflection (Tadabbur)',
      'Engage in dhikr with full presence and energy',
      'Teach others about Islam with confidence',
      'Participate actively in community events',
      'Seek knowledge and attend intensive courses'
    ],
    selfCare: [
      'Dress up and feel beautiful in your favorite outfits',
      'Express yourself through photography and art',
      'Plan date nights or social outings',
      'Celebrate your achievements and milestones',
      'Try new beauty treatments or spa services',
      'Experiment with new hairstyles or looks',
      'Take professional photos or update your portfolio',
      'Plan romantic or special experiences',
      'Feel confident and radiant in your appearance',
      'Treat yourself to special experiences'
    ]
  },
  luteal: {
    nutrition: [
      'Increase complex carbohydrates: sweet potatoes, quinoa, oats',
      'Eat calcium-rich foods: dairy, leafy greens, sesame seeds',
      'Include vitamin B6 foods: bananas, chickpeas, tuna',
      'Reduce caffeine and sugar to minimize mood swings',
      'Add magnesium-rich foods: dark chocolate, almonds, spinach',
      'Eat smaller, more frequent meals to maintain blood sugar',
      'Include tryptophan foods for serotonin: turkey, eggs, nuts',
      'Stay hydrated but limit fluid retention with potassium',
      'Avoid overly salty processed foods',
      'Focus on grounding, warming foods and soups'
    ],
    exercise: [
      'Moderate, consistent exercise without overexertion',
      'Pilates and core strengthening work',
      'Swimming and water activities for low impact',
      'Nature walks and gentle hiking',
      'Restorative yoga and gentle stretching',
      'Avoid extreme workouts that increase stress',
      'Focus on movement that feels good, not punishing',
      'Practice yoga for PMS symptom relief',
      'Try gentle barre or ballet-inspired workouts',
      'Listen to your body and reduce intensity as needed'
    ],
    mentalHealth: [
      'Practice stress management: meditation, deep breathing',
      'Engage in creative expression and artistic pursuits',
      'Spend time in nature for grounding and calm',
      'Use aromatherapy: lavender, chamomile, ylang-ylang',
      'Practice emotional awareness and acceptance',
      'Journal about feelings without judgment',
      'Create a calming evening routine',
      'Limit stressful commitments and social obligations',
      'Practice self-soothing techniques',
      'Connect with supportive people who understand'
    ],
    spiritual: [
      'Maintain consistent daily prayer routine',
      'Practice gratitude journaling: count your blessings',
      'Engage in forgiveness exercises for peace',
      'Deep reflection and introspection on life',
      'Read Quran for comfort and wisdom',
      'Make dua for patience and emotional stability',
      'Practice patience (Sabr) during challenging moments',
      'Remember Allah\'s mercy and compassion',
      'Connect with Allah through istighfar (seeking forgiveness)',
      'Read about the stories of strong Muslim women'
    ],
    selfCare: [
      'Establish comfort routines that feel nurturing',
      'Take aromatherapy baths with calming essential oils',
      'Read books and enjoy quiet, peaceful time',
      'Prepare for the next cycle: stock supplies, plan rest days',
      'Practice gentle abdominal massage',
      'Apply warm compresses before cramps start',
      'Create a cozy, comforting home environment',
      'Limit screen time and practice digital detox',
      'Engage in hobbies that bring joy and relaxation',
      'Nurture yourself as you would a dear friend'
    ]
  },
  premenstrual: {
    nutrition: [
      'Reduce salt and processed foods to minimize bloating',
      'Increase magnesium-rich foods: leafy greens, nuts, seeds',
      'Eat complex carbs to boost serotonin: oats, quinoa, sweet potatoes',
      'Stay hydrated with herbal teas: chamomile, raspberry leaf',
      'Add vitamin E foods for breast health: almonds, sunflower seeds',
      'Include omega-3s to reduce inflammation and mood swings',
      'Avoid alcohol which can worsen PMS symptoms',
      'Eat calcium-rich foods to reduce mood symptoms',
      'Try seed cycling: pumpkin and sunflower seeds',
      'Focus on warming, grounding foods and spices'
    ],
    exercise: [
      'Gentle stretching and restorative yoga poses',
      'Walking and light cardio for mood boost',
      'Yoga for PMS: forward folds, twists, gentle inversions',
      'Tai Chi for gentle movement and stress relief',
      'Swimming in warm water for full body relaxation',
      'Avoid high-intensity workouts if feeling fatigued',
      'Focus on movement that feels supportive, not strenuous',
      'Practice deep breathing with gentle stretches',
      'Try yin yoga for deep relaxation',
      'Listen to your body and rest when needed'
    ],
    mentalHealth: [
      'Practice stress reduction: mindfulness, meditation',
      'Track your mood patterns and emotional changes',
      'Seek counseling or therapy if PMS is severe (PMDD)',
      'Join support groups for women with PMS challenges',
      'Practice emotional regulation techniques',
      'Use cognitive behavioral strategies for negative thoughts',
      'Prepare loved ones that you may need extra support',
      'Practice radical self-acceptance',
      'Remind yourself: these feelings are temporary',
      'Create a PMS self-care emergency kit'
    ],
    spiritual: [
      'Simplify worship routines: focus on quality over quantity',
      'Increase dhikr for calm and centering',
      'Read comforting Quran verses about patience and ease',
      'Seek community support from sisters in faith',
      'Make dua for emotional stability and peace',
      'Read about the mercy and compassion of Allah',
      'Practice contentment (Qana\'ah) with your current state',
      'Remember: Allah understands your struggles',
      'Engage in acts of kindness to boost mood',
      'Listen to soothing Islamic lectures and reminders'
    ],
    selfCare: [
      'Prioritize comfort foods that are also nourishing',
      'Get extra rest and sleep - listen to your body\'s needs',
      'Wear comfortable, loose, non-restrictive clothing',
      'Reduce social obligations and commitments',
      'Create a cozy nest with blankets and comfort items',
      'Practice heat therapy: heating pads, warm baths',
      'Apply essential oils for mood support',
      'Keep healthy snacks readily available',
      'Practice gentle self-massage and acupressure',
      'Treat yourself with extra gentleness and care'
    ]
  }
};

export function EnhancedMenstrualMode() {
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null);
  const [symptoms, setSymptoms] = useState<MenstrualSymptoms>({
    cramps: 0,
    headaches: 0,
    fatigue: 0,
    mood: 0,
    bloating: 0,
    breastTenderness: 0,
    backache: 0,
    acne: 0
  });
  const [wellnessTips, setWellnessTips] = useState<WellnessTips | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'nutrition' | 'exercise' | 'mentalHealth' | 'spiritual' | 'selfCare'>('nutrition');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [moodEntries, setMoodEntries] = useState<Array<{date: string; mood: number; note: string}>>([]);
  const [currentMood, setCurrentMood] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const [reminders, setReminders] = useState<Array<{id: string; time: string; enabled: boolean; label: string}>>([
    { id: '1', time: '09:00', enabled: false, label: 'Morning Check-in' },
    { id: '2', time: '14:00', enabled: false, label: 'Afternoon Wellness' },
    { id: '3', time: '21:00', enabled: false, label: 'Evening Reflection' }
  ]);

  useEffect(() => {
    // Load saved data
    const savedSymptoms = localStorage.getItem('menstrual-symptoms');
    if (savedSymptoms) {
      setSymptoms(JSON.parse(savedSymptoms));
    }
  }, []);

  const updateSymptom = (symptom: keyof MenstrualSymptoms, value: number) => {
    const newSymptoms = { ...symptoms, [symptom]: value };
    setSymptoms(newSymptoms);
    localStorage.setItem('menstrual-symptoms', JSON.stringify(newSymptoms));
    
    // Update recommendations based on symptoms
    updateRecommendations(newSymptoms);
  };

  const updateRecommendations = (currentSymptoms: MenstrualSymptoms) => {
    // Determine phase based on symptoms and cycle day
    const phase = determinePhase(currentSymptoms);
    setCurrentPhase(phase);
    
    // Get recommendations for this phase
    const recommendations = phaseRecommendations[phase.phase];
    setWellnessTips(recommendations);
  };

  const determinePhase = (currentSymptoms: MenstrualSymptoms): CyclePhase => {
    // Simple logic to determine phase based on symptoms
    // In a real app, this would use cycle tracking data
    const totalSymptoms = Object.values(currentSymptoms).reduce((sum, val) => sum + val, 0);
    
    if (currentSymptoms.cramps >= 3 || totalSymptoms >= 20) {
      return {
        phase: 'menstrual',
        day: 1,
        symptoms: currentSymptoms,
        recommendations: phaseRecommendations.menstrual.nutrition
      };
    } else if (currentSymptoms.breastTenderness >= 3 || currentSymptoms.bloating >= 3) {
      return {
        phase: 'premenstrual',
        day: 28,
        symptoms: currentSymptoms,
        recommendations: phaseRecommendations.premenstrual.nutrition
      };
    } else {
      return {
        phase: 'follicular',
        day: 10,
        symptoms: currentSymptoms,
        recommendations: phaseRecommendations.follicular.nutrition
      };
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'bg-gradient-to-br from-rose-500/10 to-rose-600/5 text-rose-600 border-rose-500/20';
      case 'follicular': return 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-500/20';
      case 'ovulatory': return 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-500/20';
      case 'luteal': return 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 text-purple-600 border-purple-500/20';
      case 'premenstrual': return 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 text-orange-600 border-orange-500/20';
      default: return 'bg-gradient-to-br from-gray-500/10 to-gray-600/5 text-gray-600 border-gray-500/20';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'menstrual': return Droplets;
      case 'follicular': return Flower2;
      case 'ovulatory': return Sun;
      case 'luteal': return Moon;
      case 'premenstrual': return AlertCircle;
      default: return Calendar;
    }
  };

  const scrollToWellness = () => {
    document.getElementById('wellness-tips')?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMoodEntry = () => {
    const newEntry = {
      date: new Date().toISOString(),
      mood: currentMood,
      note: moodNote
    };
    const updatedEntries = [...moodEntries, newEntry];
    setMoodEntries(updatedEntries);
    localStorage.setItem('menstrual-mood-entries', JSON.stringify(updatedEntries));
    setMoodNote('');
    toast({
      title: 'Mood Tracked',
      description: `Mood recorded: ${currentMood}/5`
    });
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setReminders(updated);
    const reminder = updated.find(r => r.id === id);
    toast({
      title: reminder?.enabled ? 'Reminder Enabled' : 'Reminder Disabled',
      description: `${reminder?.label} at ${reminder?.time}`
    });
  };

  // Calculate next period prediction
  const getNextPeriodPrediction = () => {
    const cycleLength = 28; // Average cycle length
    const lutealPhase = 14; // Days after ovulation
    const today = new Date();
    const nextPeriod = new Date(today);
    nextPeriod.setDate(today.getDate() + (cycleLength - (currentPhase?.day || 1)));
    return nextPeriod;
  };

  // Get fertility window
  const getFertilityWindow = () => {
    if (!currentPhase) return null;
    const ovulationDay = 14;
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay + 1;
    return { start: fertileStart, end: fertileEnd, ovulation: ovulationDay };
  };

  // Calculate cycle insights
  const getCycleInsights = () => {
    const insights = [];
    if (currentPhase) {
      if (currentPhase.phase === 'menstrual') {
        insights.push('Focus on rest and recovery during your period');
        insights.push('Iron-rich foods are especially important now');
      } else if (currentPhase.phase === 'follicular') {
        insights.push('Great time to start new projects and exercise routines');
        insights.push('Energy levels are rising - take advantage!');
      } else if (currentPhase.phase === 'ovulatory') {
        insights.push('Peak fertility window - best time for conception');
        insights.push('Communication skills are enhanced during this phase');
      } else if (currentPhase.phase === 'luteal') {
        insights.push('Focus on completing tasks and organizing');
        insights.push('Be gentle with yourself as energy decreases');
      } else if (currentPhase.phase === 'premenstrual') {
        insights.push('Practice self-care and stress management');
        insights.push('Reduce caffeine and prioritize sleep');
      }
    }
    return insights;
  };

  // Get Islamic fasting guidance
  const getFastingGuidance = () => {
    if (!currentPhase) return null;
    
    const guidance = {
      canFast: true,
      message: '',
      tips: [] as string[],
      exemptions: [] as string[]
    };

    if (currentPhase.phase === 'menstrual') {
      guidance.canFast = false;
      guidance.message = 'You are exempt from fasting during menstruation';
      guidance.exemptions = [
        'Menstruation is a natural state exempt from fasting',
        'Make up missed fasts after Ramadan when pure',
        'No fidyah (compensation) required for missed fasts due to menstruation',
        'Continue with other acts of worship: dhikr, dua, charity'
      ];
      guidance.tips = [
        'Wake up for suhoor to maintain routine with family',
        'Prepare iftar for others as an act of service',
        'Engage in extra dhikr and Quran reading',
        'Make dua during iftar time when prayers are accepted',
        'Plan your make-up fasts for after Ramadan'
      ];
    } else if (currentPhase.phase === 'premenstrual') {
      guidance.canFast = true;
      guidance.message = 'You can fast, but be mindful of PMS symptoms';
      guidance.tips = [
        'Stay well hydrated during non-fasting hours',
        'Eat nutrient-dense foods at suhoor and iftar',
        'Include magnesium-rich foods to help with mood',
        'Rest more if experiencing fatigue',
        'Break your fast if you feel unwell - health comes first'
      ];
    } else {
      guidance.canFast = true;
      guidance.message = 'You can fast normally during this phase';
      guidance.tips = [
        'Maintain regular suhoor with complex carbs and protein',
        'Stay hydrated between iftar and suhoor',
        'Balance worship with adequate rest',
        'Listen to your body and adjust intensity of activities'
      ];
    }
    
    return guidance;
  };

  // Get symptom severity analysis
  const getSymptomAnalysis = () => {
    const totalSeverity = Object.values(symptoms).reduce((sum, val) => sum + val, 0);
    const maxPossible = Object.keys(symptoms).length * 5;
    const percentage = (totalSeverity / maxPossible) * 100;
    
    if (percentage === 0) return { level: 'none', message: 'No symptoms reported', color: 'text-green-600' };
    if (percentage < 20) return { level: 'mild', message: 'Mild symptoms - manageable day', color: 'text-yellow-600' };
    if (percentage < 40) return { level: 'moderate', message: 'Moderate symptoms - practice self-care', color: 'text-orange-600' };
    if (percentage < 60) return { level: 'significant', message: 'Significant symptoms - prioritize rest', color: 'text-red-500' };
    return { level: 'severe', message: 'Severe symptoms - consider medical consultation', color: 'text-red-700' };
  };

  const PhaseIcon = currentPhase ? getPhaseIcon(currentPhase.phase) : Calendar;

  return (
    <div className="space-y-6">
      {/* Current Phase Display */}
      {currentPhase && (
        <Card className={`p-4 border-2 ${getPhaseColor(currentPhase.phase)}`}>
          <div className="flex items-center gap-3 mb-3">
            <PhaseIcon className="w-6 h-6" />
            <div className="flex-1">
              <h3 className="font-bold capitalize">{currentPhase.phase} Phase</h3>
              <p className="text-sm text-muted-foreground">Day {currentPhase.day} of cycle</p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentPhase.phase}
            </Badge>
          </div>
          
          {/* Cycle Insights */}
          {getCycleInsights().length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-sm font-medium mb-2">💡 Insights:</p>
              <ul className="space-y-1">
                {getCycleInsights().map((insight, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-rose-500">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Symptoms Tracker */}
      <Card className="p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Track Your Symptoms
        </h3>
        <div className="space-y-4">
          {Object.entries(symptoms).map(([symptom, value]) => {
            const Icon = symptomIcons[symptom as keyof typeof symptomIcons];
            return (
              <div key={symptom} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4" />
                    {symptomLabels[symptom as keyof typeof symptomLabels]}
                  </Label>
                  <span className="text-sm font-medium">{value}/5</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newValue]) => updateSymptom(symptom as keyof MenstrualSymptoms, newValue)}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
        
        {/* Symptom Analysis */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Symptom Severity:</span>
            <span className={`text-sm font-bold ${getSymptomAnalysis().color}`}>
              {getSymptomAnalysis().message}
            </span>
          </div>
          <Progress 
            value={Object.values(symptoms).reduce((sum, val) => sum + val, 0) / (Object.keys(symptoms).length * 5) * 100} 
            className="mt-2"
          />
        </div>
      </Card>

      {/* Cycle Predictions */}
      {currentPhase && (
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Cycle Predictions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Next Period Expected</p>
                <p className="text-xs text-muted-foreground">Based on average cycle</p>
              </div>
              <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                {getNextPeriodPrediction().toLocaleDateString()}
              </Badge>
            </div>
            
            {getFertilityWindow() && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Fertility Window</p>
                  <p className="text-xs text-muted-foreground">Best time for conception</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Days {getFertilityWindow()?.start}-{getFertilityWindow()?.end}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Islamic Fasting Guidance */}
      {getFastingGuidance() && (
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Ramadan & Fasting Guidance
          </h3>
          
          <div className={`p-3 rounded-lg mb-3 ${getFastingGuidance()?.canFast ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className={`text-sm font-medium ${getFastingGuidance()?.canFast ? 'text-emerald-700' : 'text-amber-700'}`}>
              {getFastingGuidance()?.canFast ? '✓ You can fast' : '⚠ Fasting exempt'}
            </p>
            <p className="text-sm mt-1">{getFastingGuidance()?.message}</p>
          </div>
          
          {getFastingGuidance()?.exemptions && getFastingGuidance()?.exemptions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-2">Islamic Rulings:</p>
              <ul className="space-y-1">
                {getFastingGuidance()?.exemptions.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span>•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium mb-2">Tips:</p>
            <ul className="space-y-1">
              {getFastingGuidance()?.tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-rose-500">•</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Wellness Recommendations */}
      {wellnessTips && (
        <Card id="wellness-tips" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Wellness Recommendations
            </h3>
            <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nutrition">Nutrition</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="mentalHealth">Mental Health</SelectItem>
                <SelectItem value="spiritual">Spiritual</SelectItem>
                <SelectItem value="selfCare">Self Care</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            {wellnessTips[selectedCategory].map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowCalendar(true)}
          >
            <Calendar className="w-4 h-4" />
            Cycle Calendar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={scrollToWellness}
          >
            <BookOpen className="w-4 h-4" />
            Health Tips
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowMoodTracker(true)}
          >
            <Brain className="w-4 h-4" />
            Mood Tracker
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowReminders(true)}
          >
            <Bell className="w-4 h-4" />
            Reminders
          </Button>
        </div>

        {/* Calendar Modal */}
        {showCalendar && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Cycle Calendar</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCalendar(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => (
                <div key={idx} className="p-2 font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <button
                  key={i}
                  className={`p-2 rounded-lg ${
                    i < 5 ? 'bg-rose-500 text-white' :
                    i < 14 ? 'bg-emerald-100 text-emerald-700' :
                    i < 16 ? 'bg-blue-100 text-blue-700' :
                    i < 25 ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge variant="secondary" className="bg-rose-500 text-white">Period</Badge>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Follicular</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Ovulation</Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Luteal</Badge>
            </div>
          </div>
        )}

        {/* Mood Tracker Modal */}
        {showMoodTracker && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Mood Tracker</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMoodTracker(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">How are you feeling? ({currentMood}/5)</Label>
                <Slider
                  value={[currentMood]}
                  onValueChange={([v]) => setCurrentMood(v)}
                  max={5}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>😔 Low</span>
                  <span>😊 Great</span>
                </div>
              </div>
              <input
                type="text"
                placeholder="Add a note (optional)..."
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <Button 
                onClick={addMoodEntry}
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Track Mood
              </Button>
              {moodEntries.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent Entries</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {moodEntries.slice(-5).reverse().map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                        <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                        <span className="text-rose-600 font-bold">Mood: {entry.mood}/5</span>
                        {entry.note && <span className="text-muted-foreground text-xs">- {entry.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reminders Modal */}
        {showReminders && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Daily Reminders</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReminders(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div 
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-rose-500" />
                    <div>
                      <p className="text-sm font-medium">{reminder.label}</p>
                      <p className="text-xs text-muted-foreground">{reminder.time}</p>
                    </div>
                  </div>
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={() => toggleReminder(reminder.id)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Enable reminders for wellness check-ins throughout the day
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default EnhancedMenstrualMode;