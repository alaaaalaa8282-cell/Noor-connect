/**
 * Media Session API Test
 * Run this in browser console to test lock screen controls
 */

export function testMediaSessionAPI() {
  console.log('🎵 Testing Media Session API...');
  
  // Check if Media Session API is available
  if (!('mediaSession' in navigator)) {
    console.error('❌ Media Session API not supported in this browser');
    return false;
  }

  console.log('✅ Media Session API is supported');

  try {
    // Set test metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Test Station',
      artist: 'Noor Connect',
      album: 'Quran Radio',
      artwork: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    });

    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('▶️ Play action triggered from lock screen');
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('⏸️ Pause action triggered from lock screen');
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      console.log('⏹️ Stop action triggered from lock screen');
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('⏮️ Previous track action triggered from lock screen');
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('⏭️ Next track action triggered from lock screen');
    });

    console.log('✅ Media Session API setup complete');
    console.log('📱 Lock screen controls should now be available');
    console.log('🔒 Lock your device and check the media controls');
    
    return true;
  } catch (error) {
    console.error('❌ Media Session API setup failed:', error);
    return false;
  }
}

// Auto-run in development mode
if (process.env.NODE_ENV === 'development') {
  // Add test function to window for easy access
  (window as any).testMediaSession = testMediaSessionAPI;
  console.log('💡 Run testMediaSession() in console to test Media Session API');
}
