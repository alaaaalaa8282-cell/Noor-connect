export interface Dua {
  id: string;
  category: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference?: string;
}

export const duasData: Dua[] = [
  // Morning Duas
  {
    id: "morning_1",
    category: "Morning",
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ",
    transliteration: "Asbahna wa asbahal-mulku lillah walhamdulillah",
    translation: "We have entered a new day and with it all dominion is Allah's, and praise is to Allah",
    reference: "Muslim"
  },
  {
    id: "morning_2",
    category: "Morning",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur",
    translation: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection",
    reference: "Abu Dawud, Tirmidhi"
  },
  {
    id: "morning_3",
    category: "Morning",
    arabic: "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ وَعَلَى كَلِمَةِ الْإِخْلَاصِ",
    transliteration: "Asbahna 'ala fitratil-Islam wa 'ala kalimatil-ikhlas",
    translation: "We rise upon the fitrah of Islam, and upon the word of sincerity",
    reference: "Ahmad"
  },

  // Evening Duas
  {
    id: "evening_1",
    category: "Evening",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
    transliteration: "Amsayna wa amsal-mulku lillah",
    translation: "We have entered the evening and with it all dominion is Allah's",
    reference: "Muslim"
  },
  {
    id: "evening_2",
    category: "Evening",
    arabic: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ",
    transliteration: "Allahumma inni amsaytu ushhiduka wa ushhidu hamalata 'arshik",
    translation: "O Allah, I have entered the evening and call You to witness and call the bearers of Your Throne to witness",
    reference: "Abu Dawud"
  },
  {
    id: "evening_3",
    category: "Evening",
    arabic: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ فَمِنْكَ وَحْدَكَ",
    transliteration: "Allahumma ma amsa bi min ni'matin fa-minka wahdak",
    translation: "O Allah, whatever blessing has come to me this evening is from You alone",
    reference: "Abu Dawud"
  },

  // Travel Duas
  {
    id: "travel_1",
    category: "Travel",
    arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
    transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin",
    translation: "Glory be to Him Who has brought this under our control, and we could never have done it by ourselves",
    reference: "Tirmidhi"
  },
  {
    id: "travel_2",
    category: "Travel",
    arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى",
    transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa",
    translation: "O Allah, we ask You for righteousness and piety on this journey of ours",
    reference: "Tirmidhi"
  },
  {
    id: "travel_3",
    category: "Travel",
    arabic: "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ",
    transliteration: "Allahumma antas-sahibu fis-safari wal-khalifatu fil-ahli",
    translation: "O Allah, You are the Companion on the journey and the Guardian of the family",
    reference: "Muslim"
  },

  // Eating & Drinking
  {
    id: "eating_1",
    category: "Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah",
    reference: "Bukhari, Muslim"
  },
  {
    id: "eating_2",
    category: "Eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alhamdulillahil-ladhi at'amana wa saqana wa ja'alana muslimin",
    translation: "Praise be to Allah Who has given us food and drink and made us Muslims",
    reference: "Abu Dawud, Tirmidhi"
  },

  // Sleeping
  {
    id: "sleeping_1",
    category: "Sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    translation: "In Your name O Allah, I die and I live",
    reference: "Bukhari"
  },
  {
    id: "sleeping_2",
    category: "Sleeping",
    arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
    transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
    translation: "O Allah, protect me from Your punishment on the Day You resurrect Your servants",
    reference: "Abu Dawud"
  },

  // Illness & Healing
  {
    id: "illness_1",
    category: "Illness",
    arabic: "أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ وَاشْفِ أَنْتَ الشَّافِي",
    transliteration: "Adh-hibil-ba'sa rabban-nas washfi antash-shafi",
    translation: "Remove the hardship, O Lord of mankind, and heal, You are the Healer",
    reference: "Bukhari, Muslim"
  },
  {
    id: "illness_2",
    category: "Illness",
    arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ",
    transliteration: "Allahumma rabban-nasi adhhibil-ba's",
    translation: "O Allah, Lord of mankind, remove the suffering",
    reference: "Bukhari"
  },

  // Anxiety & Distress
  {
    id: "distress_1",
    category: "Distress",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ",
    transliteration: "La ilaha illallahul-'Adhimul-Halim",
    translation: "There is no god but Allah, the Magnificent, the Forbearing",
    reference: "Bukhari, Muslim"
  },
  {
    id: "distress_2",
    category: "Distress",
    arabic: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    transliteration: "Allahumma rahmataka arju fala takilni ila nafsi tarfata 'ayn",
    translation: "O Allah, I hope for Your mercy, so do not leave me to myself even for the blink of an eye",
    reference: "Abu Dawud"
  },

  // Gratitude
  {
    id: "gratitude_1",
    category: "Gratitude",
    arabic: "الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ",
    transliteration: "Alhamdulillahi hamdan kathiran tayyiban mubarakan fih",
    translation: "All praise is due to Allah, abundant good and blessed praise",
    reference: "Bukhari"
  },
  {
    id: "gratitude_2",
    category: "Gratitude",
    arabic: "اللَّهُمَّ لَكَ الْحَمْدُ كُلُّهُ",
    transliteration: "Allahumma lakal-hamdu kulluh",
    translation: "O Allah, all praise is due to You",
    reference: "Muslim"
  },

  // Forgiveness
  {
    id: "forgiveness_1",
    category: "Forgiveness",
    arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    transliteration: "Rabbighfir li wa tub 'alayya innaka antat-tawwabur-rahim",
    translation: "My Lord, forgive me and accept my repentance, for You are the Oft-Returning, the Most Merciful",
    reference: "Abu Dawud, Tirmidhi"
  },
  {
    id: "forgiveness_2",
    category: "Forgiveness",
    arabic: "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullahallathi la ilaha illa huwal-Hayyul-Qayyumu wa atubu ilayh",
    translation: "I seek forgiveness from Allah, besides Whom there is no god, the Ever-Living, the Sustainer, and I repent to Him",
    reference: "Abu Dawud, Tirmidhi"
  },

  // Protection
  {
    id: "protection_1",
    category: "Protection",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimatillahit-tammati min sharri ma khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created",
    reference: "Muslim"
  },
  {
    id: "protection_2",
    category: "Protection",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ",
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'",
    translation: "In the name of Allah, with Whose name nothing can harm on earth or in heaven",
    reference: "Abu Dawud, Tirmidhi"
  },

  // Rain
  {
    id: "rain_1",
    category: "Weather",
    arabic: "اللَّهُمَّ صَيِّبًا نَافِعًا",
    transliteration: "Allahumma sayyiban nafi'a",
    translation: "O Allah, (bring) beneficial rain",
    reference: "Bukhari"
  },

  // After Prayer
  {
    id: "after_prayer_1",
    category: "After Prayer",
    arabic: "أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah, Astaghfirullah, Astaghfirullah",
    translation: "I seek Allah's forgiveness (said three times)",
    reference: "Muslim"
  },
  {
    id: "after_prayer_2",
    category: "After Prayer",
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration: "Allahumma antas-salamu wa minkas-salamu tabarakta ya dhal-jalali wal-ikram",
    translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of Majesty and Honor",
    reference: "Muslim"
  },

  // Before Entering Home
  {
    id: "home_1",
    category: "Home",
    arabic: "بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Bismillahi walajna wa bismillahi kharajna wa 'alallahi rabbina tawakkalna",
    translation: "In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely",
    reference: "Abu Dawud"
  },

  // Leaving Home
  {
    id: "leaving_home_1",
    category: "Home",
    arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillah, tawakkaltu 'alallah, la hawla wa la quwwata illa billah",
    translation: "In the name of Allah, I place my trust in Allah, there is no might nor power except with Allah",
    reference: "Abu Dawud, Tirmidhi"
  },

  // Entering Mosque
  {
    id: "mosque_1",
    category: "Mosque",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahummaftah li abwaba rahmatik",
    translation: "O Allah, open for me the doors of Your mercy",
    reference: "Muslim"
  },

  // Leaving Mosque
  {
    id: "mosque_2",
    category: "Mosque",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allahumma inni as'aluka min fadlik",
    translation: "O Allah, I ask You from Your bounty",
    reference: "Muslim"
  },

  // Entering Bathroom
  {
    id: "bathroom_1",
    category: "Daily",
    arabic: "بِسْمِ اللَّهِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    transliteration: "Bismillah, Allahumma inni a'udhu bika minal-khubthi wal-khaba'ith",
    translation: "In the name of Allah. O Allah, I seek refuge in You from male and female evil spirits",
    reference: "Bukhari, Muslim"
  },

  // Waking Up
  {
    id: "waking_1",
    category: "Daily",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdulillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    translation: "Praise is to Allah Who gave us life after having taken it from us, and unto Him is the resurrection",
    reference: "Bukhari"
  },

  // Wearing Clothes
  {
    id: "clothes_1",
    category: "Daily",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration: "Alhamdulillahil-ladhi kasani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    translation: "Praise is to Allah Who has clothed me with this and provided it for me without any might or power from myself",
    reference: "Abu Dawud, Tirmidhi"
  },

  // Looking in Mirror
  {
    id: "mirror_1",
    category: "Daily",
    arabic: "اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي",
    transliteration: "Allahumma kama hassanta khalqi fa-hassin khuluqi",
    translation: "O Allah, as You have made my external features beautiful, make my character beautiful as well",
    reference: "Ahmad"
  },

  // Friday
  {
    id: "friday_1",
    category: "Special Days",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad",
    translation: "O Allah, send prayers upon Muhammad and the family of Muhammad",
    reference: "Bukhari, Muslim"
  },

  // Knowledge
  {
    id: "knowledge_1",
    category: "Knowledge",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    transliteration: "Rabbi zidni 'ilma",
    translation: "My Lord, increase me in knowledge",
    reference: "Quran 20:114"
  },
  {
    id: "knowledge_2",
    category: "Knowledge",
    arabic: "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي",
    transliteration: "Allahumma infa'ni bima 'allamtani wa 'allimni ma yanfa'uni",
    translation: "O Allah, benefit me with what You have taught me, and teach me what will benefit me",
    reference: "Ibn Majah"
  },

  // Patience
  {
    id: "patience_1",
    category: "Character",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ",
    transliteration: "Allahumma inni a'udhu bika minal-'ajzi wal-kasal",
    translation: "O Allah, I seek refuge in You from incapacity and laziness",
    reference: "Bukhari, Muslim"
  },

  // Marriage
  {
    id: "marriage_1",
    category: "Marriage",
    arabic: "بَارَكَ اللَّهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
    translation: "May Allah bless you, and shower His blessings upon you, and join you together in goodness",
    transliteration: "Barakallahu laka wa baraka 'alayka wa jama'a baynakuma fi khayr",
    reference: "Abu Dawud, Tirmidhi"
  },

  // Children
  {
    id: "children_1",
    category: "Family",
    arabic: "رَبِّ هَبْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً",
    transliteration: "Rabbi hab li min ladunka dhurriyyatan tayyibah",
    translation: "My Lord, grant me from Yourself a good offspring",
    reference: "Quran 3:38"
  },

  // Debt
  {
    id: "debt_1",
    category: "Financial",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allahummakfini bihalalika 'an haramika wa aghnini bifadlika 'amman siwak",
    translation: "O Allah, make what is lawful enough for me, as opposed to what is unlawful, and spare me by Your grace, of need of others",
    reference: "Tirmidhi"
  },

  // Anger
  {
    id: "anger_1",
    category: "Character",
    arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    transliteration: "A'udhu billahi minash-shaytanir-rajim",
    translation: "I seek refuge with Allah from Satan, the accursed",
    reference: "Bukhari, Muslim"
  },

  // Paradise
  {
    id: "paradise_1",
    category: "Afterlife",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
    transliteration: "Allahumma inni as'alukal-jannata wa a'udhu bika minan-nar",
    translation: "O Allah, I ask You for Paradise and seek refuge in You from the Fire",
    reference: "Abu Dawud"
  }
];

export const duaCategories = [
  "All",
  "Morning",
  "Evening",
  "Travel",
  "Eating",
  "Sleeping",
  "Illness",
  "Distress",
  "Gratitude",
  "Forgiveness",
  "Protection",
  "Weather",
  "After Prayer",
  "Home",
  "Mosque",
  "Daily",
  "Special Days",
  "Knowledge",
  "Character",
  "Marriage",
  "Family",
  "Financial",
  "Afterlife"
];
