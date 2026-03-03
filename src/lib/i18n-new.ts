import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import HttpApi from 'i18next-http-backend';
import resourcesToBackend from 'i18next-resources-to-backend';

// Import local JSON files
import enTranslations from '../locales/en.json';
import urTranslations from '../locales/ur.json';
import trTranslations from '../locales/tr.json';
import idTranslations from '../locales/id.json';

// Local JSON resources
const localResources = {
  en: { translation: enTranslations },
  ur: { translation: urTranslations },
  tr: { translation: trTranslations },
  id: { translation: idTranslations },
};

// ICU format resources for proper pluralization
const icuResources = {
  en: {
    prayers_remaining: '{count, plural, =0 {No prayers remaining} =1 {One prayer remaining} other {# prayers remaining}}',
    days_remaining: '{count, plural, =0 {Today} =1 {Tomorrow} other {# days remaining}}',
    books_downloaded: '{count, plural, =0 {No books downloaded} =1 {One book downloaded} other {# books downloaded}}',
    notifications_scheduled: '{count, plural, =0 {No notifications scheduled} =1 {One notification scheduled} other {# notifications scheduled}}',
  },
  ur: {
    prayers_remaining: '{count, plural, zero {کوئی نماز باقی نہیں ہے} one {ایک نماز باقی ہے} other {# نمازیں باقی ہیں}}',
    days_remaining: '{count, plural, zero {آج} one {کل} other {# دن باقی ہیں}}',
    books_downloaded: '{count, plural, zero {کوئی کتاب ڈاؤن لوڈ نہیں ہوئی} one {ایک کتاب ڈاؤن لوڈ ہوئی} other {# کتابیں ڈاؤن لوڈ ہوئیں}}',
    notifications_scheduled: '{count, plural, zero {کوئی نوٹیفیکیشن شیڈول نہیں کی گئی} one {ایک نوٹیفیکیشن شیڈول کی گئی} other {# نوٹیفیکیشنز شیڈول کی گئیں}}',
  },
  tr: {
    prayers_remaining: '{count, plural, =0 {Kalan namaz yok} =1 {Bir namaz kaldı} other {# namaz kaldı}}',
    days_remaining: '{count, plural, =0 {Bugün} =1 {Yarın} other {# gün kaldı}}',
    books_downloaded: '{count, plural, =0 {İndirilen kitap yok} =1 {Bir kitap indirildi} other {# kitap indirildi}}',
    notifications_scheduled: '{count, plural, =0 {Zamanlanmış bildirim yok} =1 {Bir bildirim zamanlandı} other {# bildirim zamanlandı}}',
  },
  id: {
    prayers_remaining: '{count, plural, =0 {Tidak ada shalat tersisa} =1 {Satu shalat tersisa} other {# shalat tersisa}}',
    days_remaining: '{count, plural, =0 {Hari ini} =1 {Besok} other {# hari tersisa}}',
    books_downloaded: '{count, plural, =0 {Tidak ada buku yang diunduh} =1 {Satu buku diunduh} other {# buku diunduh}}',
    notifications_scheduled: '{count, plural, =0 {Tidak ada notifikasi dijadwalkan} =1 {Satu notifikasi dijadwalkan} other {# notifikasi dijadwalkan}}',
  },
};

// Merge local resources with ICU resources
const mergedResources = {
  en: { translation: { ...localResources.en.translation, ...icuResources.en } },
  ur: { translation: { ...localResources.ur.translation, ...icuResources.ur } },
  tr: { translation: { ...localResources.tr.translation, ...icuResources.tr } },
  id: { translation: { ...localResources.id.translation, ...icuResources.id } },
};

// Initialize i18next
i18n
  .use(ChainedBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language configuration
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: false, // Set to true for development debugging
    
    // Backend configuration with chaining
    backend: {
      backends: [
        LocalStorageBackend, // Layer 1: localStorage (caching)
        resourcesToBackend(mergedResources) // Layer 2: Local JSON files (fallback)
      ],
      backendOptions: [
        {
          // LocalStorage backend options
          prefix: 'i18next_',
          expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
          defaultVersion: undefined,
          store: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
        {
          // Local resources backend options (no additional options needed)
        }
      ]
    },
    
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // React configuration
    react: {
      useSuspense: false,
    },
    
    // Resources (fallback for chained backend)
    resources: mergedResources,
  });

export default i18n;
