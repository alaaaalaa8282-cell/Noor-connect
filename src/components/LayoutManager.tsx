import { useEffect, useState } from 'react';
import { useGlobalRadio } from '@/lib/global-radio';

interface LayoutManagerProps {
  children: React.ReactNode;
}

export function LayoutManager({ children }: LayoutManagerProps) {
  const globalRadio = useGlobalRadio();
  // Fixed padding for bottom nav to prevent CLS
  // The radio player will float over content
  const fixedPadding = 'pb-24';

  return (
    <main className={`flex-1 min-h-0 overflow-y-auto pt-safe-top ${fixedPadding} interactive-layer`} id="main-content" role="main">
      {children}
    </main>
  );
}