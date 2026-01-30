/**
 * Layout Manager for handling dynamic padding when radio player is visible
 */
import { useGlobalRadio } from './global-radio';

export function useDynamicPadding() {
  const globalRadio = useGlobalRadio();
  
  // Calculate bottom padding based on radio player visibility
  const bottomPadding = globalRadio?.currentStation ? 'pb-32' : 'pb-20';
  
  return {
    bottomPadding,
    hasRadioPlayer: !!globalRadio?.currentStation
  };
}
