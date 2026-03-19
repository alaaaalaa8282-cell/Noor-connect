import IslamicStreamPlayer from '@/components/IslamicStreamPlayer';
import { Radio } from 'lucide-react';

export default function LiveStreams() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Radio className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
            Live Transmission
          </h1>
          <p className="text-sm text-muted-foreground">
            Watch live streams from Makkah and Madinah
          </p>
        </div>
      </div>

      <IslamicStreamPlayer />

      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-4">
        <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
          About the Streams
        </h3>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70 leading-relaxed">
          These live streams are sourced from official Saudi Arabian IPTV channels. 
          The HLS streams use hls.js (MIT License) for playback. Switch between Makkah and Madinah 
          using the tabs above. If a stream fails to load, click the retry button or try the other location.
        </p>
      </div>
    </div>
  );
}
