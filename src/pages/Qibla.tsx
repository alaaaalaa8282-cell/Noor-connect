import { AppBar } from "@/components/AppBar";
import QiblaCompassModern from "@/components/QiblaCompassModern";
import { PageTransition } from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext-new";

const Qibla = () => {
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AppBar title={t("qibla") || "Qibla"} />
        <QiblaCompassModern />
      </div>
    </PageTransition>
  );
};

export default Qibla;
