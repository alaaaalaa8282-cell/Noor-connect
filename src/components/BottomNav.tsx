import { NavLink } from "react-router-dom";
import { Home, BookOpen, Settings, Compass, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext-new";
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
    { title: t('home'), path: "/", icon: Home },
    { title: t('quran'), path: "/quran", icon: BookOpen },
    { title: t('qibla'), path: "/qibla", icon: Compass },
    { title: t('services'), path: "/services", icon: LayoutGrid },
    { title: t('settings'), path: "/profile", icon: Settings },
  ];

  return (
    <nav
      className="w-full fixed bottom-0 left-0 right-0 z-[100] pointer-events-none pb-6 px-4 pb-safe flex justify-center"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Floating Island Base with refined glassmorphism and shadow */}
      <div className="w-full max-w-md bg-background/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] pointer-events-auto rounded-[32px] overflow-hidden">
        <div className="flex flex-row items-center justify-around h-[76px] px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={triggerHapticFeedback}
              className="group flex flex-col items-center justify-center h-full relative px-2"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center justify-center gap-1 transition-all duration-300 relative z-10">

                  {/* Refined Active Indicator */}
                  <div className="relative flex items-center justify-center w-[56px] h-[36px] rounded-2xl">
                    {isActive && (
                      <motion.div
                        layoutId="nav-bg-glow"
                        className="absolute inset-0 bg-primary/15 border border-primary/20 rounded-2xl shadow-[0_4px_12px_rgba(var(--primary),0.1)]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}

                    <item.icon
                      className={`w-[22px] h-[22px] transition-all duration-500 ${isActive
                        ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                        : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${isActive
                    ? "text-primary scale-105"
                    : "text-muted-foreground/60 group-hover:text-foreground"
                    }`}>
                    {item.title}
                  </span>

                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* iOS styled home indicator */}
        <div className="h-[4px] w-20 bg-primary/20 mx-auto rounded-full mb-2 opacity-50" />
      </div>
    </nav>
  );
});

export default BottomNav;
