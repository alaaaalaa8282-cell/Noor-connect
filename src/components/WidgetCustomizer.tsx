/**
 * Widget Customizer
 * Allows users to customize widget layout and visibility
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Grip, Settings, Eye, EyeOff, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_DASHBOARD_WIDGETS,
  loadDashboardWidgetConfig,
  persistDashboardWidgetConfig,
  type DashboardWidgetConfig,
} from "@/lib/dashboard-widget-config";

export function WidgetCustomizer() {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_DASHBOARD_WIDGETS);
  const [draggedWidget, setDraggedWidget] = useState<DashboardWidgetConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setWidgets(loadDashboardWidgetConfig());
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

  const handleDragStart = (widget: DashboardWidgetConfig) => {
    setDraggedWidget(widget);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetWidget: DashboardWidgetConfig) => {
    e.preventDefault();
    if (targetWidget.category === 'essential') return;
    if (!draggedWidget || draggedWidget.id === targetWidget.id) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget.id);
    const targetIndex = newWidgets.findIndex(w => w.id === targetWidget.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedWidget);
      
      // Update order values
      newWidgets.forEach((widget, index) => {
        widget.order = index + 1;
      });
      
      saveConfig(newWidgets);
    }
    
    setDraggedWidget(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'optional': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible);
  const hiddenWidgets = widgets.filter(w => !w.visible);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Customize Dashboard
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground">
            🎯 <strong>Drag and drop</strong> widgets to reorder them<br />
            👁️ <strong>Toggle visibility</strong> to show/hide widgets<br />
            🏷️ <strong>Categories:</strong> Essential (always visible), Optional (customizable), Premium (extra features)
          </p>
        </div>

        {/* Visible Widgets */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visible Widgets ({visibleWidgets.length})
          </h3>
          
          <div className="space-y-2">
            {visibleWidgets
              .sort((a, b) => a.order - b.order)
              .map((widget) => (
                <div
                  key={widget.id}
                  draggable={widget.category !== 'essential'}
                  onDragStart={() => handleDragStart(widget)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, widget)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    widget.category === 'essential' 
                      ? 'bg-blue-50/50 border-blue-200 cursor-not-allowed' 
                      : 'bg-card hover:bg-muted/50 cursor-move border-border hover:border-primary/50'
                  } ${draggedWidget?.id === widget.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {widget.category !== 'essential' && (
                      <Grip className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{widget.name}</p>
                      <p className="text-xs text-muted-foreground">{widget.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getCategoryColor(widget.category)}`}>
                      {widget.category}
                    </Badge>
                    {widget.category !== 'essential' && (
                      <Switch
                        checked={widget.visible}
                        onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Hidden Widgets */}
        {hiddenWidgets.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              Hidden Widgets ({hiddenWidgets.length})
            </h3>
            
            <div className="space-y-2">
              {hiddenWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{widget.name}</p>
                      <p className="text-xs text-muted-foreground">{widget.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getCategoryColor(widget.category)}`}>
                      {widget.category}
                    </Badge>
                    <Switch
                      checked={widget.visible}
                      onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-center">
            🎉 You have {visibleWidgets.length} widgets visible on your dashboard
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default WidgetCustomizer;
