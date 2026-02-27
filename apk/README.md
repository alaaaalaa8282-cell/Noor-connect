APK build workflow for Capacitor Android.
Prerequisites:
- Android Studio installed (or at least Android SDK with command-line tools)
- Node and npm
- The project must be prepared with Capacitor and an Android project
Steps:
- Run: npm run build
- Run: npx cap sync android
- Open Android Studio and build the APK (Build > Build Bundle(s) / APK(s) > Build APK(s))
- The resulting APK will be at android/app/build/outputs/apk/debug/app-debug.apk (for debug) or app-release.apk for release after signing
Notes:
- You can automate the last step with the included scripts.
