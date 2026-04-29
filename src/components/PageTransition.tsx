import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
    },
    in: {
        opacity: 1,
    },
};

const pageTransition = {
    type: "tween",
    ease: "easeOut",
    duration: 0.15,
} as const;

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
    const { animationEnabled } = useSettings();

    if (!animationEnabled) {
        return <div className={`w-full h-full ${className}`}>{children}</div>;
    }

    return (
        <motion.div
            initial="initial"
            animate="in"
            variants={pageVariants}
            transition={pageTransition}
            className={`w-full h-full ${className}`}
        >
            {children}
        </motion.div>
    );
};
