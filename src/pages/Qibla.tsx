import { AppBar } from "@/components/AppBar";
import QiblaCompassNative from "@/components/QiblaCompassNative";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext-new";

const Qibla = () => {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AppBar title={t("qibla") || "Qibla"} />
        <QiblaCompassNative />
      </div>
    </PageTransition>
  );
};

export default Qibla;
