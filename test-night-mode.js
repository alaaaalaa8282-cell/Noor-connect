/**
 * Night Mode Test
 * Quick test to verify night mode functionality
 */

// Test function to verify night mode is working
export function testNightMode() {
  console.log('🧪 Testing Quran Night Mode');
  
  // Test 1: Check if night mode hook is working
  const { isNightMode, toggleNightMode } = require('./hooks/useQuranNightMode').useQuranNightMode();
  console.log('🌙 Night mode state:', isNightMode);
  
  // Test 2: Check if CSS classes are applied
  const body = document.body;
  const hasNightModeClass = body.classList.contains('quran-night-mode');
  console.log('🎨 Body has night mode class:', hasNightModeClass);
  
  // Test 3: Check if inline styles are applied
  const inlineStyle = document.getElementById('quran-night-mode-inline');
  console.log('🎨 Inline styles found:', !!inlineStyle);
  
  // Test 4: Check if button is visible
  const button = document.querySelector('[data-testid="night-mode-toggle"]');
  console.log('🔘 Night mode button found:', !!button);
  
  return {
    isNightMode,
    hasNightModeClass,
    hasInlineStyles: !!inlineStyle,
    hasButton: !!button,
    toggleNightMode
  };
}

// Run test if called directly
if (typeof window !== 'undefined') {
  window.testNightMode = testNightMode;
}
