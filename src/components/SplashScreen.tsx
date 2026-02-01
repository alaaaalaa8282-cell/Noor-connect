import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Show splash for 2 seconds, then exit
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 2000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#E5EBE6]" // "Cream green gray" base
                >
                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F0F4F1] via-[#DAE2DD] to-[#C4CEC7] opacity-80" />

                    {/* Logo Container */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 flex flex-col items-center"
                    >
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/30 backdrop-blur-md">
                            <img
                                src="/icon-512x512.png"
                                alt="Noor Connect Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="mt-6 text-center space-y-1"
                        >
                            <h1 className="text-2xl font-bold font-serif tracking-widest text-[#4A5D4F]">NOOR CONNECT</h1>
                            <p className="text-xs text-[#6B7F70] uppercase tracking-[0.2em] font-medium">Islamic Companion</p>
                        </motion.div>
                    </motion.div>

                    {/* Loading Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute bottom-12"
                    >
                        <div className="flex gap-1.5">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-[#4A5D4F]/40" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#4A5D4F]/40" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#4A5D4F]/40" />
                        </div>
                    </motion.div>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
