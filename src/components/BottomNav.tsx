import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageCircle, Heart, Calculator, Calendar, Library, Settings, Trophy, Star, Coins, Target, Radio, Compass, Tv } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { memo } from "react";
import { motion } from "framer-motion";

// Haptic feedback function - moved to async to avoid blocking UI
const triggerHapticFeedback = () => {
  setTimeout(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(8); // 8ms subtle vibration for tactile feedback
    }
  }, 0);
};

export const BottomNav = memo(function BottomNav() {
  const { t } = useLanguage();

  const navItems = [
    { title: t('home'), path: "/", icon: Home, priority: "primary" },
    { title: "Live", path: "/live", icon: Tv, priority: "primary" },
    { title: t('quran'), path: "/quran", icon: BookOpen, priority: "primary" },
    { title: t('qibla'), path: "/qibla", icon: Compass, priority: "primary" },
    { title: "Hadith", path: "/hadith", icon: MessageCircle, priority: "secondary" },
    { title: "Radio", path: "/quran-radio", icon: Radio, priority: "primary" },
    { title: "Habits", path: "/habit-tracker", icon: Target, priority: "primary" },
    { title: "Duas", path: "/duas", icon: Heart, priority: "secondary" },
    { title: t('tasbih'), path: "/tasbeeh", icon: Calculator, priority: "secondary" },
    { title: t('namesOfAllah'), path: "/names-of-allah", icon: Star, priority: "secondary" },
    { title: t('islamicQuiz'), path: "/quiz", icon: Trophy, priority: "secondary" },
    { title: t('zakatCalculator'), path: "/zakat", icon: Coins, priority: "secondary" },
    { title: "Calendar", path: "/calendar", icon: Calendar, priority: "secondary" },
    { title: "E-Books", path: "/ebooks", icon: Library, priority: "secondary" },
    { title: t('settings'), path: "/profile", icon: Settings, priority: "secondary" },
  ];

  const primaryItems = navItems.filter(item => item.priority === "primary");
  const secondaryItems = navItems.filter(item => item.priority === "secondary");
  const orderedItems = [...primaryItems, ...secondaryItems];

  return (
    <nav
      className="w-full"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Premium Floating Navigation Container */}
      <div className="mx-4 mb-4">
        <div
          className="relative overflow-hidden rounded-[24px] bg-card/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]"
          style={{
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            paddingTop: '12px',
          }}
        >
          {/* Premium Gradient Border Effect */}
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/30 to-transparent dark:from-white/10 pointer-events-none" />
          
          {/* Navigation Items */}
          <div
            className="flex items-center gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-2"
            style={{
              willChange: 'transform, opacity',
              transform: 'translateZ(0)'
            }}
          >
            {orderedItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={triggerHapticFeedback}
                className={({ isActive }) =>
                  `shrink-0 snap-center flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 min-w-[68px] rounded-[16px] relative transition-all duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
                style={{
                  willChange: 'transform, opacity',
                  transform: 'translateZ(0)'
                }}
              >
                {({ isActive }) => (
                  <>
                    {/* Active Background Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBg"
                        className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/5 rounded-[16px] border border-primary/20"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35
                        }}
                      />
                    )}
                    
                    {/* Icon Container */}
                    <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-b from-primary/30 to-primary/10 shadow-[0_2px_8px_rgba(var(--primary),0.3)]" 
                        : "bg-transparent"
                    }`}>
                      <item.icon 
                        className={`w-5 h-5 transition-all duration-300 ${
                          isActive 
                            ? "scale-110 text-primary drop-shadow-[0_2px_4px_rgba(var(--primary),0.4)]" 
                            : "scale-100"
                        }`} 
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                    
                    {/* Label */}
                    <span className={`text-[10px] leading-none transition-all duration-300 whitespace-nowrap ${
                      isActive 
                        ? "font-semibold text-primary" 
                        : "font-medium"
                    }`}>
                      {item.title}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          
          {/* iOS-style Home Indicator */}
          <div className="flex justify-center mt-2">
            <div className="w-32 h-1 bg-foreground/20 rounded-full" />
          </div>
        </div>
      </div>
    </nav>
  );
});

export default BottomNav;
