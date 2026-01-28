import { z } from "zod";

// AlAdhan Prayer Times API Schema
export const prayerTimingsSchema = z.object({
  Fajr: z.string(),
  Sunrise: z.string().optional(),
  Dhuhr: z.string(),
  Asr: z.string(),
  Sunset: z.string().optional(),
  Maghrib: z.string(),
  Isha: z.string(),
  Imsak: z.string().optional(),
  Midnight: z.string().optional(),
  Firstthird: z.string().optional(),
  Lastthird: z.string().optional(),
});

export const hijriDateSchema = z.object({
  date: z.string(),
  format: z.string().optional(),
  day: z.string(),
  weekday: z.object({
    en: z.string(),
    ar: z.string().optional(),
  }),
  month: z.object({
    number: z.number(),
    en: z.string(),
    ar: z.string().optional(),
  }),
  year: z.string(),
  designation: z.object({
    abbreviated: z.string(),
    expanded: z.string().optional(),
  }).optional(),
  holidays: z.array(z.string()).optional(),
});

export const gregorianDateSchema = z.object({
  date: z.string(),
  format: z.string().optional(),
  day: z.string(),
  weekday: z.object({
    en: z.string(),
  }).optional(),
  month: z.object({
    number: z.number(),
    en: z.string(),
  }),
  year: z.string(),
  designation: z.object({
    abbreviated: z.string(),
    expanded: z.string().optional(),
  }).optional(),
});

export const prayerTimesApiResponseSchema = z.object({
  code: z.number(),
  status: z.string().optional(),
  data: z.object({
    timings: prayerTimingsSchema,
    date: z.object({
      readable: z.string().optional(),
      timestamp: z.string().optional(),
      hijri: hijriDateSchema,
      gregorian: gregorianDateSchema.optional(),
    }),
    meta: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      timezone: z.string().optional(),
      method: z.object({
        id: z.number(),
        name: z.string(),
      }).optional(),
    }).optional(),
  }),
});

// AlAdhan Calendar API Schema
export const calendarDaySchema = z.object({
  hijri: hijriDateSchema,
  gregorian: gregorianDateSchema,
});

export const calendarApiResponseSchema = z.object({
  code: z.number(),
  status: z.string().optional(),
  data: z.array(calendarDaySchema),
});

// AlAdhan Gregorian to Hijri API Schema
export const gToHApiResponseSchema = z.object({
  code: z.number(),
  status: z.string().optional(),
  data: z.object({
    hijri: hijriDateSchema,
    gregorian: gregorianDateSchema,
  }),
});

// AlQuran Cloud API Schema
export const surahSchema = z.object({
  number: z.number(),
  name: z.string(),
  englishName: z.string(),
  englishNameTranslation: z.string(),
  numberOfAyahs: z.number(),
  revelationType: z.string(),
}).required();

export const quranSurahListResponseSchema = z.object({
  code: z.number(),
  status: z.string().optional(),
  data: z.array(surahSchema),
});

// Random Hadith API Schema
export const hadithApiResponseSchema = z.object({
  data: z.object({
    hadith_english: z.string().optional(),
    hadith: z.string().optional(),
    header: z.string().optional(),
    hadithNumber: z.union([z.string(), z.number()]).optional(),
    book: z.string().optional(),
  }),
});

// Helper function to safely parse API responses
export function safeParseApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback?: T
): { success: true; data: T } | { success: false; error: string; data?: T } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  console.error("API response validation failed:", result.error.message);
  
  if (fallback !== undefined) {
    return { success: false, error: result.error.message, data: fallback };
  }
  
  return { success: false, error: result.error.message };
}

// Type exports
export type PrayerTimings = z.infer<typeof prayerTimingsSchema>;
export type HijriDate = z.infer<typeof hijriDateSchema>;
export type GregorianDate = z.infer<typeof gregorianDateSchema>;
export type PrayerTimesApiResponse = z.infer<typeof prayerTimesApiResponseSchema>;
export type CalendarApiResponse = z.infer<typeof calendarApiResponseSchema>;
export type QuranSurahListResponse = z.infer<typeof quranSurahListResponseSchema>;
export type HadithApiResponse = z.infer<typeof hadithApiResponseSchema>;
