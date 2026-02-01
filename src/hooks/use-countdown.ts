import { useState, useEffect, useCallback } from 'react';

interface CountdownReturn {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  formattedTime: string;
}

export const useCountdown = (targetTime: Date): CountdownReturn => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date();
    const difference = targetTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(difference / 1000));
  });

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const difference = targetTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(difference / 1000));
  }, [targetTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft === 0;
  
  const formattedTime = isExpired 
    ? 'Expired' 
    : minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m ${seconds}s left`
      : minutes > 0 
        ? `${minutes}m ${seconds}s left`
        : `${seconds}s left`;

  return {
    minutes,
    seconds,
    totalSeconds: timeLeft,
    isExpired,
    formattedTime
  };
};
