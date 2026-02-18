import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tv, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { useGlobalRadio } from "@/lib/global-radio";
import { YoutubeService } from "@/lib/youtube";

export default function LiveStreams() {
    const { updateRadioState, isPlaying } = useGlobalRadio();
    const [loadingMakkah, setLoadingMakkah] = useState(true);
    const [loadingMadinah, setLoadingMadinah] = useState(true);
    const [makkahVideoId, setMakkahVideoId] = useState("Cm1v4bteXbI");
    const [madinahVideoId, setMadinahVideoId] = useState("CXJ0C03Nr_U");
    const [errorMakkah, setErrorMakkah] = useState(false);
    const [errorMadinah, setErrorMadinah] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    // Fallback stream URLs for emergencies
    const FALLBACK_STREAMS = {
        makkah: "https://www.youtube.com/watch?v=Cm1v4bteXbI",
        madinah: "https://www.youtube.com/watch?v=CXJ0C03Nr_U"
    };

    // Fetch live stream IDs on component mount
    useEffect(() => {
        // Clear cache and fetch fresh streams on mount to ensure we get latest IDs
        YoutubeService.clearCache();
        fetchLiveStreams();
    }, []);

    const fetchLiveStreams = async () => {
        try {
            setIsRetrying(true);
            setErrorMakkah(false);
            setErrorMadinah(false);
            
            const streams = await YoutubeService.getLiveStreams();
            setMakkahVideoId(streams.makkah);
            setMadinahVideoId(streams.madinah);
            
            console.log('[LiveStreams] Updated live stream IDs:', streams);
        } catch (error) {
            console.error('[LiveStreams] Failed to fetch live streams:', error);
            setErrorMakkah(true);
            setErrorMadinah(true);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleVideoPlay = () => {
        // Auto-pause global radio if active
        if (isPlaying) {
            updateRadioState({ isPlaying: false });
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 pb-24 space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <Tv className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Live Transmission
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Watch live streams from Makkah and Madinah
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Makkah Stream */}
                <Card className="overflow-hidden border-primary/20 shadow-lg group hover:shadow-primary/10 transition-shadow flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    Masjid Al-Haram
                                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                                </CardTitle>
                                <CardDescription>Makkah, Saudi Arabia</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="aspect-video w-full bg-black relative">
                            {loadingMakkah && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                </div>
                            )}
                            {errorMakkah && !loadingMakkah && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 p-4">
                                    <AlertCircle className="w-12 h-12 text-destructive mb-2" />
                                    <p className="text-sm text-muted-foreground text-center mb-3">
                                        Stream temporarily unavailable
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchLiveStreams}
                                        disabled={isRetrying}
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                        {isRetrying ? 'Retrying...' : 'Retry'}
                                    </Button>
                                </div>
                            )}
                            <iframe
                                className="w-full h-full absolute inset-0"
                                src={`https://www.youtube-nocookie.com/embed/${makkahVideoId}?autoplay=0&rel=0&modestbranding=1`}
                                title="Makkah Live"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onLoad={() => {
                                    setLoadingMakkah(false);
                                    setErrorMakkah(false);
                                    handleVideoPlay();
                                }}
                                onError={() => {
                                    console.error('[LiveStreams] Makkah stream failed to load');
                                    setErrorMakkah(true);
                                    setLoadingMakkah(false);
                                }}
                                style={{ display: errorMakkah ? 'none' : 'block' }}
                            ></iframe>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/5 border-t border-border/50">
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => window.open('https://www.youtube.com/@SaudiQuranTv/live', '_blank')}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Watch on YouTube
                            </Button>
                            {errorMakkah && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => window.open(FALLBACK_STREAMS.makkah, '_blank')}
                                    className="gap-2"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Fallback
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>

                {/* Madinah Stream */}
                <Card className="overflow-hidden border-primary/20 shadow-lg group hover:shadow-primary/10 transition-shadow flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    Masjid An-Nabawi
                                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                                </CardTitle>
                                <CardDescription>Madinah, Saudi Arabia</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="aspect-video w-full bg-black relative">
                            {loadingMadinah && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                </div>
                            )}
                            {errorMadinah && !loadingMadinah && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 p-4">
                                    <AlertCircle className="w-12 h-12 text-destructive mb-2" />
                                    <p className="text-sm text-muted-foreground text-center mb-3">
                                        Stream temporarily unavailable
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchLiveStreams}
                                        disabled={isRetrying}
                                        className="gap-2"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                        {isRetrying ? 'Retrying...' : 'Retry'}
                                    </Button>
                                </div>
                            )}
                            <iframe
                                className="w-full h-full absolute inset-0"
                                src={`https://www.youtube-nocookie.com/embed/${madinahVideoId}?autoplay=0&rel=0&modestbranding=1`}
                                title="Madinah Live"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onLoad={() => {
                                    setLoadingMadinah(false);
                                    setErrorMadinah(false);
                                    handleVideoPlay();
                                }}
                                onError={() => {
                                    console.error('[LiveStreams] Madinah stream failed to load');
                                    setErrorMadinah(true);
                                    setLoadingMadinah(false);
                                }}
                                style={{ display: errorMadinah ? 'none' : 'block' }}
                            ></iframe>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/5 border-t border-border/50">
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => window.open('https://www.youtube.com/@SaudiSunnahTv/live', '_blank')}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Watch on YouTube
                            </Button>
                            {errorMadinah && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => window.open(FALLBACK_STREAMS.madinah, '_blank')}
                                    className="gap-2"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Fallback
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
