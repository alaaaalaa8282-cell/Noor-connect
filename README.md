# 🌙 Noor Connect - Your Ultimate Islamic Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/darkmaster0345/Noor-connect) [![Status](https://img.shields.io/badge/status-stable-green.svg)](https://github.com/darkmaster0345/Noor-connect)

**Noor Connect** is a comprehensive, beautiful, and privacy-focused Islamic application designed to help you stay connected with your faith. Built with modern web technologies and optimized for mobile experiences via Capacitor, it serves as your digital companion for daily spiritual growth.

---

## ✨ Key Features

### 📖 Holy Quran
- Complete Quran with beautiful, readable interface
- Detailed Surah information and recitations
- Audio playback with multiple reciters
- Progress tracking and bookmarking

### ⏲️ Accurate Prayer Times & Adhan
- Localization-based prayer timings worldwide
- Customizable Adhan notifications with multiple sounds
- Global prayer alarm system
- Prayer method selection (Hanafi, Shafi, Maliki, Hanbali)

### 🕋 Qibla Finder
- High-precision compass for Kaaba direction
- Works from anywhere in the world
- Visual guidance with distance indicators
- Manual backup compass for devices without sensors

### 📻 Quran Radio & Live Streams
- 24/7 Quran recitations from global stations
- Live streams from Makkah and Madinah
- Background playback support
- Enhanced error handling with automatic format fallback
- **NEW**: Improved audio streaming with retry mechanisms

### 🌙 Ramadan Mode
- Suhoor/Iftar timings with countdown
- Fasting tracker with 30-day calendar
- Tarawih prayer tracking
- Quran reading progress (Juz by Juz)
- Charity and good deeds tracker
- Water reminders for hydration

### 📿 Spiritual Tools
- **Digital Tasbeeh**: Interactive Dhikr counter
- **Qaza Tracker**: Log and track missed prayers
- **Habit Tracker**: Build consistent spiritual habits
- **Prayer Stats**: Visualize prayer consistency
- **Menstrual Mode**: Personalized tracking for women

### 📚 Knowledge & Wisdom
- **Duas & Hadith**: Authentic supplications and traditions
- **99 Names of Allah**: Reflect on divine attributes
- **Islamic Quiz**: Test and expand knowledge
- **E-Books**: Islamic literature library

### 💰 Zakat Calculator
- Quick and accurate Zakat calculations
- Wealth distribution guidance
- Multiple asset types supported

---

## 🚀 Technical Excellence

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion for smooth interactions
- **Mobile**: Capacitor (Android) with native integrations
- **Reliability**: PWA with Service Workers for offline access
- **Calculations**: Adhan library for precise prayer times
- **Performance**: Optimized with lazy loading and caching
- **Audio**: Enhanced HLS.js integration with format detection
- **Error Handling**: Robust fallback mechanisms and retry logic

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18+
- **npm** or **bun**
- **Android Studio**: For APK builds

### Local Development

```bash
# Clone and install
git clone https://github.com/darkmaster0345/Noor-connect.git
cd Noor-connect
npm install

# Run development
npm run dev
```

### Android Build

```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## 🛡️ Privacy & Ethics

Noor Connect is built with "Privacy First" principles:
- **No tracking**: Your personal data and prayer habits are never tracked
- **Local storage**: All data stored locally on your device
- **No analytics**: No third-party analytics or data collection
- **Open source**: Transparent code you can trust

---

## 📱 Features Highlights

### Gender-Based Personalization
- First-time gender selection for tailored experience
- Menstrual mode for women's health tracking
- Privacy-focused with local storage only

### Smart Notifications
- Prayer time alerts with Adhan
- Ramadan Suhoor/Iftar reminders
- Hydration reminders during fasting
- Quran reading and charity reminders

### Offline Capabilities
- Cached prayer times
- Offline Quran access
- Works without internet connection

### Enhanced Audio Experience
- **Robust Error Handling**: Automatic format detection and fallback
- **Stream Reliability**: Retry mechanisms for failed connections
- **Cross-Origin Support**: CORS handling for various radio streams
- **Extension Compatibility**: Suppresses browser extension conflicts

---

## 🆕 Recent Updates (v1.1.0)

### 🐛 Bug Fixes
- **Radio Player**: Fixed MediaError code 4 (format error) with automatic format fallback
- **Chrome Extension**: Suppressed extension-related console errors
- **Audio Streaming**: Enhanced CORS handling and retry logic
- **Qibla Compass**: Improved sensor detection and calibration

### 🔧 Technical Improvements
- Added intelligent audio format detection (MP3, AAC, M3U8, OGG)
- Implemented progressive retry mechanisms with cache-busting
- Enhanced error suppression for browser extensions
- Improved cross-origin resource sharing for radio streams

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <i>"Indeed, in the remembrance of Allah do hearts find rest." (Ar-Ra'd 13:28)</i>
</p>
