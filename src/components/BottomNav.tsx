import { NavLink } from "react-router-dom";
import { Home, BookOpen, Settings, Compass, LayoutGrid } from "lucide-react";
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
    { title: t('home'), path: "/", icon: Home },
    { title: t('quran'), path: "/quran", icon: BookOpen },
    { title: t('qibla'), path: "/qibla", icon: Compass },
    { title: "Services", path: "/services", icon: LayoutGrid },
    { title: t('settings'), path: "/profile", icon: Settings },
  ];

  return (
    <nav
      className="w-full fixed bottom-0 left-0 right-0 z-[100] pointer-events-none pb-4 px-4 pb-safe flex justify-center"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Floating Island Base matching the user's screenshot exactly */}
      <div className="w-full max-w-screen-md bg-background/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.15)] pointer-events-auto rounded-[28px] overflow-hidden">
        <div className="flex flex-row items-center justify-between h-[72px] px-2 sm:px-4">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={triggerHapticFeedback}
              className="group flex-1 flex flex-col items-center justify-center h-full relative"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative z-10">

                  {/* Active Background Tile (Animated Sliding Movement) */}
                  <div className="relative flex items-center justify-center w-[52px] h-[38px] rounded-[18px]">
                    {isActive && (
                      <motion.div
                        layoutId="nav-bg-glow"
                        className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-[18px] shadow-[inset_0_2px_8px_rgba(var(--primary),0.1)]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}

                    <item.icon
                      className={`w-[22px] h-[22px] transition-all duration-300 ${isActive
                        ? "text-primary scale-110 drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                        : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span className={`text-[10px] uppercase tracking-tighter transition-all duration-300 whitespace-nowrap ${isActive
                    ? "font-bold text-primary scale-105"
                    : "font-semibold text-muted-foreground group-hover:text-foreground"
                    }`}>
                    {item.title}
                  </span>

                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* iOS styled home indicator (only visible on mobile) */}
        <div className="h-[4px] w-24 bg-border/40 mx-auto rounded-full mb-2 block md:hidden opacity-30" />
      </div>
    </nav>
  );
});

export default BottomNav;
