import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageCircle, Heart, Calculator, Calendar, Library, Settings, Trophy, Star, Coins, Target, Radio, Compass } from "lucide-react";
import { memo } from "react";

// Haptic feedback function - moved to async to avoid blocking UI
const triggerHapticFeedback = () => {
  // Use setTimeout to avoid blocking the UI thread
  setTimeout(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // 10ms vibration for tactile feedback
    }
  }, 0);
};

const navItems = [
  { title: "Home", path: "/", icon: Home, priority: "primary" },
  { title: "Quran", path: "/quran", icon: BookOpen, priority: "primary" },
  { title: "Qibla", path: "/qibla", icon: Compass, priority: "primary" },
  { title: "Hadith", path: "/hadith", icon: MessageCircle, priority: "secondary" },
  { title: "Radio", path: "/quran-radio", icon: Radio, priority: "primary" },
  { title: "Habits", path: "/habit-tracker", icon: Target, priority: "primary" },
  { title: "Duas", path: "/duas", icon: Heart, priority: "secondary" },
  { title: "Tasbeeh", path: "/tasbeeh", icon: Calculator, priority: "secondary" },
  { title: "99 Names", path: "/names-of-allah", icon: Star, priority: "secondary" },
  { title: "Quiz", path: "/quiz", icon: Trophy, priority: "secondary" },
  { title: "Zakat", path: "/zakat", icon: Coins, priority: "secondary" },
  { title: "Calendar", path: "/calendar", icon: Calendar, priority: "secondary" },
  { title: "E-Books", path: "/ebooks", icon: Library, priority: "secondary" },
  { title: "Settings", path: "/profile", icon: Settings, priority: "secondary" },
];

export const BottomNav = memo(function BottomNav() {
  // Primary items that should always be visible on mobile
  const primaryItems = navItems.filter(item => item.priority === "primary");
  const secondaryItems = navItems.filter(item => item.priority === "secondary");

  const orderedItems = [...primaryItems, ...secondaryItems];

  return (
    <nav 
      className="w-full bg-[#FFFBF2]/95 border-t border-border/50 shadow-lg"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Single-row Navigation (prevents split rows + keeps consistent icon alignment) */}
      <div
        className="flex items-center gap-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          paddingTop: '10px',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
      >
        {orderedItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={triggerHapticFeedback}
            className={({ isActive }) =>
              `shrink-0 snap-center flex flex-col items-center justify-center gap-1 px-3 py-2 w-[76px] md:w-[88px] lg:w-[100px] rounded-lg relative transition-colors duration-200 border-t-2 ${
                isActive
                  ? "text-primary bg-primary/10 border-primary shadow-sm shadow-primary/20"
                  : "text-muted-foreground border-transparent active:text-primary/70 active:bg-muted/50"
              }`
            }
            style={{
              willChange: 'transform, opacity',
              transform: 'translateZ(0)'
            }}
          >
            {({ isActive }) => (
              <>
                {/* Active state glow effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-lg -z-10" />
                )}
                
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 transition-transform duration-200 ${
                  isActive ? "scale-110 text-primary" : "scale-100"
                }`} />
                <span className={`text-[10px] md:text-xs lg:text-sm leading-none transition-colors duration-200 ${
                  isActive ? "font-semibold text-primary" : "font-medium"
                }`}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
});

export default BottomNav;
