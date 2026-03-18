import { AppBar } from "@/components/AppBar";
import QiblaCompassModern from "@/components/QiblaCompassModern";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext-new";
import { Info } from "lucide-react";

const Qibla = () => {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        <AppBar title={t("qibla") || "Qibla"} />
        <QiblaCompassModern />
        
        <div className="mx-6 mt-6 mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center text-center gap-3 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] transition-all duration-300">
          <div className="p-2 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed px-2">
            <span className="font-semibold text-foreground block mb-1">Feature in Development</span>
            The Qibla compass is currently being refined and may experience occasional inaccuracies.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default Qibla;
