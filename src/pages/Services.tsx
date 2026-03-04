import { useNavigate } from "react-router-dom";
import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext-new";
import {
    MessageCircle, Radio, Target, Heart, Calculator,
    Star, Trophy, Coins, Calendar, Library, Tv, Sparkles, HeartHandshake, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";

export default function Services() {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const services = [
        { title: "Live", path: "/live", icon: Tv, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
        { title: "Hadith", path: "/hadith", icon: MessageCircle, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
        { title: "Radio", path: "/quran-radio", icon: Radio, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
        { title: "Habits", path: "/habit-tracker", icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { title: "Duas", path: "/duas", icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
        { title: "Remedies", path: "/islamic-remedies", icon: HeartHandshake, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
        { title: t('tasbih'), path: "/tasbeeh", icon: Calculator, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
        { title: "Names", path: "/names-of-allah", icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
        { title: "Quiz", path: "/quiz", icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
        { title: "Zakat", path: "/zakat", icon: Coins, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
        { title: "Calendar", path: "/calendar", icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { title: "E-Books", path: "/ebooks", icon: Library, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
        { title: "Tafsir", path: "/tafsir", icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-600/10' },
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-background pb-32">
                <AppBar title="Islamic Services" showBack={true} />

                {/* Featured Header Card - More Compact */}
                <div className="px-5 pt-4 mb-4">
                    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1a4a4a] via-[#2c6e6e] to-primary p-5 shadow-lg shadow-primary/10 group">
                        <div className="absolute -end-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span className="text-white/80 text-[9px] font-bold uppercase tracking-[0.15em]">Assalamu Alaikum</span>
                            </div>
                            <h2 className="text-xl font-black text-white leading-tight">Islamic Services</h2>
                            <p className="text-white/60 text-[10px] mt-0.5 font-medium">Explore tools to strengthen your Iman.</p>
                        </div>
                    </div>
                </div>

                {/* Services Grid (Compact 3-column Box Shape) */}
                <div className="px-5">
                    <div className="grid grid-cols-3 gap-3">
                        {services.map((item, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                className="group relative flex flex-col items-center justify-center aspect-square bg-card/60 backdrop-blur-sm border border-border/30 rounded-[20px] hover:bg-muted/30 transition-all duration-300 active:scale-[0.92] shadow-sm overflow-hidden"
                                onClick={() => navigate(item.path)}
                            >
                                {/* Subtle Hover Glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                <div className={`p-3 rounded-xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-300 mb-2.5 shadow-sm border border-white/20`}>
                                    <item.icon className="w-6 h-6" strokeWidth={2.5} />
                                </div>

                                <div className="text-center px-1">
                                    <h3 className="font-bold text-[11px] group-hover:text-primary transition-colors leading-tight tracking-tight">{item.title}</h3>
                                </div>

                                {/* Bottom Accent */}
                                <div className={`absolute bottom-0 inset-inline-start-1/2 -translate-x-1/2 w-4 h-[2px] ${item.color.replace('text', 'bg')} opacity-0 group-hover:opacity-60 transition-all duration-300 rounded-full`} />
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="px-8 mt-12 text-center opacity-40">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em]">
                        Noor Connect • Spiritual Companion
                    </p>
                </div>
            </div>
        </PageTransition>
    );
}
