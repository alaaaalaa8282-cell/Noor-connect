import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, AlertTriangle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isNotificationSupported, requestNotificationPermission, getNotificationPermission, shouldRequestPermission, forceRequestPermission } from "@/lib/notifications";
import { GenderSelection } from "@/components/GenderSelection";
import { isFirstTimeUser } from "@/lib/gender-settings";

// Star component purely for visual flair
function FloatingStars() {
    const stars = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 2,
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    initial={{ opacity: 0.2, scale: 0.8 }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: "easeInOut"
                    }}
                    className="absolute rounded-full bg-white/60"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                />
            ))}
        </div>
    );
}

// App Icon Component
function AppIcon() {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
        >
            {/* Icon Container with Premium Styling */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1a4a4a] via-[#2c6e6e] to-[#b38b5d] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="w-full h-full rounded-2xl bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    {/* App Icon Image */}
                    <img
                        src="/icon-192x192.png"
                        alt="Noor Connect App Icon"
                        className="w-20 h-20 rounded-xl animate-pulse"
                        onError={(e) => {
                            // Fallback to SVG if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                        }}
                    />
                    {/* Fallback Crescent Moon Icon */}
                    <svg
                        width="60"
                        height="60"
                        viewBox="0 0 120 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="animate-pulse"
                        style={{ display: 'none' }}
                    >
                        <defs>
                            <linearGradient id="iconGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#D4AF37" />
                                <stop offset="100%" stopColor="#B8860B" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 60 10 A 40 40 0 1 0 60 110 A 32 32 0 1 1 60 10 Z"
                            fill="url(#iconGoldGradient)"
                        />
                    </svg>
                </div>
            </div>
            
            {/* Glow Effect */}
            <motion.div
                className="absolute inset-0 rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.5, duration: 1 }}
                style={{
                    background: "radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)",
                    filter: "blur(20px)",
                    transform: "scale(1.2)",
                }}
            />
        </motion.div>
    );
}

// Permission Request Component
function PermissionRequest({ onPermissionGranted, onSkip }: { 
    onPermissionGranted: () => void; 
    onSkip: () => void; 
}) {
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestPermission = async () => {
        if (!isNotificationSupported()) {
            setError("Notifications not supported on this device");
            return;
        }

        setIsRequesting(true);
        setError(null);

        try {
            const granted = await requestNotificationPermission();
            if (granted) {
                setTimeout(onPermissionGranted, 500);
            } else {
                setError("Permission denied. You can enable notifications in settings.");
            }
        } catch (err) {
            setError("Failed to request permission. Please try again.");
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="w-full max-w-sm mx-auto px-4"
        >
            <Card className="glass-card border-primary/20">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Enable Notifications</h3>
                            <p className="text-xs text-muted-foreground">
                                Get prayer reminders and Islamic content
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <p className="text-xs text-red-500">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleRequestPermission}
                            disabled={isRequesting}
                            className="flex-1 gap-2 rounded-xl"
                            size="sm"
                        >
                            {isRequesting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Requesting...
                                </>
                            ) : (
                                <>
                                    <Bell className="w-3 h-3" />
                                    Enable
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onSkip}
                            className="rounded-xl"
                            size="sm"
                        >
                            Skip
                        </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                        🔔 Important for prayer reminders
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Persistent Permission Reminder (for ongoing APK users)
function PersistentPermissionReminder() {
    const [isVisible, setIsVisible] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const handlePermissionRequest = (event: CustomEvent) => {
            if (event.detail?.source === 'apk-persistent-check') {
                setIsVisible(true);
            }
        };

        window.addEventListener('requestNotificationPermission', handlePermissionRequest as EventListener);
        
        return () => {
            window.removeEventListener('requestNotificationPermission', handlePermissionRequest as EventListener);
        };
    }, []);

    const handleRequestPermission = async () => {
        if (!isNotificationSupported()) return;

        setIsRequesting(true);
        try {
            await requestNotificationPermission();
            setIsVisible(false);
        } catch (error) {
            console.error('Failed to request permission:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 right-4 z-50 max-w-sm"
                >
                    <Card className="glass-card border-primary/20 shadow-lg">
                        <CardContent className="p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary animate-pulse" />
                                <p className="text-xs font-medium">Enable prayer reminders?</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleRequestPermission}
                                    disabled={isRequesting}
                                    size="sm"
                                    className="flex-1 text-xs"
                                >
                                    {isRequesting ? 'Requesting...' : 'Enable'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsVisible(false)}
                                    className="text-xs"
                                >
                                    Later
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [isVisible, setIsVisible] = useState(true);
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);
    const [showGenderSelection, setShowGenderSelection] = useState(false);
    const [permissionHandled, setPermissionHandled] = useState(false);
    const [genderHandled, setGenderHandled] = useState(false);

    useEffect(() => {
        const checkFirstTimeUser = () => {
            const isFirstTime = isFirstTimeUser();
            if (isFirstTime) {
                // Show gender selection first for first-time users
                setTimeout(() => setShowGenderSelection(true), 1500);
            } else {
                // For returning users, check permissions as usual
                checkAndRequestPermissions();
            }
        };

        const checkAndRequestPermissions = async () => {
            // Check if we should request permissions (APK/PWA mode only)
            if (shouldRequestPermission() || forceRequestPermission()) {
                // Show permission request for APK/PWA users
                setTimeout(() => setShowPermissionRequest(true), 1500);
            } else {
                // Continue normally for web users or those with permission already set
                setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(onComplete, 400);
                }, 2000);
            }
        };

        checkFirstTimeUser();

        // For APK users, set up periodic permission reminders
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           ('standalone' in window.navigator && (window.navigator as any).standalone) || 
                           document.referrer.includes('android-app://');

        if (isStandalone) {
            const permissionReminder = setInterval(() => {
                const permission = getNotificationPermission();
                if (permission === 'default' && !showPermissionRequest && !permissionHandled) {
                    // Show permission reminder every 30 minutes for APK users
                    setShowPermissionRequest(true);
                }
            }, 30 * 60 * 1000); // 30 minutes

            // Listen for persistent permission requests from notification manager
            const handlePermissionRequest = (event: CustomEvent) => {
                if (event.detail?.source === 'apk-persistent-check' && !showPermissionRequest && !permissionHandled) {
                    console.log('Received persistent permission request:', event.detail);
                    setShowPermissionRequest(true);
                }
            };

            window.addEventListener('requestNotificationPermission', handlePermissionRequest as EventListener);

            return () => {
                clearInterval(permissionReminder);
                window.removeEventListener('requestNotificationPermission', handlePermissionRequest as EventListener);
            };
        }
    }, [onComplete, showPermissionRequest, permissionHandled, showGenderSelection, genderHandled]);

    const handleGenderSelectionComplete = () => {
        setShowGenderSelection(false);
        setGenderHandled(true);
        
        // After gender selection, check if we need to request permissions
        const checkAndRequestPermissions = async () => {
            if (shouldRequestPermission() || forceRequestPermission()) {
                setTimeout(() => setShowPermissionRequest(true), 500);
            } else {
                setTimeout(() => {
                    setIsVisible(false);
                    setTimeout(onComplete, 400);
                }, 1000);
            }
        };
        
        checkAndRequestPermissions();
    };

    const handlePermissionGranted = () => {
        setShowPermissionRequest(false);
        setPermissionHandled(true);
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 400);
        }, 800);
    };

    const handleSkipPermission = () => {
        setShowPermissionRequest(false);
        setPermissionHandled(true);
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 400);
        }, 800);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a1128] overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, #0a1128 0%, #1a237e 50%, #0d1b2a 100%)",
                    }}
                >
                    {/* Stars Background */}
                    <FloatingStars />

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-4">
                        {/* App Icon */}
                        <AppIcon />

                        {/* App Title with Premium Glass Card */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="glass-card px-8 py-4"
                        >
                            <h1
                                className="text-4xl md:text-5xl font-bold text-center tracking-tight"
                                style={{
                                    background: "linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                    filter: "drop-shadow(0 0 20px rgba(212, 175, 55, 0.4))",
                                    fontFamily: "'Source Serif Pro', serif"
                                }}
                            >
                                Noor Connect
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="text-sm text-[#D4AF37]/80 uppercase tracking-[0.3em] font-semibold"
                        >
                            Islamic Companion
                        </motion.p>

                        {/* Loading Dots - Hide when showing permission request or gender selection */}
                        {!showPermissionRequest && !showGenderSelection && !permissionHandled && !genderHandled && (
                            <motion.div
                                className="flex space-x-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-[#D4AF37]"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                            ease: "easeInOut"
                                        }}
                                        style={{
                                            boxShadow: "0 0 8px rgba(212, 175, 55, 0.6)",
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}

                        {/* Gender Selection */}
                        {showGenderSelection && (
                            <GenderSelection onComplete={handleGenderSelectionComplete} />
                        )}

                        {/* Permission Request */}
                        {showPermissionRequest && (
                            <PermissionRequest
                                onPermissionGranted={handlePermissionGranted}
                                onSkip={handleSkipPermission}
                            />
                        )}
                    </div>

                    {/* Bottom Golden Haze */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                        style={{
                            background: "linear-gradient(to top, rgba(212, 175, 55, 0.1), transparent)",
                        }}
                    />

                    {/* APK Indicator */}
                    {window.matchMedia('(display-mode: standalone)').matches && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                            <Smartphone className="w-3 h-3 text-white/60" />
                            <span className="text-xs text-white/60">App Mode</span>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { PersistentPermissionReminder };
