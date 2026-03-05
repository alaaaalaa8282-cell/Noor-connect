# 🌙 Noor Connect - Your Ultimate Islamic Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/darkmaster0345/Noor-connect) [![Status](https://img.shields.io/badge/status-stable-green.svg)](https://github.com/darkmaster0345/Noor-connect)

**Noor Connect** is a comprehensive, beautiful, and privacy-focused Islamic application designed to help you stay connected with your faith. Built with modern web technologies and optimized for mobile experiences via Capacitor, it serves as your digital companion for daily spiritual growth.

---

## ✨ Key Features (v1.1)

### 📖 Holy Quran & Tafsir
- Complete Quran with beautiful, readable interface
- **Enhanced Tafsir Explorer**: 25+ Quranic commentary editions via high-speed spa5k API integration
- Multilingual Tafsirs: English, Arabic, Bengali, Urdu, Russian, and Kurdish
- Audio playback with multiple reciters
- Progress tracking and bookmarking
- Highly customizable font styling (including Uthmani and Indo-Pak script support)

### ⏲️ Accurate Prayer Times & Adhan
- Localization-based prayer timings worldwide (offline fallback support)
- Customizable Adhan notifications with multiple sounds
- Global prayer alarm system
- Prayer method & Madhab calculation selection (Hanafi, Shafi'i)

### 🕋 Qibla Finder
- High-precision compass for Kaaba direction utilizing device sensors
- Works from anywhere in the world
- Manual backup compass mode for devices without native sensors

### 📻 Quran Radio & E-books
- 24/7 Quran recitations from global stations via streaming
- Live streams from Makkah and Madinah
- Rich Islamic E-books library built with modern UI and PDF parsing

### 🌙 Ramadan Mode
- Suhoor/Iftar timings with countdown
- Fasting tracker with 30-day calendar
- Tarawih prayer tracking and daily charity log
- Water reminders for healthy hydration

### 📿 Spiritual & Gamified Tracking
- **Qaza Tracker**: Systematically log and track missed prayers
- **Weekly Salah Chart**: Visual representation of your prayer consistency
- **Digital Tasbeeh**: Interactive Dhikr counter with goals
- **Habit Tracker**: Build consistent spiritual habits
- **Menstrual Mode**: Personalized tracking for women, seamlessly adapting prayer notifications

---

## 🚀 Technical Excellence

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion for premium, glassmorphism interactions
- **Mobile Native Bridge**: Capacitor for deep Android integrations (Widgets, Notifications, Geolocation)
- **Internationalization (i18n)**: Fully resilient multilingual support (en, ar, ur, bn, ru) with strict RTL layout preservation
- **Offline-First PWA**: Service Workers ensure the app functions even without an internet connection
- **No Third-Party Analytics**: 100% private, your data stays entirely on your device

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18+
- **Android Studio**: For APK builds

### Local Development

```bash
# Clone and install
git clone https://github.com/darkmaster0345/Noor-connect.git
cd Noor-connect
npm install

# Run development server
npm run dev
```

### Android Build

```bash
# Build web assets for production
npm run build

# Sync assets and capacitor plugins
npx cap sync android

# Open in Android Studio to build APK
npx cap open android
```

---

## 🆕 Recent Updates (v1.1.0)
- **Tafsir & Hadith Capabilities**: Integrated a robust Tafsir Explorer and comprehensive new Hadith collection features.
- **UI/UX Revolution**: Reordered the Dashboard for better user experience, optimized home-screen widgets with a premium glassmorphism design, and removed unnecessary splash screens.
- **Notification & Interactivity Fixes**: Heavily improved the adhan and notification system for greater reliability, fixing background execution and alarm scheduling bugs.
- **Data Protection**: Implemented a comprehensive Backup and Restore feature allowing users to export and import all settings, progress, and books to a single file.
- **Performance & Cleanup**: Engineered a massive optimization to the Hadith UI to prevent lag with large books, pruned unused app code, and polished the translation architecture.

---

## 🔮 Planned for Version 1.2.0

*Development for v1.2.0 will introduce highly-requested personal lifestyle implementations:*

1. **Hifz (Memorization) Companion**
   - A dedicated flashcard-style memorization mode utilizing Spaced Repetition System (SRS).
   - Audio-syncing to allow recitation practice (pausing after Ayahs).
2. **OpenStreetMap Halal & Mosque Radar**
   - Integration with OSM's Overpass API to locate nearby mosques and halal dietary options natively.
3. **Islamic Finance & Sadaqah Tracker**
   - Advanced offline ledger for managing charitable giving and precise Zakat history over varying Hawl cycles.
4. **"On This Day" in Islamic History**
   - Enrich the dashboard with a daily educational widget surfacing historical events aligned with the current Hijri date.
5. **Personal Privacy / Reflection Journal (Tafakkur)**
   - Secure, on-device only encrypted spiritual notebook for Duas, Quranic reflections, and gratitude tracking.

---

## 🛡️ Privacy & Ethics

Noor Connect is built with "Privacy First" principles:
- **No tracking**: Your personal data and prayer habits are never tracked.
- **Local storage**: All states and data are stored strictly via `localStorage` or Capacitor native storage.
- **No analytics**: Zero third-party analytics or data collection scripts.
- **Open source**: Transparent code you can trust.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <i>"Indeed, in the remembrance of Allah do hearts find rest." (Ar-Ra'd 13:28)</i>
</p>
<img width="4096" height="2289" alt="noor connect modified(1)(1)" src="https://github.com/user-attachments/assets/4b7cd64b-416e-4447-8b6b-dd8e2a5fed3a" />

