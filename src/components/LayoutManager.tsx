import { useEffect, useState } from 'react';
import { useGlobalRadio } from '@/lib/global-radio';

interface LayoutManagerProps {
  children: React.ReactNode;
}

export function LayoutManager({ children }: LayoutManagerProps) {
  const globalRadio = useGlobalRadio();
  const [dynamicPadding, setDynamicPadding] = useState('pb-0');

  useEffect(() => {
    // Only add padding for radio player, not bottom nav (which is fixed)
    const newPadding = globalRadio?.currentStation ? 'pb-20' : 'pb-0';
    setDynamicPadding(newPadding);
  }, [globalRadio?.currentStation]);

  return (
    <main className={`flex-1 min-h-0 overflow-y-auto pt-safe-top ${dynamicPadding}`} id="main-content" role="main">
      {children}
    </main>
  );
}
