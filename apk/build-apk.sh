#!/usr/bin/env bash
set -euo pipefail
echo "Starting APK build (Unix)"
echo "1) Build web assets"
npm run build
echo "2) Sync Capacitor Android project"
npx cap sync android
if [ -f "./android/gradlew" ]; then
  echo "3) Building debug APK with Gradle wrapper"
  ./android/gradlew -p android assembleDebug
  echo "APK generated at android/app/build/outputs/apk/debug/app-debug.apk"
else
  echo "gradlew not found. Please open android/ in Android Studio and build the APK, or run 'npx cap open android' to generate the project."
fi
