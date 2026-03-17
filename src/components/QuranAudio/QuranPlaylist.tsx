import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Play, X } from 'lucide-react';
import { SurahAudio } from '@/lib/quran-audio';

interface QuranPlaylistProps {
  playlist: SurahAudio[];
  onPlaySurah: (surahNumber: number) => void;
  onRemoveFromPlaylist: (surahNumber: number) => void;
  currentSurah?: number;
}

export function QuranPlaylist({ 
  playlist, 
  onPlaySurah, 
  onRemoveFromPlaylist, 
  currentSurah 
}: QuranPlaylistProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <List className="w-5 h-5" />
          Playlist ({playlist.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {playlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Surahs in playlist</p>
            <p className="text-xs">Add Surahs to create your playlist</p>
          </div>
        ) : (
          playlist.map((surah) => (
            <div
              key={surah.sequence}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                currentSurah === surah.sequence 
                  ? 'bg-primary/10 border-primary' 
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant={currentSurah === surah.sequence ? "default" : "outline"}
                  onClick={() => onPlaySurah(surah.sequence)}
                  className="w-8 h-8 p-0"
                >
                  {currentSurah === surah.sequence ? (
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
                
                <div>
                  <p className="font-medium text-sm">{surah.name.latin.short}</p>
                  <p className="text-xs text-muted-foreground">
                    {surah.translation} • {surah.ayahCount} verses
                  </p>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveFromPlaylist(surah.sequence)}
                className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
