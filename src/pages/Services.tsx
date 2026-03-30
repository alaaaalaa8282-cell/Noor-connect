import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { useIslamicCalendar } from "@/hooks/useIslamicCalendar";
import {
    MessageCircle, Radio, Target, Heart, Calculator,
    Star, Trophy, Coins, Calendar, Library, Tv, Sparkles, HeartHandshake, BookOpen, BookText, Moon, Headphones,
    CheckCircle, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Services() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { isEidAlFitr, isEidAlAdha, islamicInfo, isLoading } = useIslamicCalendar();

    // Determine if Fitrana Calculator should be shown (only 1 week before Eid al-Fitr)
    const shouldShowFitranaCalculator = (() => {
        if (isLoading || !islamicInfo) return false;
        
        const hijriMonth = islamicInfo.hijriMonth;
        const hijriDay = islamicInfo.hijriDay;
        
        // Only show 1 week before Eid al-Fitr (23-30 Ramadan)
        if (hijriMonth === 9 && hijriDay >= 23) return true;
        
        return false;
    })();

    // Determine if Eid checklist should be shown (1 week before, during, 1 week after Eid)
    const shouldShowEidChecklist = (() => {
        if (isLoading || !islamicInfo) return false;
        
        const hijriMonth = islamicInfo.hijriMonth;
        const hijriDay = islamicInfo.hijriDay;
        
        // 1 week before Eid al-Fitr (23-30 Ramadan)
        if (hijriMonth === 9 && hijriDay >= 23) return true;
        
        // Eid al-Fitr period (1-3 Shawwal)
        if (isEidAlFitr && hijriMonth === 10 && hijriDay <= 3) return true;
        
        // 1 week after Eid al-Fitr (4-10 Shawwal)
        if (hijriMonth === 10 && hijriDay >= 4 && hijriDay <= 10) return true;
        
        // 1 week before Eid al-Adha (3-9 Dhul Hijjah)
        if (hijriMonth === 12 && hijriDay >= 3 && hijriDay <= 9) return true;
        
        // Eid al-Adha period (10-12 Dhul Hijjah)
        if (isEidAlAdha && hijriMonth === 12 && hijriDay >= 10 && hijriDay <= 12) return true;
        
        // 1 week after Eid al-Adha (13-19 Dhul Hijjah)
        if (hijriMonth === 12 && hijriDay >= 13 && hijriDay <= 19) return true;
        
        return false;
    })();

    const baseServices = [
        { title: "Salah Tracker", path: "/prayer-stats", icon: CheckCircle, gradient: 'from-[#f59e0b] to-[#b45309]' },
        { title: "Qaza Tracker", path: "/qaza", icon: AlertTriangle, gradient: 'from-[#f43f5e] to-[#be123c]' },
        { title: "Quran Audio", path: "/quran-audio", icon: Headphones, gradient: 'from-[#10b981] to-[#047857]' },
        { title: "Live", path: "/live", icon: Tv, gradient: 'from-[#f43f5e] to-[#be123c]' },
        { title: "Hadith Collections", path: "/hadith/collections", icon: BookText, gradient: 'from-[#6366f1] to-[#4338ca]' },
        { title: "Radio", path: "/quran-radio", icon: Radio, gradient: 'from-[#3b82f6] to-[#1d4ed8]' },
        { title: "Habits", path: "/habit-tracker", icon: Target, gradient: 'from-[#14b8a6] to-[#0f766e]' },
        { title: "Duas", path: "/duas", icon: Heart, gradient: 'from-[#ec4899] to-[#be185d]' },
        { title: "Remedies", path: "/islamic-remedies", icon: HeartHandshake, gradient: 'from-[#a855f7] to-[#7e22ce]' },
        { title: t('tasbih'), path: "/tasbeeh", icon: Calculator, gradient: 'from-[#f97316] to-[#c2410c]' },
        { title: "Names", path: "/names-of-allah", icon: Star, gradient: 'from-[#eab308] to-[#b45309]' },
        { title: "Quiz", path: "/quiz", icon: Trophy, gradient: 'from-[#f59e0b] to-[#b45309]' },
        { title: "Zakat", path: "/zakat", icon: Coins, gradient: 'from-[#06b6d4] to-[#0e7490]' },
        { title: "Calendar", path: "/calendar", icon: Calendar, gradient: 'from-[#0ea5e9] to-[#0369a1]' },
        { title: "E-Books", path: "/ebooks", icon: Library, gradient: 'from-[#8b5cf6] to-[#6d28d9]' },
        { title: "Tafsir", path: "/tafsir", icon: BookOpen, gradient: 'from-[#059669] to-[#064e3b]' },
    ];

    // Add conditional services based on timing
    const conditionalServices = [];
    
    if (shouldShowFitranaCalculator) {
        conditionalServices.push(
            { title: "Fitrana Calculator", path: "/fitrana-calculator", icon: Calculator, gradient: 'from-[#10b981] to-[#047857]' }
        );
    }
    
    if (shouldShowEidChecklist) {
        conditionalServices.push(
            { title: "Eid Checklist", path: "/eid-checklist", icon: Moon, gradient: 'from-[#f59e0b] to-[#b45309]' }
        );
    }

    // Combine base services with conditional ones
    const services = [
        ...baseServices.slice(0, 6), // First 6 services
        ...conditionalServices,
        ...baseServices.slice(6) // Remaining services
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
                <AppBar title="Services" showBack={true} />

                {/* Premium Featured Header Card */}
                <div className="px-4 sm:px-5 pt-4 mb-6">
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1a4a4a] via-[#2c6e6e] to-[#b38b5d] p-6 sm:p-8 shadow-xl shadow-teal-900/10 group">
                        {/* Elegant Light Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#b38b5d]/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-[#e0c097]" />
                                <span className="text-white/90 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">Assalamu Alaikum</span>
                            </div>
                            <h2 className="text-3xl font-black text-white leading-tight tracking-tight drop-shadow-md">Islamic Hub</h2>
                            <p className="text-white/80 text-sm mt-2 font-medium max-w-[90%] leading-relaxed">Explore a complete collection of spiritual tools, thoughtfully designed for your journey.</p>
                        </div>

                        {/* Decorative Bottom Stripe */}
                        <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#e0c097]/70 to-transparent"></div>
                    </div>
                </div>

                {/* Premium Services Grid Container */}
                <div className="px-4 sm:px-5 relative">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <AnimatePresence>
                            {services.map((item, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03, duration: 0.4, ease: "easeOut" }}
                                    className="group relative flex items-center justify-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-[20px] shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left"
                                    onClick={() => navigate(item.path)}
                                >
                                    {/* Icon Box with Vibrant Gradient */}
                                    <div className={`shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] bg-gradient-to-br ${item.gradient} shadow-md shadow-black/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                        <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>

                                    {/* Title Container */}
                                    <div className="flex-1 min-w-0 pr-1">
                                        <h3 className="font-bold text-[12.5px] sm:text-[14px] text-slate-800 dark:text-slate-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-400 transition-all leading-tight truncate">
                                            {item.title}
                                        </h3>
                                    </div>
                                    
                                    {/* Dynamic Glow Effect */}
                                    <div className={`absolute -inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${item.gradient} transition-opacity duration-300 pointer-events-none`} />
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Mark */}
                <div className="px-8 mt-16 text-center opacity-50 pb-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Noor Connect • Tools
                    </p>
                </div>
            </div>
        </PageTransition>
    );
}
