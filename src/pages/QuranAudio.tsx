import { AppBar } from "@/components/AppBar";
import { PageTransition } from "@/components/PageTransition";
import { QuranAudioPlayer } from "@/components/QuranAudio/QuranAudioPlayer";
import { QuranAudioErrorBoundary } from "@/components/QuranAudio/QuranAudioErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, Download, PlayCircle, Settings } from "lucide-react";

export default function QuranAudio() {
    return (
        <PageTransition>
            <div className="min-h-screen bg-background pb-32">
                <AppBar title="Quran Audio" showBack={true} />
                
                <div className="px-5 pt-4 space-y-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            🎵 Quran Audio Player
                        </h1>
                        <p className="text-muted-foreground">
                            Listen to the Holy Quran with beautiful recitations from renowned reciters.
                        </p>
                    </div>
                    
                    {/* Quran Audio Player with Error Boundary */}
                    <QuranAudioErrorBoundary>
                        <QuranAudioPlayer />
                    </QuranAudioErrorBoundary>
                    
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-green-800">
                                    <Headphones className="w-5 h-5" />
                                    Multiple Reciters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-700">
                                    Choose from renowned reciters including Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, and more.
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-blue-800">
                                    <PlayCircle className="w-5 h-5" />
                                    Complete Quran
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-blue-700">
                                    Access all 114 Surahs with high-quality audio streaming and smooth playback.
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-purple-800">
                                    <Download className="w-5 h-5" />
                                    Download Support
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-purple-700">
                                    Download your favorite Surahs for offline listening and personal use.
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-orange-800">
                                    <Settings className="w-5 h-5" />
                                    Easy Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-orange-700">
                                    Intuitive playback controls with volume adjustment, progress tracking, and navigation.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Usage Tips */}
                    <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">💡 Usage Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-2">
                                <span className="text-green-600">•</span>
                                <p className="text-sm text-muted-foreground">
                                    Select your preferred reciter from the dropdown menu
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <p className="text-sm text-muted-foreground">
                                    Choose any Surah from 1-114 to begin listening
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-purple-600">•</span>
                                <p className="text-sm text-muted-foreground">
                                    Use the download button to save Surahs for offline use
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-orange-600">•</span>
                                <p className="text-sm text-muted-foreground">
                                    Adjust volume and use skip buttons for easy navigation
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTransition>
    );
}
