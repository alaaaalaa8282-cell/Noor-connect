import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageCircle, Heart, Calculator, Calendar, Library, Settings, Trophy, Star, Coins, Target, Radio } from "lucide-react";
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

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFBF2]/95 border-t border-border/50 shadow-lg"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Primary Navigation - Always Visible */}
      <div 
        className="flex items-center justify-around relative"
        style={{ 
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingTop: '8px',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
      >
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={triggerHapticFeedback}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] md:min-w-[80px] lg:min-w-[100px] rounded-lg relative transition-colors duration-200 ${
                isActive
                  ? "text-primary bg-primary/10 border-t-2 border-primary shadow-sm shadow-primary/20"
                  : "text-muted-foreground active:text-primary/70 active:bg-muted/50"
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
                <span className={`text-[10px] md:text-xs lg:text-sm leading-tight transition-colors duration-200 ${
                  isActive ? "font-semibold text-primary" : "font-medium"
                }`}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Secondary Navigation - Scrollable */}
      <div 
        className="flex items-center justify-center overflow-x-auto snap-x snap-mandatory scrollbar-hide border-t border-border/50 relative"
        style={{ 
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingTop: '8px',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)'
        }}
      >
        {secondaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={triggerHapticFeedback}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] md:min-w-[80px] lg:min-w-[100px] shrink-0 snap-center rounded-lg relative transition-colors duration-200 ${
                isActive
                  ? "text-primary bg-primary/10 border-t-2 border-primary shadow-sm shadow-primary/20"
                  : "text-muted-foreground active:text-primary/70 active:bg-muted/50"
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
                <span className={`text-[10px] md:text-xs lg:text-sm leading-tight transition-colors duration-200 ${
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
