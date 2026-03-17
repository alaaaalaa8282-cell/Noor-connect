import { AppBar } from "@/components/AppBar";
import { WidgetCustomizer } from "@/components/WidgetCustomizer";
import { PageTransition } from "@/components/PageTransition";

export default function DashboardWidgets() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32">
        <AppBar title="Customize Dashboard" showBack />
        <div className="p-4">
          <WidgetCustomizer />
        </div>
      </div>
    </PageTransition>
  );
}

