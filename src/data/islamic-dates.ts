/**
 * Important Islamic Dates Data Structure
 * Contains key Islamic events with their Hijri and approximate Gregorian dates
 */

export interface IslamicDate {
  id: string;
  name: string;
  arabicName: string;
  hijriMonth: number;
  hijriDay: number;
  description: string;
  type: 'eid' | 'ramadan' | 'hajj' | 'other';
  notificationMessage: string;
}

export const importantIslamicDates: IslamicDate[] = [
  // Ramadan
  {
    id: 'ramadan-start',
    name: 'Ramadan Begins',
    arabicName: 'رمضان المبارك',
    hijriMonth: 9,
    hijriDay: 1,
    description: 'First day of Ramadan - Month of fasting',
    type: 'ramadan',
    notificationMessage: 'Ramadan has begun! May Allah accept your fasting.'
  },
  {
    id: 'laylat-al-qadr',
    name: 'Laylat al-Qadr',
    arabicName: 'ليلة القدر',
    hijriMonth: 9,
    hijriDay: 27,
    description: 'Night of Power - Better than 1000 months',
    type: 'ramadan',
    notificationMessage: 'Tonight is Laylat al-Qadr! Seek forgiveness and mercy from Allah.'
  },
  {
    id: 'ramadan-end',
    name: 'Ramadan Ends',
    arabicName: 'نهاية رمضان',
    hijriMonth: 9,
    hijriDay: 30,
    description: 'Last day of Ramadan',
    type: 'ramadan',
    notificationMessage: 'Last day of Ramadan. May Allah accept your deeds.'
  },

  // Eid-ul-Fitr
  {
    id: 'eid-ul-fitr',
    name: 'Eid-ul-Fitr',
    arabicName: 'عيد الفطر',
    hijriMonth: 10,
    hijriDay: 1,
    description: 'Festival of Breaking the Fast',
    type: 'eid',
    notificationMessage: 'Eid Mubarak! May Allah accept your fasting and good deeds.'
  },

  // Hajj Season
  {
    id: 'dhul-hijjah-start',
    name: 'Dhul Hijjah Begins',
    arabicName: 'ذو الحجة',
    hijriMonth: 12,
    hijriDay: 1,
    description: 'First day of Dhul Hijjah - Sacred month',
    type: 'hajj',
    notificationMessage: 'Dhul Hijjah has begun! The first ten days are blessed.'
  },
  {
    id: 'arafah-day',
    name: 'Day of Arafah',
    arabicName: 'يوم عرفة',
    hijriMonth: 12,
    hijriDay: 9,
    description: 'Day of Arafah - Peak of Hajj',
    type: 'hajj',
    notificationMessage: 'Day of Arafah! Fast today for forgiveness of sins.'
  },
  {
    id: 'eid-ul-adha',
    name: 'Eid-ul-Adha',
    arabicName: 'عيد الأضحى',
    hijriMonth: 12,
    hijriDay: 10,
    description: 'Festival of Sacrifice',
    type: 'eid',
    notificationMessage: 'Eid Mubarak! May Allah accept your sacrifices and good deeds.'
  },

  // Other Important Dates
  {
    id: 'muharram-start',
    name: 'Islamic New Year',
    arabicName: 'رأس السنة الهجرية',
    hijriMonth: 1,
    hijriDay: 1,
    description: 'First day of Islamic New Year',
    type: 'other',
    notificationMessage: 'Islamic New Year has begun! May Allah bless your year.'
  },
  {
    id: 'ashura-day',
    name: 'Day of Ashura',
    arabicName: 'يوم عاشوراء',
    hijriMonth: 1,
    hijriDay: 10,
    description: 'Day of Ashura - Significant fasting day',
    type: 'other',
    notificationMessage: 'Day of Ashura! Fast today for great rewards.'
  },
  {
    id: 'prophet-birthday',
    name: 'Prophet Muhammad\'s Birthday',
    arabicName: 'المولد النبوي',
    hijriMonth: 3,
    hijriDay: 12,
    description: 'Birthday of Prophet Muhammad (PBUH)',
    type: 'other',
    notificationMessage: 'Remember the Prophet (PBUH) today with love and respect.'
  },
  {
    id: 'lailat-al-miraj',
    name: 'Lailat al-Miraj',
    arabicName: 'ليلة المعراج',
    hijriMonth: 7,
    hijriDay: 27,
    description: 'Night Journey and Ascension',
    type: 'other',
    notificationMessage: 'Remember the Prophet\'s Night Journey tonight.'
  },
  {
    id: 'lailat-al-barat',
    name: 'Lailat al-Barat',
    arabicName: 'ليلة البراءة',
    hijriMonth: 8,
    hijriDay: 15,
    description: 'Night of Forgiveness',
    type: 'other',
    notificationMessage: 'Night of Forgiveness! Seek Allah\'s mercy tonight.'
  }
];

// Helper function to get Ramadan start date for a given year
export const getRamadanStartDate = (year: number): Date => {
  // This is approximate - in a real app, you'd use a proper Islamic calendar API
  // For now, using approximate dates for demonstration
  const ramadanDates: Record<number, { month: number; day: number }> = {
    2025: { month: 2, day: 28 }, // Feb 28, 2025
    2026: { month: 2, day: 17 }, // Feb 17, 2026
    2027: { month: 2, day: 7 },  // Feb 7, 2027
    2028: { month: 1, day: 27 }, // Jan 27, 2028
    2029: { month: 1, day: 16 }, // Jan 16, 2029
    2030: { month: 1, day: 6 },  // Jan 6, 2030
  };
  
  const date = ramadanDates[year] || { month: 2, day: 28 };
  return new Date(year, date.month - 1, date.day);
};

// Helper function to check if a date is within Ramadan countdown period
export const isRamadanCountdownPeriod = (date: Date): boolean => {
  const currentYear = date.getFullYear();
  const ramadanStart = getRamadanStartDate(currentYear);
  const thirtyDaysBefore = new Date(ramadanStart);
  thirtyDaysBefore.setDate(ramadanStart.getDate() - 30);
  
  return date >= thirtyDaysBefore && date < ramadanStart;
};

// Helper function to get days until Ramadan
export const getDaysUntilRamadan = (date: Date): number => {
  const currentYear = date.getFullYear();
  const ramadanStart = getRamadanStartDate(currentYear);
  
  // If Ramadan has passed this year, check next year
  if (date > ramadanStart) {
    const nextYearRamadan = getRamadanStartDate(currentYear + 1);
    const diffTime = nextYearRamadan.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  const diffTime = ramadanStart.getTime() - date.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
