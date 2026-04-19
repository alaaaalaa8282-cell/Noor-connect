# Noor Connect — Complete API & Endpoint Manifest

This document provides a comprehensive list of all external API endpoints, CDNs, and streaming services used by Noor Connect. This manifest is intended for privacy auditing and F-Droid metadata declaration.

---

## 🕋 1. Prayer Times & Islamic Calendar
Services used to calculate prayer times and Hijri dates.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `api.aladhan.com` | Primary API for prayer times, Hijri calendar, and Qibla direction. | `aladhan-api.ts`, `Index.tsx`, `IslamicCalendar.tsx` |
| `islamicapi.com` | Optional API for Ramadan, Fasting, and Zakat Nisab data. | `constants.ts` |

---

## 📖 2. Quran Content (Text & Tafsir)
Services providing the text of the Holy Quran and its various interpretations.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `api.alquran.cloud` | Fetching Surah metadata, Uthmani text, and translations. | `Quran.tsx`, `Tafsir-New.tsx` |
| `cdn.jsdelivr.net` | CDN hosting for `quran-json` (Surah text) and `tafsir_api`. | `quran-service.ts`, `QuranReader.tsx`, `tafsir.ts` |
| `staticquran.vercel.app` | Alternative API for Surah listings. | `quran-audio.ts` |

---

## 🎧 3. Audio & Radio Streams
Services providing audio recitations and live Islamic radio.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `download.quranicaudio.com` | CDN for various Qaris (reciters) audio files. | `quran-audio.ts` |
| `mp3quran.net` | Large directory of Quran radio stations. | `quran-radio.ts` |
| `backup.qurango.net` | Targeted radio streams (Mix, Al-Baqarah, etc.). | `quran-radio.ts`, `radio-browser.ts`, `m3u-parser.ts` |
| `all.api.radio-browser.info` | Global radio station directory searching. | `radio-browser.ts` |
| `radiojar.com` | Specific Islamic radio stream hosting. | `radio-browser.ts` |
| `qurankareem.radio:8000` | Direct Shoutcast/Icecast radio stream. | `radio-browser.ts` |
| `streamguys1.com:7220` | Server for "Islamic Radio" streams. | `stream-proxy.ts` |
| `stream.radioquran.net` | Server for "Quran Stream" (Arabic). | `stream-proxy.ts` |

---

## 📺 4. Live Video Transmission
Direct HLS streaming for Makkah and Madinah live views.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `iptv-org.github.io` | Open-source IPTV playlist used to find live channels. | `m3u-parser.ts` |
| `akamaized.net` | Akamai CDN hosting official Saudi HLS streams. | `m3u-parser.ts` |
| `sauditv.live` | Web gateway for Saudi Quran/Sunnah TV streams. | `stream-proxy.ts` |
| `www.haramain.tv` | Live stream source for Masjid al-Haram. | `stream-proxy.ts` |
| `www.nabawi.tv` | Live stream source for Masjid an-Nabawi. | `stream-proxy.ts` |

---

## 💰 5. Financial & Nisab Utilities
Services used for Zakat calculation and currency conversion.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `open.er-api.com` | Real-time exchange rates (USD to local currency). | `zakatNisab.ts` |
| `freegoldapi.com` | Live gold and silver prices for Nisab threshold. | `constants.ts` |

---

## 📍 6. Location & Geocoding
Services used for city search and location detection.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `photon.komoot.io` | Open-source geocoding API for city search. | `photon-api.ts` |

---

## 🔗 7. External Links & Community
UI links to community and source platforms.

| Service / Domain | Purpose | Implementation File |
| :--- | :--- | :--- |
| `discord.gg` | Official community Discord server. | `Profile.tsx` |
| `github.com` | Project source code repository. | `Profile.tsx` |

---

## 🛡️ Privacy Notes
- **No Tracking SDKs**: This application does not contain Firebase, Google Analytics, or any other user-tracking telemetry.
- **Direct Streaming**: All video and audio streams are played directly via HLS or audio players without proprietary intermediary SDKs.
- **YouTube Removed**: The application has been sanitized of all YouTube API dependencies and embeds.
