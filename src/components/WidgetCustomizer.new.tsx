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
    <div className={`mt-3 p-3 rounded-xl bg-gradient-to-br ${colorClasses} border flex items-center justify-center min-h-[80px] opacity-80 group-hover:opacity-100 transition-opacity`}>
      <div className="flex flex-col items-center gap-2 text-center">
         {getWidgetIcon(widget.id, "w-6 h-6")}
         <span className="text-xs font-medium">{widget.name} Preview</span>
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
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
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
              className="gap-2 w-full sm:w-auto rounded-xl"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-8">
        {/* Visible Widgets Grid */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <h3 className="font-bold text-lg text-foreground">Visible on Dashboard</h3>
            <Badge variant="secondary" className="rounded-full">{visibleWidgets.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {visibleWidgets.map((widget) => (
              <Card key={widget.id} className="group overflow-hidden border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base truncate">{widget.name}</h4>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${getCategoryColor(widget.category)}`}>
                          {widget.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{widget.description}</p>
                    </div>
                    
                    {widget.category !== 'essential' && (
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <Switch
                          checked={widget.visible}
                          onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    )}
                    {widget.category === 'essential' && (
                      <div className="shrink-0">
                        <Badge variant="outline" className="text-[10px] opacity-50 bg-transparent">Pinned</Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Widget Live Visual Preview */}
                  <WidgetMockPreview widget={widget} isMobile={isMobile} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Hidden Widgets Section */}
        {hiddenWidgets.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <h3 className="font-bold text-lg text-muted-foreground">Hidden Widgets</h3>
              <Badge variant="secondary" className="rounded-full bg-muted text-muted-foreground">{hiddenWidgets.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {hiddenWidgets.map((widget) => (
                <Card key={widget.id} className="overflow-hidden border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <CardContent className="p-4 sm:p-5 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-base text-muted-foreground truncate">{widget.name}</h4>
                          <Badge className={`text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-none`}>
                            {widget.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{widget.description}</p>
                      </div>
                      
                      <div className="shrink-0">
                         <Switch
                          checked={widget.visible}
                          onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                        />
                      </div>
                    </div>
                    
                    {/* Faded miniature preview for hidden ones */}
                    <div className="mt-3 p-2 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center opacity-50 grayscale">
                      <div className="flex items-center gap-2 text-muted-foreground">
                         {getWidgetIcon(widget.id, "w-4 h-4")}
                         <span className="text-[10px] font-medium">Add to Dashboard to preview</span>
                      </div>
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
