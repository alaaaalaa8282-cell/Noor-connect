import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageCircle, Heart, Calculator, Calendar, Library, Settings, Trophy, Star, Coins, Target, Radio } from "lucide-react";

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

export function BottomNav() {
  // Primary items that should always be visible on mobile
  const primaryItems = navItems.filter(item => item.priority === "primary");
  const secondaryItems = navItems.filter(item => item.priority === "secondary");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      {/* Primary Navigation - Always Visible */}
      <div 
        className="flex items-center justify-around"
        style={{ 
          paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
          paddingTop: '4px'
        }}
      >
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-1 min-w-[60px] md:min-w-[80px] lg:min-w-[100px] transition-colors duration-150 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 transition-transform duration-150 ${
                  isActive && "scale-110"
                }`} />
                <span className={`text-[10px] md:text-xs lg:text-sm leading-tight ${
                  isActive ? "font-semibold" : "font-medium"
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
        className="flex items-center justify-center overflow-x-auto snap-x snap-mandatory scrollbar-hide border-t border-border/50"
        style={{ 
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingTop: '4px'
        }}
      >
        {secondaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-1 min-w-[60px] md:min-w-[80px] lg:min-w-[100px] shrink-0 snap-center transition-colors duration-150 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 transition-transform duration-150 ${
                  isActive && "scale-110"
                }`} />
                <span className={`text-[10px] md:text-xs lg:text-sm leading-tight ${
                  isActive ? "font-semibold" : "font-medium"
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
}
