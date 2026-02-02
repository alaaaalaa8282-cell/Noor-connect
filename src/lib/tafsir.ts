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
}

// Available Tafsir editions
export const TAFSIR_EDITIONS: TafsirEdition[] = [
    { id: "en-tafisr-ibn-kathir", name: "Ibn Kathir", language: "English" },
    { id: "en-al-jalalayn", name: "Al-Jalalayn", language: "English" },
    { id: "ar-tafseer-al-saddi", name: "Al-Saddi", language: "Arabic" },
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
