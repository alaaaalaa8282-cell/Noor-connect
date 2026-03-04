// Enhanced book cover generation system with beautiful Islamic-themed designs
export type BookCategory = 
  | 'Quran & Tafsir' 
  | 'Hadith' 
  | 'Fiqh' 
  | 'Aqeedah' 
  | 'Seerah' 
  | 'Biography' 
  | 'Dua & Dhikr' 
  | 'Family & Women' 
  | 'History' 
  | 'Knowledge' 
  | 'General';

export interface CoverTheme {
  gradient: string;
  pattern: string;
  icon: string;
  accentColor: string;
  textColor: string;
  decoration: 'geometric' | 'arabesque' | 'minimal' | 'ornate';
}

export const CATEGORY_THEMES: Record<BookCategory, CoverTheme> = {
  'Quran & Tafsir': {
    gradient: 'from-emerald-800 via-teal-700 to-emerald-900',
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30 Z' fill='none' stroke='rgba(255,255,255,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '📖',
    accentColor: '#10b981',
    textColor: '#ffffff',
    decoration: 'geometric'
  },
  'Hadith': {
    gradient: 'from-amber-700 via-orange-600 to-amber-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='15' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '📜',
    accentColor: '#f59e0b',
    textColor: '#ffffff',
    decoration: 'ornate'
  },
  'Fiqh': {
    gradient: 'from-blue-800 via-indigo-700 to-blue-900',
    pattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='10' width='30' height='30' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '⚖️',
    accentColor: '#3b82f6',
    textColor: '#ffffff',
    decoration: 'geometric'
  },
  'Aqeedah': {
    gradient: 'from-violet-800 via-purple-700 to-violet-900',
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L50 30 L30 50 L10 30 Z' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '🕌',
    accentColor: '#8b5cf6',
    textColor: '#ffffff',
    decoration: 'arabesque'
  },
  'Seerah': {
    gradient: 'from-rose-700 via-pink-600 to-rose-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='45' height='45' viewBox='0 0 45 45' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='22.5' cy='22.5' r='12' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '🌙',
    accentColor: '#f43f5e',
    textColor: '#ffffff',
    decoration: 'ornate'
  },
  'Biography': {
    gradient: 'from-orange-700 via-amber-600 to-orange-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5 L35 20 L20 35 L5 20 Z' fill='none' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '👤',
    accentColor: '#f97316',
    textColor: '#ffffff',
    decoration: 'minimal'
  },
  'Dua & Dhikr': {
    gradient: 'from-teal-700 via-cyan-600 to-teal-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='18' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '🤲',
    accentColor: '#14b8a6',
    textColor: '#ffffff',
    decoration: 'arabesque'
  },
  'Family & Women': {
    gradient: 'from-pink-700 via-rose-600 to-pink-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='45' height='45' viewBox='0 0 45 45' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='15' y='15' width='15' height='15' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '🏠',
    accentColor: '#ec4899',
    textColor: '#ffffff',
    decoration: 'geometric'
  },
  'History': {
    gradient: 'from-stone-700 via-stone-600 to-stone-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 30 Q30 10 50 30 Q30 50 10 30' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '🏛️',
    accentColor: '#78716c',
    textColor: '#ffffff',
    decoration: 'ornate'
  },
  'Knowledge': {
    gradient: 'from-indigo-800 via-blue-700 to-indigo-900',
    pattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='20' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '🎓',
    accentColor: '#6366f1',
    textColor: '#ffffff',
    decoration: 'minimal'
  },
  'General': {
    gradient: 'from-slate-700 via-slate-600 to-slate-800',
    pattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='5' y='5' width='30' height='30' rx='5' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
    icon: '📚',
    accentColor: '#64748b',
    textColor: '#ffffff',
    decoration: 'minimal'
  }
};

// Keywords for category detection
const CATEGORY_KEYWORDS: Record<BookCategory, string[]> = {
  'Quran & Tafsir': ['quran', 'quranic', 'tafsir', 'surah', 'kahf', 'yusuf', 'etiquette with the quran', 'tafseer'],
  'Hadith': ['hadith', 'sunnah', 'sahaba', 'nawawi', 'bukhari', 'riyadh', 'adab al-mufrad', 'fabricated', 'muwatta'],
  'Fiqh': ['fiqh', 'prayer', 'hajj', 'wudho', 'salah', 'funeral', 'marriage', 'financial', 'congregational', 'fasting', 'eid', 'worship', 'zakah', 'zakat'],
  'Aqeedah': ['tawheed', 'aqeedah', 'creed', 'shirk', 'belief', 'names of allah', 'predestination', 'divine will', 'nullifiers', 'fundamental principles'],
  'Seerah': ['prophet', 'messenger', 'seerah', 'sealed nectar', 'muhammad', 'biography of the prophet'],
  'Biography': ['biography', 'biographies', 'ali ibn', 'umar ', 'abu bakr', 'caliphs', 'companions', 'commanders', 'hasan ibn', 'abdullah'],
  'Dua & Dhikr': ['dua', 'dhikr', 'supplication', 'invocation', 'fortress', 'weapon of the believer'],
  'Family & Women': ['women', 'family', 'child', 'children', 'marriage', 'marital', 'parent', 'youth', 'garment', 'home', 'hijab', 'wife', 'husband'],
  'History': ['history', 'conquests', 'atlas', 'early days', 'ottoman', 'caliphate', 'war', 'muslim lands'],
  'Knowledge': ['knowledge', 'education', 'learning', 'scholar', 'advice', 'seeker', 'ilm', 'lessons', 'student'],
  'General': []
};

export function detectCategory(title: string): BookCategory {
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'General') continue;
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      return category as BookCategory;
    }
  }
  return 'General';
}

// Generate decorative elements based on decoration type
export function getDecorationElements(decoration: CoverTheme['decoration']) {
  switch (decoration) {
    case 'geometric':
      return {
        corner: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L30 0 L0 30 Z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
        border: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)'
      };
    case 'arabesque':
      return {
        corner: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='0' cy='0' r='40' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/%3E%3C/svg%3E")`,
        border: 'ellipse(90% 95% at 50% 50%)'
      };
    case 'ornate':
      return {
        corner: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 Q50 0 50 50 Q0 50 0 0' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`,
        border: 'circle(95% at 50% 40%)'
      };
    default:
      return {
        corner: '',
        border: 'none'
      };
  }
}

// Extract author from title if possible
export function extractAuthor(title: string): string | null {
  const byPatterns = [
    /by\s+([^,]+)/i,
    /-\s*([^,]+)$/i,
    /\(([^)]+)\)$/,
  ];
  
  for (const pattern of byPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Check for common Islamic scholars
  const scholars = ['Ibn', 'Imam', 'Shaykh', 'Dr.', 'Al-', 'Abu'];
  for (const scholar of scholars) {
    if (title.includes(scholar)) {
      const parts = title.split(/[\-\–]/);
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }
  }
  
  return null;
}

// Generate a subtitle/description based on title
export function generateSubtitle(title: string, category: BookCategory): string {
  const categorySubtitles: Record<BookCategory, string[]> = {
    'Quran & Tafsir': ['Divine guidance for all of humanity', 'Explanation of Quranic verses', 'Understanding Allah\'s words'],
    'Hadith': ['Authentic sayings of the Prophet', 'Sunnah and traditions', 'Prophetic guidance'],
    'Fiqh': ['Islamic jurisprudence', 'Rules and rulings', 'Practical Islamic law'],
    'Aqeedah': ['Islamic beliefs', 'Correct faith', 'Understanding Tawheed'],
    'Seerah': ['Life of the Prophet Muhammad', 'Prophetic biography', 'The best of creation'],
    'Biography': ['Life story', 'Inspiring journey', 'Noble character'],
    'Dua & Dhikr': ['Supplications and remembrances', 'Calling upon Allah', 'Heartfelt prayers'],
    'Family & Women': ['Family guidance', 'Islamic home', 'Righteous relationships'],
    'History': ['Islamic history', 'Glorious past', 'Lessons from history'],
    'Knowledge': ['Seeking beneficial knowledge', 'Path of the scholars', 'Islamic education'],
    'General': ['Islamic literature', 'Beneficial reading', 'Spiritual growth']
  };
  
  const subtitles = categorySubtitles[category];
  // Use hash of title to consistently pick same subtitle for same book
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return subtitles[hash % subtitles.length];
}

// Clean title for display
export function cleanTitle(title: string): string {
  return title
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+\s+/, '') // Remove leading numbers
    .replace(/\s*-\s*[^-]+$/i, '') // Remove trailing author dash
    .trim();
}
