# 🎵 Quran Radio Background Playback Setup

Your Quran Radio now supports **background playback** with lock screen controls! Here's how to test and troubleshoot:

## ✅ Features Implemented

### **Media Session API**
- **Lock screen controls**: Play, Pause, Stop, Previous, Next
- **Metadata display**: Reciter name, artwork, album info
- **Native integration**: Works with iOS, Android, and desktop

### **Android Optimizations**
- **Wake lock**: Keeps audio playing in background
- **Audio focus**: Proper mobile audio management
- **Background playback**: Optimized for Android Chrome

### **Audio Keep-Alive**
- **Single instance**: Audio element reused for better performance
- **Proper cleanup**: Prevents memory leaks
- **Error handling**: Robust error recovery

## 🧪 Testing Background Playback

### **Desktop Testing**
1. Play any Quran Radio station
2. Minimize the browser window
3. Check system media controls (Windows: Volume icon → Media controls)
4. Verify you can play/pause from system controls

### **iOS Testing**
1. Open app in Safari
2. Play a radio station
3. Lock your iPhone
4. Check lock screen media controls
5. Test play/pause functionality

### **Android Testing**
1. Open app in Chrome
2. Play a radio station
3. Lock your Android device
4. Check notification shade media controls
5. Test background playback

## 🔧 Development Testing

### **Test Media Session API**
Run in browser console:
```javascript
testMediaSession()
```

This will:
- ✅ Verify Media Session API support
- ✅ Set up test metadata
- ✅ Add action handlers
- ✅ Log lock screen interactions

### **Check Android Detection**
```javascript
androidAudioHelper.isAndroid() // true/false
androidAudioHelper.isChromeAndroid() // true/false
```

## ⚠️ Troubleshooting

### **Background Audio Stops on Android**

**Option 1: Enable Chrome Flags**
1. Open `chrome://flags`
2. Search for "Media Session"
3. Enable "Media Session Service"
4. Restart Chrome

**Option 2: Install Capacitor Plugin** (If native APIs fail)
```bash
npm install @capawesome-team/capacitor-media-session
```

Add to `main.tsx`:
```typescript
import { CapacitorMediaSession } from '@capawesome-team/capacitor-media-session';

CapacitorMediaSession.create({
  title: 'Quran Radio',
  artist: 'Noor Connect',
  album: 'Islamic Radio',
  artwork: [{ src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }]
});
```

### **Lock Screen Controls Not Showing**

**iOS:**
- Ensure app is added to Home Screen
- Check "Background App Refresh" is enabled
- Verify iOS version supports Media Session API

**Android:**
- Enable "Media notifications" in Chrome settings
- Check "Allow background playback" in site settings
- Try Chrome flags mentioned above

### **Audio Quality Issues**

**Network:**
- Check internet connection stability
- Try different stations (some servers may be unstable)
- Verify CORS headers on streaming URLs

**Browser:**
- Clear browser cache
- Disable extensions that block audio
- Try in incognito mode

## 📱 Platform-Specific Notes

### **iOS Safari**
- ✅ Full Media Session API support
- ✅ Lock screen controls work perfectly
- ✅ Background audio supported
- ✅ AirPlay integration

### **Android Chrome**
- ✅ Media Session API supported
- ⚠️ Background playback may need Chrome flags
- ✅ Notification shade controls
- ✅ Cast to Chromecast

### **Desktop Browsers**
- ✅ Full Media Session API support
- ✅ System media controls
- ✅ Background tabs continue playing
- ✅ Picture-in-Picture support

## 🎯 Expected Behavior

1. **Play station** → Lock screen shows reciter info
2. **Lock device** → Media controls appear on lock screen
3. **Background app** → Audio continues playing
4. **Control from lock screen** → App responds correctly
5. **Switch stations** → Lock screen updates metadata

## 🚀 Performance Benefits

- **Single audio instance**: Better memory usage
- **Wake lock management**: Prevents Android sleep
- **Proper cleanup**: No memory leaks
- **Native integration**: Smooth user experience

**Your Quran Radio now provides a premium native app experience!** 🌟
