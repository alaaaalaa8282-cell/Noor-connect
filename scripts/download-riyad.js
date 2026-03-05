import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data/hadith-collections/riyadussalihin');

async function downloadRiyadUsSalihin() {
    console.log('Downloading Riyad us-Salihin by chapter...');
    const allHadiths = [];

    // Riyad us-Salihin has 19 books
    for (let i = 1; i <= 19; i++) {
        const url = `https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_chapter/other_books/riyad_assalihin/${i}.json`;
        console.log(`Fetching Book ${i}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();

            const bookNameEn = data.metadata?.english?.introduction || `Book ${i}`;
            const bookNameAr = data.metadata?.arabic?.introduction || '';

            const hadithsArray = data.hadiths || [];

            const formattedHadiths = hadithsArray.map((h) => {
                return {
                    id: `riyad_${h.id}`,
                    collection: 'riyadussalihin',
                    bookNumber: String(i),
                    bookName: bookNameEn,
                    chapterNumber: String(h.chapterId || i),
                    chapterName: bookNameEn,
                    hadithNumber: String(h.idInBook || h.id),
                    arabic: h.arabic || '',
                    englishTranslation: h.english?.text || h.text || '',
                    narrator: h.english?.narrator || h.narrator || '',
                    grade: 'Sahih/Hasan',
                    category: 'hadith',
                    tags: []
                };
            });

            allHadiths.push(...formattedHadiths);

        } catch (e) {
            console.error(`Failed to fetch book ${i}:`, e);
        }
    }

    if (allHadiths.length > 0) {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        fs.writeFileSync(
            path.join(DATA_DIR, 'hadiths.json'),
            JSON.stringify(allHadiths, null, 2),
            'utf-8'
        );

        console.log(`Successfully saved ${allHadiths.length} hadiths to ${DATA_DIR}/hadiths.json`);
    } else {
        console.error('No hadiths were downloaded.');
    }
}

downloadRiyadUsSalihin();
