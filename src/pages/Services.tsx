import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    MessageCircle, Radio, Target, Heart, Calculator,
    Star, Trophy, Coins, Calendar, Library, Tv, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export default function Services() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const services = [
        { title: "Live", desc: "Makkah/Madinah", path: "/live", icon: Tv, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
        { title: "Hadith", desc: "Daily Wisdom", path: "/hadith", icon: MessageCircle, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
        { title: "Radio", desc: "Quran 24/7", path: "/quran-radio", icon: Radio, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
        { title: "Habits", desc: "Dhikr/Salat", path: "/habit-tracker", icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { title: "Duas", desc: "Fortress", path: "/duas", icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
        { title: t('tasbih'), desc: "Digital", path: "/tasbeeh", icon: Calculator, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
        { title: "Names", desc: "Attributes", path: "/names-of-allah", icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
        { title: "Quiz", desc: "Islamic", path: "/quiz", icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
        { title: "Zakat", desc: "Calculator", path: "/zakat", icon: Coins, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
        { title: "Calendar", desc: "Hijri", path: "/calendar", icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { title: "E-Books", desc: "Library", path: "/ebooks", icon: Library, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-background pb-32">
                <AppBar title="Services" />

                {/* Featured Header Card */}
                <div className="px-5 pt-4 mb-6">
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1a4a4a] via-[#2c6e6e] to-primary/80 p-6 shadow-lg shadow-primary/10 group">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-white/90 text-[10px] font-bold uppercase tracking-widest">Premium Content</span>
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight">Islamic Tools</h2>
                            <p className="text-white/80 text-[11px] mt-1 font-medium max-w-[200px]">Everything for your journey.</p>
                        </div>
                    </div>
                </div>

                {/* Services Grid (Square Box Shape) */}
                <div className="px-5">
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-4">
                        {services.map((item, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative flex flex-col items-center justify-center aspect-square bg-card border border-border/40 rounded-[24px] hover:bg-muted/30 transition-all duration-300 active:scale-[0.95] shadow-sm overflow-hidden"
                                onClick={() => navigate(item.path)}
                            >
                                {/* Background Decoration */}
                                <div className={`absolute -right-4 -top-4 w-12 h-12 ${item.bgColor} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                                <div className={`p-4 rounded-2xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300 mb-3 shadow-inner`}>
                                    <item.icon className="w-6 h-6" strokeWidth={2.5} />
                                </div>

                                <div className="text-center px-2">
                                    <h3 className="font-bold text-[13px] group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                                    <p className="text-muted-foreground text-[9px] mt-0.5 font-medium">{item.desc}</p>
                                </div>

                                {/* Corner Dot */}
                                <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${item.color.replace('text', 'bg')} opacity-40`} />
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="px-8 mt-10 text-center">
                    <p className="text-xs text-muted-foreground/40 italic">
                        Exploring the knowledge of Deen.
                    </p>
                </div>
            </div>
        </PageTransition>
    );
}
