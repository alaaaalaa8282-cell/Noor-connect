import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import { translations } from '@/lib/translations';

// ICU format resources for proper pluralization
const resources = {
    en: {
        translation: {
            ...translations.en,
            // ICU pluralization examples
            prayers_remaining: '{count, plural, =0 {No prayers remaining} =1 {One prayer remaining} other {# prayers remaining}}',
            days_remaining: '{count, plural, =0 {Today} =1 {Tomorrow} other {# days remaining}}',
            books_downloaded: '{count, plural, =0 {No books downloaded} =1 {One book downloaded} other {# books downloaded}}',
            notifications_scheduled: '{count, plural, =0 {No notifications scheduled} =1 {One notification scheduled} other {# notifications scheduled}}',
        }
    },
    ar: {
        translation: {
            ...translations.ar,
            // Arabic pluralization (zero, one, two, few, many, other)
            prayers_remaining: '{count, plural, zero {لا توجد صلوات متبقية} one {صلاة واحدة متبقية} two {صلاتان متبقيتان} few {# صلوات متبقية} many {# صلاة متبقية} other {# صلاة متبقية}}',
            days_remaining: '{count, plural, zero {اليوم} one {غداً} two {يومان متبقيان} few {# أيام متبقية} many {# يوم متبقي} other {# يوم متبقي}}',
            books_downloaded: '{count, plural, zero {لا توجد كتب محملة} one {كتاب واحد محمل} two {كتابان محملان} few {# كتب محملة} many {# كتاب محمل} other {# كتاب محمل}}',
            notifications_scheduled: '{count, plural, zero {لا توجد إشعارات مجدولة} one {إشعار واحد مجدول} two {إشعاران مجدولان} few {# إشعارات مجدولة} many {# إشعار مجدول} other {# إشعار مجدول}}',
        }
    },
    ur: {
        translation: {
            ...translations.ur,
            // Urdu pluralization
            prayers_remaining: '{count, plural, =0 {کوئی نمازیں باقی نہیں} =1 {ایک نماز باقی ہے} other {# نمازیں باقی ہیں}}',
            days_remaining: '{count, plural, =0 {آج} =1 {کل} other {# دن باقی ہیں}}',
            books_downloaded: '{count, plural, =0 {کوئی کتابیں ڈاؤن لوڈ نہیں ہوئیں} =1 {ایک کتاب ڈاؤن لوڈ ہوئی} other {# کتابیں ڈاؤن لوڈ ہوئیں}}',
            notifications_scheduled: '{count, plural, =0 {کوئی نوٹیفیکیشنز شیڈول نہیں ہیں} =1 {ایک نوٹیفیکیشن شیڈول ہے} other {# نوٹیفیکیشنز شیڈول ہیں}}',
        }
    },
    id: {
        translation: {
            ...translations.id,
            // Bahasa Indonesia pluralization
            prayers_remaining: '{count, plural, =0 {Tidak ada shalat tersisa} =1 {Satu shalat tersisa} other {# shalat tersisa}}',
            days_remaining: '{count, plural, =0 {Hari ini} =1 {Besok} other {# hari tersisa}}',
            books_downloaded: '{count, plural, =0 {Tidak ada buku diunduh} =1 {Satu buku diunduh} other {# buku diunduh}}',
            notifications_scheduled: '{count, plural, =0 {Tidak ada notifikasi dijadwalkan} =1 {Satu notifikasi dijadwalkan} other {# notifikasi dijadwalkan}}',
        }
    },
    tr: {
        translation: {
            ...translations.tr,
            // Turkish pluralization (zero, one, other)
            prayers_remaining: '{count, plural, =0 {Kalan namaz yok} =1 {Bir namaz kaldı} other {# namaz kaldı}}',
            days_remaining: '{count, plural, =0 {Bugün} =1 {Yarın} other {# gün kaldı}}',
            books_downloaded: '{count, plural, =0 {İndirilen kitap yok} =1 {Bir kitap indirildi} other {# kitap indirildi}}',
            notifications_scheduled: '{count, plural, =0 {Planlanmış bildirim yok} =1 {Bir bildirim planlandı} other {# bildirim planlandı}}',
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',
        
        interpolation: {
            escapeValue: false,
        },
        
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
        
        pluralSeparator: '_',
        keySeparator: '.',
        
        // ICU format support
        returnEmptyString: false,
        returnNull: false,
        returnObjects: false,
    });

export default i18n;
