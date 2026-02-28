/**
 * Expanded Islamic Content for Diverse Notifications
 * Includes hadith, Quranic verses, dhikr, dua, and Islamic knowledge
 */

export interface IslamicContent {
  id: string;
  type: 'hadith' | 'quran' | 'dhikr' | 'dua' | 'knowledge' | 'motivation';
  text: string;
  translation: string;
  source?: string;
  category?: string;
}

export const expandedHadithCollection: IslamicContent[] = [
  {
    id: 'hadith-1',
    type: 'hadith',
    text: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    translation: 'Actions are judged by intentions',
    source: 'Sahih Bukhari 1',
    category: 'intentions'
  },
  {
    id: 'hadith-2',
    type: 'hadith',
    text: 'الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ',
    translation: 'A kind word is charity',
    source: 'Sahih Bukhari 2989',
    category: 'kindness'
  },
  {
    id: 'hadith-3',
    type: 'hadith',
    text: 'الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا',
    translation: 'The believer to another believer is like a building, each part strengthening the other',
    source: 'Sahih Bukhari 481',
    category: 'brotherhood'
  },
  {
    id: 'hadith-4',
    type: 'hadith',
    text: 'اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ',
    translation: 'Save yourself from Fire even with half a date',
    source: 'Sahih Bukhari 1417',
    category: 'charity'
  },
  {
    id: 'hadith-5',
    type: 'hadith',
    text: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ',
    translation: 'The merciful will be shown mercy by the Most Merciful',
    source: 'Sunan Abu Dawud 4941',
    category: 'mercy'
  },
  {
    id: 'hadith-6',
    type: 'hadith',
    text: 'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
    translation: 'Whoever fasts Ramadan with faith and seeking reward, his past sins will be forgiven',
    source: 'Sahih Bukhari 38',
    category: 'ramadan'
  },
  {
    id: 'hadith-7',
    type: 'hadith',
    text: 'أَفْشُوا السَّلاَمَ بَيْنَكُمْ',
    translation: 'Spread peace among yourselves',
    source: 'Sahih Muslim 54',
    category: 'peace'
  },
  {
    id: 'hadith-8',
    type: 'hadith',
    text: 'الصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ كَمَا يُطْفِئُ الْمَاءُ النَّارَ',
    translation: 'Charity extinguishes sin as water extinguishes fire',
    source: 'Sunan al-Tirmidhi 2616',
    category: 'charity'
  },
  {
    id: 'hadith-9',
    type: 'hadith',
    text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    translation: 'The best among you are those who learn Quran and teach it',
    source: 'Sahih Bukhari 5027',
    category: 'quran'
  },
  {
    id: 'hadith-10',
    type: 'hadith',
    text: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ',
    translation: 'Your smile in your brother\'s face is charity',
    source: 'Sunan al-Tirmidhi 1956',
    category: 'kindness'
  }
];

export const quranicVerses: IslamicContent[] = [
  {
    id: 'quran-1',
    type: 'quran',
    text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship comes ease',
    source: 'Quran 94:6',
    category: 'patience'
  },
  {
    id: 'quran-2',
    type: 'quran',
    text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    translation: 'And say, "My Lord, increase me in knowledge"',
    source: 'Quran 20:114',
    category: 'knowledge'
  },
  {
    id: 'quran-3',
    type: 'quran',
    text: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّى يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
    translation: 'Indeed, Allah will not change the condition of a people until they change what is in themselves',
    source: 'Quran 13:11',
    category: 'self-improvement'
  },
  {
    id: 'quran-4',
    type: 'quran',
    text: 'وَمَا تَقَدَّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ',
    translation: 'And whatever good you put forward for yourselves - you will find it with Allah',
    source: 'Quran 2:110',
    category: 'good-deeds'
  },
  {
    id: 'quran-5',
    type: 'quran',
    text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا',
    translation: 'O you who have believed, persevere and endure',
    source: 'Quran 3:200',
    category: 'patience'
  },
  {
    id: 'quran-6',
    type: 'quran',
    text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونَ',
    translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me',
    source: 'Quran 2:152',
    category: 'gratitude'
  },
  {
    id: 'quran-7',
    type: 'quran',
    text: 'وَلَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'And do not despair of the mercy of Allah',
    source: 'Quran 39:53',
    category: 'hope'
  },
  {
    id: 'quran-8',
    type: 'quran',
    text: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'Indeed, Allah is with the patient',
    source: 'Quran 2:153',
    category: 'patience'
  }
];

export const dhikrReminders: IslamicContent[] = [
  {
    id: 'dhikr-1',
    type: 'dhikr',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    translation: 'Glory be to Allah and praise Him',
    source: 'Morning/Evening Adhkar',
    category: 'tasbih'
  },
  {
    id: 'dhikr-2',
    type: 'dhikr',
    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    translation: 'There is no deity except Allah alone, with no partner',
    source: 'Morning/Evening Adhkar',
    category: 'tawhid'
  },
  {
    id: 'dhikr-3',
    type: 'dhikr',
    text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
    translation: 'O Allah, I seek refuge in You from anxiety and grief',
    source: 'Daily Dua',
    category: 'protection'
  },
  {
    id: 'dhikr-4',
    type: 'dhikr',
    text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ',
    translation: 'I seek forgiveness from Allah, the Mighty',
    source: 'Daily Dhikr',
    category: 'forgiveness'
  },
  {
    id: 'dhikr-5',
    type: 'dhikr',
    text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    translation: 'All praise is for Allah, Lord of the worlds',
    source: 'Daily Dhikr',
    category: 'gratitude'
  }
];

export const dailyDuas: IslamicContent[] = [
  {
    id: 'dua-1',
    type: 'dua',
    text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    translation: 'Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire',
    source: 'Quran 2:201',
    category: 'comprehensive'
  },
  {
    id: 'dua-2',
    type: 'dua',
    text: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ',
    translation: 'O Allah, guide me among those You have guided',
    source: 'Daily Dua',
    category: 'guidance'
  },
  {
    id: 'dua-3',
    type: 'dua',
    text: 'اللَّهُمَّ بَارِكْ لَنَا فِي رَمَضَانَ',
    translation: 'O Allah, bless us in Ramadan',
    source: 'Ramadan Dua',
    category: 'ramadan'
  },
  {
    id: 'dua-4',
    type: 'dua',
    text: 'رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا',
    translation: 'My Lord, increase me in knowledge and grant me understanding',
    source: 'Student Dua',
    category: 'knowledge'
  }
];

export const islamicKnowledge: IslamicContent[] = [
  {
    id: 'knowledge-1',
    type: 'knowledge',
    text: 'Did you know? The Prophet Muhammad (peace be upon him) said: "The best of you are those who learn the Quran and teach it."',
    translation: 'Seek knowledge and share it with others for the sake of Allah',
    category: 'quran-importance'
  },
  {
    id: 'knowledge-2',
    type: 'knowledge',
    text: 'Did you know? Laylat al-Qadr (Night of Power) is better than 1000 months of worship.',
    translation: 'The last 10 nights of Ramadan contain this special night of immense blessings',
    category: 'ramadan'
  },
  {
    id: 'knowledge-3',
    type: 'knowledge',
    text: 'Did you know? The first revelation was received on Monday in the cave of Hira.',
    translation: 'Knowledge of Islamic history strengthens our connection to our faith',
    category: 'history'
  },
  {
    id: 'knowledge-4',
    type: 'knowledge',
    text: 'Did you know? Fasting has spiritual benefits including increased patience, gratitude, and closeness to Allah.',
    translation: 'Beyond physical hunger, fasting purifies the soul and builds character',
    category: 'fasting'
  },
  {
    id: 'knowledge-5',
    type: 'knowledge',
    text: 'Did you know? The five daily prayers are a direct conversation with Allah.',
    translation: 'Each prayer is an opportunity to disconnect from worldly matters and connect with the Divine',
    category: 'prayer'
  }
];

export const motivationalMessages: IslamicContent[] = [
  {
    id: 'motivation-1',
    type: 'motivation',
    text: 'Every day is a new opportunity to get closer to Allah.',
    translation: 'Start your day with gratitude and end it with reflection',
    category: 'daily'
  },
  {
    id: 'motivation-2',
    type: 'motivation',
    text: 'Your small consistent good deeds are beloved to Allah.',
    translation: 'The most beloved deeds to Allah are those done consistently, even if small',
    category: 'consistency'
  },
  {
    id: 'motivation-3',
    type: 'motivation',
    text: 'Difficulties are temporary, but the reward for patience is eternal.',
    translation: 'Trust Allah\'s plan and keep moving forward with faith',
    category: 'patience'
  },
  {
    id: 'motivation-4',
    type: 'motivation',
    text: 'Your sins are not greater than Allah\'s mercy.',
    translation: 'Never lose hope in the mercy of Allah, for He is Most Forgiving',
    category: 'mercy'
  },
  {
    id: 'motivation-5',
    type: 'motivation',
    text: 'The doors of Paradise are open for those who strive in the way of Allah.',
    translation: 'Your efforts for Allah\'s sake are never wasted',
    category: 'jannah'
  }
];

// Combined content pool for random selection
export const allIslamicContent = [
  ...expandedHadithCollection,
  ...quranicVerses,
  ...dhikrReminders,
  ...dailyDuas,
  ...islamicKnowledge,
  ...motivationalMessages
];

// Helper functions
export function getRandomContent(type?: string, category?: string): IslamicContent {
  let filteredContent = allIslamicContent;
  
  if (type) {
    filteredContent = filteredContent.filter(content => content.type === type);
  }
  
  if (category) {
    filteredContent = filteredContent.filter(content => content.category === category);
  }
  
  if (filteredContent.length === 0) {
    filteredContent = allIslamicContent;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredContent.length);
  return filteredContent[randomIndex];
}

export function getContentByType(type: string): IslamicContent[] {
  return allIslamicContent.filter(content => content.type === type);
}

export function getContentByCategory(category: string): IslamicContent[] {
  return allIslamicContent.filter(content => content.category === category);
}
