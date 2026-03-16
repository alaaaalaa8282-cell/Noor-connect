import { Card, CardContent } from "@/components/ui/card";
import { Reciter } from "@/lib/quran-audio";

interface ReciterInfoProps {
  reciter: Reciter;
}

export function ReciterInfo({ reciter }: ReciterInfoProps) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-lg">🎵</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">{reciter.name}</h4>
            <p className="text-sm text-green-700">{reciter.arabicName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
