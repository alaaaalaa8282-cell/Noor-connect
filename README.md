A great GitHub README is essential for F-Droid and for making your project look professional. Since you've cleaned the repository and removed the AI bots, this description will show that Noor Connect is a high-quality, community-focused app.

Copy and paste the following into a file named README.md in your project's root directory:

🌙 Noor Connect
Noor Connect is a privacy-focused, open-source Islamic companion app designed to help you stay connected to your faith. Built as a high-performance Progressive Web App (PWA), it offers essential tools for daily worship with zero ads and zero tracking.

✨ Key Features
100+ Authenticated Hadiths: A curated library of daily wisdom from Sahih Bukhari, Sahih Muslim, and other authentic sources, available entirely offline.

Accurate Prayer Times: Real-time calculation of Salah times based on your location.

Word-by-Word Sync Engine: A specialized reading engine for a deeper understanding of Islamic texts.

Offline First: Designed to work perfectly without an internet connection once installed.

Privacy Centric: No data collection, no accounts, and no third-party analytics. 100% FOSS (Free and Open Source Software).

🚀 Tech Stack
To ensure the app is fast and lightweight (optimized for devices with even 8GB RAM), we use:

Frontend: React + TypeScript + Vite

Styling: Tailwind CSS + Shadcn UI

Mobile Bridge: Capacitor (Ready for Android/APK build)

Data: Local JSON-driven architecture for instant loading

🛠️ Getting Started
Prerequisites
Node.js (v18 or higher)

npm or bun

Installation
Clone the repo:

Bash
git clone https://github.com/your-username/noor-connect.git
cd noor-connect
Install dependencies:

Bash
npm install
Run locally:

Bash
npm run dev
Open http://localhost:8080 in your browser.

📱 Mobile Build (Android)
This project is configured with Capacitor. To generate an APK:

Bash
npm run build
npx cap add android
npx cap open android
📄 License
This project is licensed under the MIT License—see the LICENSE file for details. 
