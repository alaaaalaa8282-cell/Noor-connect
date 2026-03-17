import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MapPin, Navigation, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocationState } from "@/lib/location-state";
import { calculateQibla } from "@/lib/qibla";

export function QiblaQuickWidget() {
  const navigate = useNavigate();
  const location = useLocationState();

  const qibla = useMemo(() => {
    return calculateQibla(location.latitude, location.longitude);
  }, [location.latitude, location.longitude]);

  const bearing = Math.round(qibla.bearing);

  return (
    <Card className="relative overflow-hidden border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-card to-transparent dark:from-amber-950/20 dark:via-card dark:to-transparent">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            Qibla
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-xl"
            onClick={() => navigate("/qibla")}
          >
            Open
            <ArrowUpRight className="w-4 h-4 ms-1" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{location.locationName}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {bearing}°
              <span className="text-sm font-semibold text-muted-foreground ms-2">
                {qibla.cardinalDirection}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Distance{" "}
              <span className="font-medium text-foreground">{qibla.formattedDistance}</span>
            </p>
          </div>

          <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-200/60 flex items-center justify-center">
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent" />
            <div className="relative w-12 h-12 rounded-full bg-card shadow-sm border border-amber-200/60 flex items-center justify-center">
              <Navigation
                className="w-6 h-6 text-amber-700 dark:text-amber-400"
                style={{ transform: `rotate(${bearing}deg)` }}
              />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 rounded-xl border-amber-300/60 hover:bg-amber-50 dark:hover:bg-amber-950/20"
          onClick={() => navigate("/qibla")}
        >
          <Navigation className="w-4 h-4" />
          Calibrate Compass
        </Button>
      </CardContent>
    </Card>
  );
}

export default QiblaQuickWidget;

