import { NavLink } from "react-router-dom";
import { Home, BookOpen, Settings, Compass, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    { title: t('home'), path: "/", icon: Home, gradient: 'from-emerald-500 to-teal-600' },
    { title: t('quran'), path: "/quran", icon: BookOpen, gradient: 'from-blue-500 to-indigo-600' },
    { title: t('qibla'), path: "/qibla", icon: Compass, gradient: 'from-purple-500 to-pink-600' },
    { title: t('services'), path: "/services", icon: LayoutGrid, gradient: 'from-amber-500 to-orange-600' },
    { title: t('settings'), path: "/profile", icon: Settings, gradient: 'from-rose-500 to-red-600' },
  ];

  return (
    <nav
      className="w-full fixed bottom-0 left-0 right-0 z-[100] pointer-events-none pb-6 px-4 pb-safe flex justify-center"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)'
      }}
    >
      {/* Premium Floating Island with enhanced glassmorphism */}
      <div className="w-full max-w-md bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.1)] pointer-events-auto rounded-[40px] overflow-hidden relative">
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-60" />
        
        <div className="relative z-10 flex flex-row items-center justify-between h-[80px] px-3 sm:px-5">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={triggerHapticFeedback}
              className="group flex-1 flex flex-col items-center justify-center h-full relative px-1"
            >
              {({ isActive }) => (
                <motion.div 
                  className="flex flex-col items-center justify-center gap-2 relative z-10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Premium Active Indicator */}
                  <div className="relative flex items-center justify-center w-[60px] h-[40px] rounded-2xl">
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="nav-bg-glow"
                          className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-20 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.2)]`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.div
                      className={`p-2 rounded-2xl transition-all duration-500 ${isActive
                        ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                        : "bg-transparent"
                        }`}
                    >
                      <item.icon
                        className={`w-[24px] h-[24px] transition-all duration-500 ${isActive
                          ? "text-white scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                          : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </motion.div>
                  </div>

                  <motion.span 
                    className={`text-[10px] font-bold uppercase tracking-wide transition-all duration-300 truncate w-full px-1 text-center ${isActive
                      ? "text-foreground scale-105"
                      : "text-muted-foreground/60 group-hover:text-foreground"
                      }`}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                      opacity: isActive ? 1 : 0.7
                    }}
                  >
                    {item.title}
                  </motion.span>

                </motion.div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Premium home indicator with glow */}
        <div className="relative z-10 flex justify-center mb-3">
          <motion.div 
            className="h-[3px] w-24 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </nav>
  );
});

export default BottomNav;
