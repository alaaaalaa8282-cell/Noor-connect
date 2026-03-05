#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'hadith-collections');

// Collections to download with their mappings
const COLLECTIONS = {
  bukhari: { name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري', author: 'Imam Muhammad ibn Ismail al-Bukhari', death: '256 AH / 870 CE' },
  muslim: { name: 'Sahih Muslim', arabic: 'صحيح مسلم', author: 'Imam Muslim ibn al-Hajjaj', death: '261 AH / 875 CE' },
  tirmidhi: { name: 'Sunan al-Tirmidhi', arabic: 'سنن الترمذي', author: 'Imam Abu Isa al-Tirmidhi', death: '279 AH / 892 CE' },
  abudawud: { name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود', author: 'Imam Abu Dawud al-Sijistani', death: '275 AH / 889 CE' },
  nasai: { name: "Sunan al-Nasa'i", arabic: "سنن النسائي", author: "Imam al-Nasa'i", death: '303 AH / 915 CE' },
  ibnmajah: { name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه', author: 'Imam Ibn Majah', death: '273 AH / 887 CE' },
  malik: { name: 'Muwatta Malik', arabic: 'موطأ مالك', author: 'Imam Malik ibn Anas', death: '179 AH / 795 CE' },
  'musnad-ahmad': { name: 'Musnad Ahmad ibn Hanbal', arabic: 'مسند أحمد بن حنبل', author: 'Imam Ahmad ibn Hanbal', death: '241 AH / 855 CE' },
  'riyadussalihin': { name: 'Riyad us-Salihin', arabic: 'رياض الصالحين', author: 'Imam al-Nawawi', death: '676 AH / 1277 CE' },
};

// API sources
const SOURCES = {
  // fawazahmed0 hadith-api - most comprehensive
  fawazahmed0: {
    baseUrl: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',
    editions: {
      bukhari: ['eng-bukhari', 'ara-bukhari'],
      muslim: ['eng-muslim', 'ara-muslim'],
      tirmidhi: ['eng-tirmidhi', 'ara-tirmidhi'],
      abudawud: ['eng-abudawud', 'ara-abudawud'],
      nasai: ['eng-nasai', 'ara-nasai'],
      ibnmajah: ['eng-ibnmajah', 'ara-ibnmajah'],
      malik: ['eng-malik', 'ara-malik'],
    }
  },
  // sunnah.com API (requires scraping or unofficial endpoints)
  sunnah: {
    collections: {
      bukhari: { books: 97, hadiths: 7563 },
      muslim: { books: 43, hadiths: 7563 },
      tirmidhi: { books: 50, hadiths: 3960 },
      abudawud: { books: 43, hadiths: 5274 },
      nasai: { books: 52, hadiths: 5761 },
      ibnmajah: { books: 37, hadiths: 4341 },
    }
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'NoorConnect/1.0' },
        timeout: 30000 
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`   Retry ${i + 1}/${retries} after error: ${error.message}`);
      await sleep(1000 * (i + 1));
    }
  }
}

async function downloadFromFawazahmed0(collection, edition) {
  const url = `${SOURCES.fawazahmed0.baseUrl}/${edition}.json`;
  try {
    console.log(`   Fetching ${edition}...`);
    const data = await fetchWithRetry(url);
    return data;
  } catch (error) {
    console.log(`   Failed to fetch ${edition}: ${error.message}`);
    return null;
  }
}

function transformFawazahmed0Data(data, collection) {
  if (!data || !Array.isArray(data.hadiths)) {
    return { hadiths: [], metadata: {} };
  }

  const hadiths = data.hadiths.map((h, idx) => ({
    id: `${collection}-${h.hadithnumber || idx}`,
    collection: collection,
    bookNumber: h.bookNumber || h.book || '1',
    bookName: h.bookName || `Book ${h.bookNumber || 1}`,
    chapterNumber: h.chapterNumber || h.chapter || '',
    chapterName: h.chapterName || '',
    hadithNumber: h.hadithnumber || (idx + 1).toString(),
    arabic: h.arabic || h.text || '',
    arabicPlain: '',
    englishTranslation: h.english || h.translation || '',
    narrator: h.narrator || '',
    chain: h.chain || '',
    grade: h.grade || '',
    category: h.category || 'General',
    tags: h.tags || [],
    references: h.references || ''
  }));

  return { hadiths, metadata: data.metadata || {} };
}

function groupByBook(hadiths) {
  const books = new Map();
  
  hadiths.forEach(hadith => {
    const bookNum = hadith.bookNumber || '1';
    if (!books.has(bookNum)) {
      books.set(bookNum, []);
    }
    books.get(bookNum).push(hadith);
  });

  return books;
}

async function saveCollection(collectionKey, englishData, arabicData) {
  const collectionDir = path.join(OUTPUT_DIR, collectionKey);
  if (!fs.existsSync(collectionDir)) {
    fs.mkdirSync(collectionDir, { recursive: true });
  }

  // Transform data
  const english = transformFawazahmed0Data(englishData, collectionKey);
  const arabic = transformFawazahmed0Data(arabicData, collectionKey);

  // Merge Arabic and English
  const mergedHadiths = english.hadiths.map((h, idx) => ({
    ...h,
    arabic: arabic.hadiths[idx]?.arabic || h.arabic || ''
  }));

  // Group by book
  const books = groupByBook(mergedHadiths);

  // Save individual book files
  const bookMetadata = [];
  for (const [bookNum, hadithList] of books.entries()) {
    const bookPath = path.join(collectionDir, `book-${bookNum}.json`);
    fs.writeFileSync(bookPath, JSON.stringify(hadithList, null, 2));
    
    bookMetadata.push({
      number: bookNum,
      name: hadithList[0]?.bookName || `Book ${bookNum}`,
      arabicName: '',
      hadithCount: hadithList.length
    });
  }

  // Create metadata
  const info = COLLECTIONS[collectionKey];
  const metadata = {
    name: collectionKey,
    title: info?.name || collectionKey,
    arabicTitle: info?.arabic || '',
    author: info?.author || 'Unknown',
    death: info?.death || '',
    description: `Hadith collection imported from fawazahmed0/hadith-api`,
    authenticity: getAuthenticity(collectionKey),
    compilerPeriod: getCompilerPeriod(collectionKey),
    totalHadith: mergedHadiths.length,
    totalBooks: books.size,
    books: bookMetadata.sort((a, b) => parseInt(a.number) - parseInt(b.number))
  };

  fs.writeFileSync(
    path.join(collectionDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  return { hadiths: mergedHadiths.length, books: books.size };
}

function getAuthenticity(collection) {
  const authenticities = {
    bukhari: 'Sahih (Authentic)',
    muslim: 'Sahih (Authentic)',
    tirmidhi: 'Hasan (Good)',
    abudawud: 'Hasan (Good)',
    nasai: 'Hasan (Good)',
    ibnmajah: 'Hasan (Good)',
    malik: 'Sahih (Authentic)',
    'musnad-ahmad': 'Varied',
    'riyadussalihin': 'Sahih (Authentic)'
  };
  return authenticities[collection] || '';
}

function getCompilerPeriod(collection) {
  const periods = {
    bukhari: '194-256 AH',
    muslim: '204-261 AH',
    tirmidhi: '209-279 AH',
    abudawud: '202-275 AH',
    nasai: '215-303 AH',
    ibnmajah: '209-273 AH',
    malik: '93-179 AH',
    'musnad-ahmad': '164-241 AH',
    'riyadussalihin': '631-676 AH'
  };
  return periods[collection] || '';
}

async function downloadCollection(collectionKey) {
  console.log(`\n📚 Downloading ${COLLECTIONS[collectionKey]?.name || collectionKey}...`);
  
  const editions = SOURCES.fawazahmed0.editions[collectionKey];
  if (!editions) {
    console.log(`   No editions found for ${collectionKey}`);
    return null;
  }

  const [englishEdition, arabicEdition] = editions;
  
  const englishData = await downloadFromFawazahmed0(collectionKey, englishEdition);
  await sleep(500); // Rate limiting
  const arabicData = await downloadFromFawazahmed0(collectionKey, arabicEdition);

  if (!englishData && !arabicData) {
    console.log(`   ❌ Failed to download any data for ${collectionKey}`);
    return null;
  }

  const result = await saveCollection(collectionKey, englishData, arabicData);
  console.log(`   ✅ Saved ${result.hadiths} hadiths in ${result.books} books`);
  
  return result;
}

async function main() {
  console.log('🚀 Starting Comprehensive Hadith Download\n');
  console.log('Using fawazahmed0/hadith-api - most comprehensive hadith database\n');

  let successCount = 0;
  let totalHadiths = 0;
  let totalBooks = 0;

  for (const collectionKey of Object.keys(COLLECTIONS)) {
    const result = await downloadCollection(collectionKey);
    if (result) {
      successCount++;
      totalHadiths += result.hadiths;
      totalBooks += result.books;
    }
    await sleep(1000); // Be nice to the API
  }

  console.log(`\n✨ Complete! Downloaded ${successCount}/${Object.keys(COLLECTIONS).length} collections`);
  console.log(`📊 Total: ${totalHadiths} hadiths in ${totalBooks} books`);
  console.log(`\n📁 Output: ${OUTPUT_DIR}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
