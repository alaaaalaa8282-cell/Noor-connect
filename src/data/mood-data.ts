import { Heart, CloudRain, Sun, Zap, Frown, Smile } from "lucide-react";

export interface MoodContent {
    type: 'surah' | 'ayah' | 'dua';
    reference: string; // e.g., "Surah Ad-Duha" or "2:286"
    text: string;
    surahNumber?: number; // Only for 'surah' type, used for direct playback
    translation?: string;
    arabic?: string;
}

export interface Mood {
    id: string;
    label: string;
    icon: any;
    color: string;
    gradient: string;
    glow: string;
    content: MoodContent[];
}

export const moods: Mood[] = [
    {
        id: "anxious",
        label: "Anxious",
        icon: CloudRain,
        color: "text-blue-500",
        gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
        glow: "shadow-blue-500/20",
        content: [
            {
                type: "surah",
                reference: "Surah Ad-Duha",
                text: "Your Lord has not taken leave of you, [O Muhammad], nor has He detested [you].",
                surahNumber: 93,
                arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ"
            },
            {
                type: "ayah",
                reference: "Quran 13:28",
                text: "Unquestionably, by the remembrance of Allah hearts are assured.",
                arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
            },
            {
                type: "dua",
                reference: "Prophetic Dua",
                text: "O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness.",
                arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ"
            }
        ]
    },
    {
        id: "sad",
        label: "Sad",
        icon: Frown,
        color: "text-indigo-500",
        gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
        glow: "shadow-indigo-500/20",
        content: [
            {
                type: "surah",
                reference: "Surah Ash-Sharh",
                text: "For indeed, with hardship [will be] ease.",
                surahNumber: 94,
                arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا"
            },
            {
                type: "surah",
                reference: "Surah Yusuf",
                text: "Listening to the story of Prophet Yusuf (AS) brings comfort to the grieving heart.",
                surahNumber: 12
            }
        ]
    },
    {
        id: "happy",
        label: "Happy",
        icon: Smile,
        color: "text-amber-500",
        gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
        glow: "shadow-amber-500/20",
        content: [
            {
                type: "surah",
                reference: "Surah Ar-Rahman",
                text: "So which of the favors of your Lord would you deny?",
                surahNumber: 55,
                arabic: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ"
            },
            {
                type: "dua",
                reference: "Dua for Gratitude",
                text: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
                arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ"
            }
        ]
    },
    {
        id: "lost",
        label: "Lost",
        icon: Zap,
        color: "text-purple-500",
        gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
        glow: "shadow-purple-500/20",
        content: [
            {
                type: "ayah",
                reference: "Quran 2:186",
                text: "And when My servants ask you concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.",
                arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ"
            },
            {
                type: "surah",
                reference: "Surah Al-Fatiha",
                text: "Guide us to the straight path.",
                surahNumber: 1,
                arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ"
            }
        ]
    },
    {
        id: "grateful",
        label: "Grateful",
        icon: Heart,
        color: "text-rose-500",
        gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
        glow: "shadow-rose-500/20",
        content: [
            {
                type: "ayah",
                reference: "Quran 14:7",
                text: "If you are grateful, I will surely increase you [in favor].",
                arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ"
            }
        ]
    },
    {
        id: "tired",
        label: "Tired",
        icon: Sun,
        color: "text-orange-500",
        gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
        glow: "shadow-orange-500/20",
        content: [
            {
                type: "ayah",
                reference: "Quran 2:286",
                text: "Allah does not charge a soul except [with that within] its capacity.",
                arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا"
            }
        ]
    }
];
