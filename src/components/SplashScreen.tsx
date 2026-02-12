import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// Crescent Moon with Framer Motion
function CrescentMoon() {
    return (
        <motion.svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
            </defs>
            <path
                d="M 60 10 A 40 40 0 1 0 60 110 A 32 32 0 1 1 60 10 Z"
                fill="url(#goldGradient)"
                filter="url(#glow)"
            />
        </motion.svg>
    );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Optimized duration for better LCP performance
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 400); // Wait for exit animation
        }, 1200); // Reduced from 2500ms to 1200ms for better LCP

        return () => clearTimeout(timer);
    }, [onComplete]);

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
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
                        {/* Moon Container with Scale In */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative flex flex-col items-center"
                        >
                            {/* Glow behind moon */}
                            <motion.div
                                className="absolute inset-0 -z-10 rounded-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 0.5, duration: 1 }}
                                style={{
                                    background: "radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)",
                                    filter: "blur(40px)",
                                    transform: "scale(1.5)",
                                }}
                            />

                            <CrescentMoon />

                            {/* App Title */}
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="mt-8 text-4xl md:text-5xl font-bold text-center tracking-tight"
                                style={{
                                    background: "linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                    filter: "drop-shadow(0 0 15px rgba(212, 175, 55, 0.3))",
                                    fontFamily: "'Source Serif Pro', serif"
                                }}
                            >
                                Noor Connect
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.8 }}
                                transition={{ delay: 0.8, duration: 0.6 }}
                                className="mt-2 text-sm text-[#D4AF37]/80 uppercase tracking-[0.3em] font-medium"
                            >
                                Islamic Companion
                            </motion.p>
                        </motion.div>

                        {/* Loading Dots */}
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
                    </div>

                    {/* Bottom Golden Haze */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                        style={{
                            background: "linear-gradient(to top, rgba(212, 175, 55, 0.1), transparent)",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
