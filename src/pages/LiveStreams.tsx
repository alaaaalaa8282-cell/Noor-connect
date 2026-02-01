import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tv, ExternalLink } from "lucide-react";
import { useGlobalRadio } from "@/lib/global-radio";

export default function LiveStreams() {
    const { updateRadioState, isPlaying } = useGlobalRadio();
    const [loadingMakkah, setLoadingMakkah] = useState(true);
    const [loadingMadinah, setLoadingMadinah] = useState(true);

    // Official Permanent Live Stream IDs
    const MAKKAH_EMBED = "https://www.youtube-nocookie.com/embed/Cm1v4bteXbI";
    const MADINAH_EMBED = "https://www.youtube-nocookie.com/embed/CXJ0C03Nr_U";

    const handleVideoPlay = () => {
        // Auto-pause global radio if it's playing
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
                            <iframe
                                className="w-full h-full absolute inset-0"
                                src={`${MAKKAH_EMBED}?autoplay=0&rel=0&modestbranding=1`}
                                title="Makkah Live"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onLoad={() => {
                                    setLoadingMakkah(false);
                                    handleVideoPlay();
                                }}
                            ></iframe>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/5 border-t border-border/50">
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => window.open('https://www.youtube.com/@SaudiQuranTv/live', '_blank')}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Watch on YouTube (@SaudiQuranTv)
                        </Button>
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
                            <iframe
                                className="w-full h-full absolute inset-0"
                                src={`${MADINAH_EMBED}?autoplay=0&rel=0&modestbranding=1`}
                                title="Madinah Live"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                onLoad={() => {
                                    setLoadingMadinah(false);
                                    handleVideoPlay();
                                }}
                            ></iframe>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/5 border-t border-border/50">
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => window.open('https://www.youtube.com/@SaudiSunnahTv/live', '_blank')}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Watch on YouTube (@SaudiSunnahTv)
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
