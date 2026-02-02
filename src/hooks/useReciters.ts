import { useState, useEffect } from 'react';
import { Reciter } from '@/lib/global-quran';

// MP3Quran Types (for fetching)
interface Moshaf {
    id: number;
    name: string;
    server: string;
    surah_total: number;
    surah_list: string;
}
interface APIReciter {
    id: number;
    name: string;
    moshaf: Moshaf[];
}
interface MP3QuranResponse {
    reciters: APIReciter[];
}

// Parse surah_list string "1,2,3,..." to number array
function parseSurahList(surahListStr: string): number[] {
    if (!surahListStr) return [];
    return surahListStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
}

export function useReciters() {
    const [reciters, setReciters] = useState<Reciter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReciters = async () => {
            try {
                // Check localStorage first
                const cached = localStorage.getItem('mp3quran-reciters-v1');
                if (cached) {
                    setReciters(JSON.parse(cached));
                    setIsLoading(false);
                    return;
                }

                const res = await fetch("https://mp3quran.net/api/v3/reciters?language=en");
                if (!res.ok) throw new Error("Failed to fetch");
                const json: MP3QuranResponse = await res.json();

                const flattened: Reciter[] = [];
                json.reciters.forEach(r => {
                    r.moshaf.forEach(m => {
                        flattened.push({
                            id: `${r.id}-${m.id}`,
                            name: `${r.name} (${m.name})`,
                            server: m.server,
                            surahList: parseSurahList(m.surah_list)
                        });
                    });
                });

                flattened.sort((a, b) => a.name.localeCompare(b.name));
                setReciters(flattened);
                localStorage.setItem('mp3quran-reciters-v1', JSON.stringify(flattened));
            } catch (e) {
                setError("Failed to load reciters");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReciters();
    }, []);

    return { reciters, isLoading, error };
}
