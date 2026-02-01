import { useEffect, useState } from 'react';
import { useGlobalRadio } from '@/lib/global-radio';

interface LayoutManagerProps {
  children: React.ReactNode;
}

export function LayoutManager({ children }: LayoutManagerProps) {
  const globalRadio = useGlobalRadio();
  const [dynamicPadding, setDynamicPadding] = useState('pb-20'); // Base padding for bottom nav

  useEffect(() => {
    // Add extra padding for radio player when active
    const newPadding = globalRadio?.currentStation ? 'pb-36' : 'pb-20';
    setDynamicPadding(newPadding);
  }, [globalRadio?.currentStation]);

  return (
    <main className={`flex-1 min-h-0 overflow-y-auto pt-safe-top ${dynamicPadding} interactive-layer`} id="main-content" role="main">
      {children}
    </main>
  );
}
