import { lazy } from 'react';

// Lazy load heavy radio components only when needed (using named exports)
export const GlobalRadioPlayer = lazy(() => import('../GlobalRadioPlayer').then(module => ({ 
  default: module.GlobalRadioPlayer 
})));

export const GlobalQuranPlayer = lazy(() => import('../GlobalQuranPlayer').then(module => ({ 
  default: module.GlobalQuranPlayer 
})));

// Lazy load radio stations data
export const loadRadioStations = () => import('../../data/radio-stations');
