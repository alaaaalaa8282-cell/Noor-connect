// Tafsir API utility for fetching Quranic commentary
// API Source: https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/

export interface TafsirResponse {
    ayah: number;
    surah: number;
    text: string;
}

export interface TafsirEdition {
    id: string;
    name: string;
    language: string;
    author?: string; // Optional author field for additional context
}

// Available Tafsir editions from spa5k API
export const TAFSIR_EDITIONS: TafsirEdition[] = [
    // English Tafsirs
    { id: "en-tafisr-ibn-kathir", name: "Tafsir Ibn Kathir (abridged)", language: "English", author: "Hafiz Ibn Kathir" },
    { id: "en-al-jalalayn", name: "Al-Jalalayn", language: "English", author: "Al-Jalalayn" },
    { id: "en-al-qushairi-tafsir", name: "Al Qushairi Tafsir", language: "English", author: "Al Qushairi" },
    { id: "en-tafsir-maarif-ul-quran", name: "Maarif-ul-Quran", language: "English", author: "Mufti Muhammad Shafi" },
    { id: "en-kashani-tafsir", name: "Kashani Tafsir", language: "English", author: "Kashani" },
    { id: "en-tafsir-al-tustari", name: "Tafsir al-Tustari", language: "English", author: "Tafsir al-Tustari" },
    { id: "en-asbab-al-nuzul-by-al-wahidi", name: "Asbab Al-Nuzul by Al-Wahidi", language: "English", author: "Al-Wahidi" },
    { id: "en-tafsir-ibn-abbas", name: "Tanwîr al-Miqbâs min Tafsîr Ibn 'Abbâs", language: "English", author: "Ibn 'Abbâs" },
    { id: "en-kashf-al-asrar-tafsir", name: "Kashf Al-Asrar Tafsir", language: "English", author: "Kashf Al-Asrar" },
    { id: "en-tazkirul-quran", name: "Tazkirul Quran", language: "English", author: "Maulana Wahid Uddin Khan" },
    
    // Arabic Tafsirs
    { id: "ar-tafsir-ibn-kathir", name: "Tafsir Ibn Kathir", language: "Arabic", author: "Hafiz Ibn Kathir" },
    { id: "ar-tafseer-al-saddi", name: "Tafseer Al Saddi", language: "Arabic", author: "Saddi" },
    { id: "ar-tafsir-al-baghawi", name: "Tafseer Al-Baghawi", language: "Arabic", author: "Baghawy" },
    { id: "ar-tafseer-tanwir-al-miqbas", name: "Tafseer Tanwir al-Miqbas", language: "Arabic", author: "Tanweer" },
    { id: "ar-tafsir-al-wasit", name: "Tafsir Al Wasit", language: "Arabic", author: "Waseet" },
    { id: "ar-tafsir-al-tabari", name: "Tafsir al-Tabari", language: "Arabic", author: "Tabari" },
    { id: "ar-tafsir-muyassar", name: "Tafsir Muyassar", language: "Arabic", author: "المیسر" },
    { id: "ar-tafseer-al-qurtubi", name: "Tafseer Al Qurtubi", language: "Arabic", author: "Qurtubi" },
    
    // Bengali Tafsirs
    { id: "bn-tafisr-fathul-majid", name: "Tafsir Fathul Majid", language: "Bengali", author: "AbdulRahman Bin Hasan Al-Alshaikh" },
    { id: "bn-tafseer-ibn-e-kaseer", name: "Tafseer ibn Kathir", language: "Bengali", author: "Tawheed Publication" },
    { id: "bn-tafsir-ahsanul-bayaan", name: "Tafsir Ahsanul Bayaan", language: "Bengali", author: "Bayaan Foundation" },
    { id: "bn-tafsir-abu-bakr-zakaria", name: "Tafsir Abu Bakr Zakaria", language: "Bengali", author: "King Fahd Quran Printing Complex" },
    
    // Urdu Tafsirs
    { id: "ur-tafseer-ibn-e-kaseer", name: "Tafsir Ibn Kathir", language: "Urdu", author: "Hafiz Ibn Kathir" },
    { id: "ur-tafsir-bayan-ul-quran", name: "Tafsir Bayan ul Quran", language: "Urdu", author: "Dr. Israr Ahmad" },
    { id: "ur-tazkirul-quran", name: "Tazkirul Quran", language: "Urdu", author: "Maulana Wahid Uddin Khan" },
    
    // Russian Tafsirs
    { id: "ru-tafseer-al-saddi", name: "Tafseer Al Saddi", language: "Russian", author: "Saddi" },
    
    // Kurdish Tafsirs
    { id: "kurd-tafsir-rebar", name: "Rebar Kurdish Tafsir", language: "Kurdish", author: "Rebar Kurdish" }
];

const BASE_URL = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

/**
 * Fetches tafsir for a specific ayah
 * @param surah - Surah number (1-114)
 * @param ayah - Ayah number within the surah
 * @param edition - Tafsir edition slug (e.g., "en-tafisr-ibn-kathir")
 * @returns The tafsir response with text, or throws an error
 */
export async function fetchTafsir(
    surah: number,
    ayah: number,
    edition: string
): Promise<TafsirResponse> {
    const url = `${BASE_URL}/${edition}/${surah}/${ayah}.json`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Tafsir not available for this ayah`);
        }
        throw new Error(`Failed to fetch tafsir: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TafsirResponse;
}

/**
 * Fetches complete tafsir for a surah (all ayahs)
 * @param surah - Surah number (1-114)
 * @param edition - Tafsir edition slug
 * @returns Array of tafsir responses for all ayahs in the surah
 */
export async function fetchSurahTafsir(
    surah: number,
    edition: string
): Promise<TafsirResponse[]> {
    const url = `${BASE_URL}/${edition}/${surah}.json`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Tafsir not available for this surah`);
        }
        throw new Error(`Failed to fetch surah tafsir: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TafsirResponse[];
}
