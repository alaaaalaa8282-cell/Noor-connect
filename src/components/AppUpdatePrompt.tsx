import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, DownloadCloud, AlertCircle, Sparkles, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Function to compare semantic versions: returns true if v1 > v2
const isNewerVersion = (latest: string, current: string) => {
    if (!latest || !current) return false;

    const parseVersion = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const p1 = parseVersion(latest);
    const p2 = parseVersion(current);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }
    return false;
};

export function AppUpdatePrompt() {
    const [updateInfo, setUpdateInfo] = useState<{
        version: string;
        downloadUrl: string;
        releaseNotes: string;
        isUrgent: boolean;
    } | null>(null);

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkForUpdates = async () => {
            // We only want to auto-check on native devices (Android via Capacitor)
            if (Capacitor.getPlatform() !== 'android') return;

            try {
                const info = await CapacitorApp.getInfo();
                const currentVersion = info.version;

                const response = await fetch("https://api.github.com/repos/darkmaster0345/Noor-connect/releases/latest");
                if (!response.ok) return;

                const data = await response.json();
                const latestVersion = data.tag_name;

                if (isNewerVersion(latestVersion, currentVersion)) {
                    // Find the APK asset
                    const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));
                    const downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;

                    const isUrgent = data.body?.toLowerCase().includes('[urgent]') || false;

                    setUpdateInfo({
                        version: latestVersion.replace(/^v/, ''),
                        downloadUrl,
                        releaseNotes: data.body?.replace(/\[urgent\]/gi, '')?.trim() || "Performance improvements and bug fixes.",
                        isUrgent
                    });
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Failed to check for updates:", error);
            }
        };

        checkForUpdates();
        const intervalId = setInterval(checkForUpdates, 24 * 60 * 60 * 1000); // 24 hours

        return () => clearInterval(intervalId);
    }, []);

    const handleUpdate = async () => {
        if (updateInfo?.downloadUrl) {
            if (Capacitor.isNativePlatform()) {
                await Browser.open({ url: updateInfo.downloadUrl });
            } else {
                window.open(updateInfo.downloadUrl, '_blank');
            }
        }
    };

    if (!updateInfo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && !updateInfo.isUrgent) setIsOpen(false);
        }}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-2xl [&>button]:hidden">
                <DialogTitle className="sr-only">App Update Available</DialogTitle>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                            className="relative glass-panel rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a]/90 backdrop-blur-3xl shadow-[0_0_50px_rgba(30,58,138,0.5)] mx-4 sm:mx-0"
                        >
                            {/* Animated Background Gradients */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/30 rounded-full blur-[80px] pointer-events-none animate-pulse" />
                            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/30 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

                            {/* Header Image/Icon Area */}
                            <div className="relative pt-10 pb-6 px-6 flex flex-col items-center justify-center text-center">
                                {!updateInfo.isUrgent && (
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}

                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                                    className="relative mb-6"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#e0c097] to-[#d6af7e] rounded-2xl blur-xl opacity-50 animate-pulse" />
                                    <div className="relative bg-gradient-to-tr from-[#1a237e] to-[#0d47a1] border border-white/20 p-5 rounded-3xl shadow-2xl">
                                        <DownloadCloud className="w-12 h-12 text-[#e0c097]" />
                                    </div>
                                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#e0c097] animate-bounce" />
                                </motion.div>

                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                    Update Available
                                </h2>
                                <p className="text-slate-300 text-sm max-w-[280px] leading-relaxed">
                                    Experience the latest features right now. Version <span className="text-[#e0c097] font-bold px-1.5 py-0.5 bg-[#e0c097]/10 rounded-md">v{updateInfo.version}</span> is ready!
                                </p>
                            </div>

                            <div className="px-6 pb-8 space-y-6">
                                {/* Release Notes */}
                                {updateInfo.releaseNotes && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Card className="bg-black/40 border-white/10 p-4 max-h-[140px] overflow-y-auto custom-scrollbar backdrop-blur-md rounded-2xl shadow-inner">
                                            <div className="flex items-center gap-2 mb-3 text-white">
                                                <Github className="w-4 h-4 text-[#e0c097]" />
                                                <span className="font-semibold text-xs tracking-widest uppercase text-white/80">What's New</span>
                                            </div>
                                            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                                                {updateInfo.releaseNotes}
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* Urgent Warning */}
                                {updateInfo.isUrgent && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-200"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                                        <p className="text-sm font-medium leading-tight">
                                            This is a critical update required to continue using the app smoothly.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="space-y-3 pt-2"
                                >
                                    <Button
                                        onClick={handleUpdate}
                                        className="w-full relative group overflow-hidden bg-gradient-to-r from-[#e0c097] via-[#d6af7e] to-[#e0c097] text-black hover:opacity-100 font-bold h-14 rounded-2xl text-lg shadow-[0_0_20px_rgba(224,192,151,0.3)] transition-all active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-white/30 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            Update Now
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>

                                    {!updateInfo.isUrgent && (
                                        <Button
                                            onClick={() => setIsOpen(false)}
                                            variant="ghost"
                                            className="w-full h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium border-0"
                                        >
                                            Skip this version
                                        </Button>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
