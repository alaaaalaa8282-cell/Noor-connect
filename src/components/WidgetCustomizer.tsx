import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, RotateCcw, Building, BookOpen, MessageCircle, Navigation, Compass, Star, TrendingUp, Calendar, Heart, CloudSun, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_DASHBOARD_WIDGETS,
  loadDashboardWidgetConfig,
  persistDashboardWidgetConfig,
  type DashboardWidgetConfig,
} from "@/lib/dashboard-widget-config";
import { SafeWidgetPreview } from "@/components/SafeWidgetPreview";

// --- Mock Widget Renderers ---
const getWidgetIcon = (id: string, className = "w-5 h-5") => {
  switch (id) {
    case 'prayer-times': return <Building className={className} />;
    case 'daily-ayah': return <BookOpen className={className} />;
    case 'daily-hadith': return <MessageCircle className={className} />;
    case 'qibla-quick': return <Navigation className={className} />;
    case 'tasbeeh-quick': return <Target className={className} />;
    case 'ramadan': return <Compass className={className} />;
    case 'salah-tracker': return <TrendingUp className={className} />;
    case 'weekly-chart': return <Star className={className} />;
    case 'quran-progress': return <BookOpen className={className} />;
    case 'islamic-events': return <Calendar className={className} />;
    case 'weather': return <CloudSun className={className} />;
    case 'prayer-stats': return <TrendingUp className={className} />;
    case 'qaza-tracker': return <Heart className={className} />;
    case 'dhikr-reminder': return <Target className={className} />;
    default: return <Settings className={className} />;
  }
};

const getWidgetMockColor = (id: string) => {
  switch (id) {
    case 'prayer-times': return 'from-blue-500/10 to-blue-500/5 border-blue-200/50 dark:border-blue-900/50 text-blue-700 dark:text-blue-300';
    case 'daily-ayah': return 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300';
    case 'daily-hadith': return 'from-indigo-500/10 to-indigo-500/5 border-indigo-200/50 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300';
    case 'qibla-quick': return 'from-amber-500/10 to-amber-500/5 border-amber-200/50 dark:border-amber-900/50 text-amber-700 dark:text-amber-300';
    case 'tasbeeh-quick': return 'from-teal-500/10 to-teal-500/5 border-teal-200/50 dark:border-teal-900/50 text-teal-700 dark:text-teal-300';
    case 'ramadan': return 'from-emerald-600/10 to-emerald-600/5 border-emerald-300/50 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400';
    default: return 'from-slate-500/10 to-slate-500/5 border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300';
  }
};

const WidgetMockPreview = ({ widget, isMobile }: { widget: DashboardWidgetConfig, isMobile: boolean }) => {
  const colorClasses = getWidgetMockColor(widget.id);
  
  return (
    <div className={`mt-4 p-4 rounded-xl bg-gradient-to-br ${colorClasses} border flex items-center justify-center min-h-[100px] opacity-90 group-hover:opacity-100 transition-opacity`}>
      <div className="flex flex-col items-center gap-3 text-center">
         <div className="p-2 rounded-full bg-background/50 backdrop-blur-sm shadow-sm">
           {getWidgetIcon(widget.id, "w-6 h-6")}
         </div>
         <div>
           <span className="text-sm font-semibold block">{widget.name}</span>
           <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Live Preview</span>
         </div>
      </div>
    </div>
  );
};


export function WidgetCustomizer() {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_DASHBOARD_WIDGETS);
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setWidgets(loadDashboardWidgetConfig());
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const saveConfig = (newWidgets: DashboardWidgetConfig[]) => {
    const persisted = persistDashboardWidgetConfig(newWidgets);
    setWidgets(persisted);
    toast({
      title: "Widget Layout Updated",
      description: "Your dashboard has been customized",
    });
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const newWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? (widget.category === 'essential' ? widget : { ...widget, visible: !widget.visible })
        : widget
    );
    saveConfig(newWidgets);
  };

  const resetToDefault = () => {
    saveConfig(DEFAULT_DASHBOARD_WIDGETS);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential': return 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'optional': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'premium': return 'bg-purple-100/80 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);
  const hiddenWidgets = widgets.filter(w => !w.visible);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                Customize Dashboard
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Toggle widgets on or off and instantly preview how they look.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="gap-2 w-full sm:w-auto rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-10">
        {/* Visible Widgets Grid */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-xl text-foreground tracking-tight">Active Widgets</h3>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5">{visibleWidgets.length}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {visibleWidgets.map((widget) => (
              <Card key={widget.id} className="group overflow-hidden border border-border/60 bg-card/80 backdrop-blur shadow-sm hover:shadow-md hover:border-border transition-all duration-300 flex flex-col h-full">
                <CardContent className="p-5 flex flex-col flex-1">
                  
                  {/* Top Header Row within Card */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-lg text-foreground truncate leading-tight mb-1">{widget.name}</h4>
                       <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(widget.category)} uppercase tracking-wider`}>
                          {widget.category}
                        </span>
                    </div>
                    
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {widget.category !== 'essential' ? (
                        <Switch
                          checked={widget.visible}
                          onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                          className="data-[state=checked]:bg-primary"
                          title="Toggle visibility"
                        />
                      ) : (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-none shadow-none text-xs">Pinned</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Description row */}
                  <div className="mb-4">
                     <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{widget.description}</p>
                  </div>
                  
                  {/* Widget Live Visual Preview fills remaining space */}
                  <div className="mt-auto">
                    <WidgetMockPreview widget={widget} isMobile={isMobile} />
                  </div>
                  
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Hidden Widgets Section */}
        {hiddenWidgets.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4 px-1">
              <h3 className="font-bold text-xl text-muted-foreground tracking-tight">Available Widgets</h3>
              <Badge variant="secondary" className="rounded-full bg-muted/60 text-muted-foreground px-2 py-0.5">{hiddenWidgets.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {hiddenWidgets.map((widget) => (
                <Card key={widget.id} className="overflow-hidden border-dashed border-border/60 bg-muted/10 hover:bg-muted/30 transition-all duration-300">
                  <CardContent className="p-5 space-y-4">
                    {/* Widget Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-foreground truncate leading-tight mb-1">{widget.name}</h4>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(widget.category)} uppercase tracking-wider`}>
                          {widget.category}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="shrink-0 gap-1 rounded-lg text-xs"
                        onClick={() => toggleWidgetVisibility(widget.id)}
                      >
                        Add to Dashboard
                      </Button>
                    </div>
                    
                    {/* Widget Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{widget.description}</p>
                    
                    {/* Live Preview - Show actual widget preview! */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-muted/10 to-transparent pointer-events-none z-10" />
                      <SafeWidgetPreview 
                        widgetId={widget.id} 
                        isVisible={false}
                        onEnable={() => toggleWidgetVisibility(widget.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default WidgetCustomizer;
