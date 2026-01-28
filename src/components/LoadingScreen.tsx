import { useEffect, useState, useMemo } from "react";

// Crescent Moon SVG Component with CSS animation
function CrescentMoon() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin-slow"
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
    </svg>
  );
}

// Floating Stars Background with CSS animations
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
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white/60 animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        onLoadingComplete();
      }, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: "linear-gradient(135deg, #0a1128 0%, #1a237e 50%, #0d1b2a 100%)",
      }}
    >
      {/* Floating Stars Background */}
      <FloatingStars />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-4">
        {/* Logo and Moon Container */}
        <div className="relative flex flex-col items-center animate-scale-in">
          {/* Crescent Moon */}
          <div className="relative">
            <CrescentMoon />
            
            {/* Glow effect behind moon */}
            <div 
              className="absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
                filter: "blur(30px)",
                transform: "scale(1.5)",
              }}
            />
          </div>

          {/* App Title */}
          <h1
            className="mt-6 text-4xl md:text-5xl font-bold text-center animate-fade-in"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(212, 175, 55, 0.5))",
              animationDelay: "0.3s",
            }}
          >
            Islamic Companion
          </h1>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
                boxShadow: "0 0 10px rgba(212, 175, 55, 0.8)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Gradient Glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(212, 175, 55, 0.15), transparent)",
        }}
      />
    </div>
  );
}
