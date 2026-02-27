@echo off
echo Building web assets...
npm run build
echo Syncing Capacitor Android...
npx cap sync android
if exist android\gradlew.bat (
  echo Building debug APK with Gradle wrapper...
  call android\gradlew.bat -p android assembleDebug
  echo APK should be at android\app\build\outputs\apk\debug\app-debug.apk
) else (
  echo gradlew not found. Open android/ in Android Studio to build.
)
pause
