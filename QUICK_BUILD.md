# 🚀 Quick Build Commands

## Build APK (3 Simple Steps)

### 1. Build Web App
```bash
npm run build
```

### 2. Sync to Android
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

Then in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## ✅ What's Already Done

### Background Service ✓
- **NoorConnectService** runs in background
- Keeps app alive even when closed
- Auto-restarts if killed
- Shows persistent notification

### Boot Receiver ✓
- Starts service when phone boots
- No manual intervention needed
- Works automatically

### Permissions ✓
All required permissions added:
- Foreground service
- Boot completed
- Notifications
- Exact alarms
- Wake lock

---

## 🧪 Quick Test

After installing APK:

1. **Open app** → Should see notification "Prayer times and notifications active"
2. **Swipe away app** → Notification should reappear in 30 seconds
3. **Restart phone** → Notification should appear after boot
4. **Wait for prayer time** → Should get notification even if app closed

---

## 🔧 If Something Doesn't Work

### Service not starting?
- Grant notification permissions
- Disable battery optimization for Noor Connect
- Rebuild APK

### Not starting on boot?
- Enable "Autostart" in phone settings (Xiaomi, Huawei, etc.)
- Ensure app installed on internal storage

### Notifications not showing?
- Grant notification permissions
- Check notification settings for the app
- Ensure "Do Not Disturb" is off

---

## 📱 APK Location

After build:
- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`

---

**For detailed guide, see `APK_BUILD_GUIDE.md`**
