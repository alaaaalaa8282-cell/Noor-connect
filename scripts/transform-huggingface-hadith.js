#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, '..', 'temp', 'huggingface');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'hadith-collections');

// Map filename to collection slug
const COLLECTION_MAP = {
  'Sahih al-Bukhari.json': 'bukhari',
  'Sahih Muslim.json': 'muslim',
  "Jami` at-Tirmidhi.json": 'tirmidhi',
  'Sunan Abi Dawud.json': 'abudawud',
  "Sunan an-Nasa'i.json": 'nasai',
  'Sunan Ibn Majah.json': 'ibnmajah'
};

// Collection metadata
const COLLECTION_META = {
  bukhari: { title: "Sahih al-Bukhari", author: "Imam Muhammad ibn Ismail al-Bukhari", death: "256 AH", authenticity: "Sahih", arabicTitle: "صحيح البخاري" },
  muslim: { title: "Sahih Muslim", author: "Imam Muslim ibn al-Hajjaj", death: "261 AH", authenticity: "Sahih", arabicTitle: "صحيح مسلم" },
  tirmidhi: { title: "Sunan al-Tirmidhi", author: "Imam Abu Isa al-Tirmidhi", death: "279 AH", authenticity: "Hasan", arabicTitle: "سنن الترمذي" },
  abudawud: { title: "Sunan Abu Dawud", author: "Imam Abu Dawud al-Sijistani", death: "275 AH", authenticity: "Hasan", arabicTitle: "سنن أبي داود" },
  nasai: { title: "Sunan al-Nasa'i", author: "Imam al-Nasa'i", death: "303 AH", authenticity: "Hasan", arabicTitle: "سنن النسائي" },
  ibnmajah: { title: "Sunan Ibn Majah", author: "Imam Ibn Majah", death: "273 AH", authenticity: "Hasan", arabicTitle: "سنن ابن ماجه" }
};

function transformHadith(raw, collection, bookNumber) {
  return {
    id: `${collection}-${bookNumber}-${raw['In-book reference']?.replace(/\D/g, '') || Math.random().toString(36)}`,
    collection: collection,
    bookNumber: String(bookNumber),
    bookName: raw.Chapter_Title_English?.replace(/^Chapter:\s*/, '') || `Book ${bookNumber}`,
    chapterNumber: String(raw.Chapter_Number || bookNumber),
    chapterName: raw.Chapter_Title_English?.replace(/^Chapter:\s*/, '') || '',
    hadithNumber: raw['In-book reference']?.match(/Hadith (\d+)/)?.[1] || '',
    arabic: raw.Arabic_Text || '',
    englishTranslation: raw.English_Text || '',
    narrator: '',
    grade: raw.Grade || '',
    category: raw.Chapter_Title_English?.replace(/^Chapter:\s*/, '') || '',
    tags: [],
    references: raw.Reference || ''
  };
}

function processCollection(filename) {
  const slug = COLLECTION_MAP[filename];
  if (!slug) return null;

  console.log(`\n📚 Processing ${filename}...`);
  
  const filePath = path.join(SOURCE_DIR, filename);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(`   Total hadiths: ${rawData.length}`);

  // Group by chapter
  const books = new Map();
  
  for (const hadith of rawData) {
    const chapterNum = hadith.Chapter_Number || 1;
    if (!books.has(chapterNum)) {
      books.set(chapterNum, {
        number: String(chapterNum),
        name: hadith.Chapter_Title_English?.replace(/^Chapter:\s*/, '') || `Book ${chapterNum}`,
        arabicName: hadith.Chapter_Title_Arabic || '',
        hadiths: []
      });
    }
    books.get(chapterNum).hadiths.push(transformHadith(hadith, slug, chapterNum));
  }

  // Sort books by number
  const sortedBooks = Array.from(books.values()).sort((a, b) => parseInt(a.number) - parseInt(b.number));
  
  // Flatten all hadiths
  const allHadiths = sortedBooks.flatMap(b => b.hadiths);

  // Save combined file
  const collectionDir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(collectionDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(collectionDir, 'hadiths.json'),
    JSON.stringify(allHadiths, null, 2)
  );

  // Create metadata
  const meta = {
    name: slug,
    ...COLLECTION_META[slug],
    totalHadith: allHadiths.length,
    totalBooks: sortedBooks.length,
    books: sortedBooks.map(b => ({ number: b.number, name: b.name, arabicName: b.arabicName, hadithCount: b.hadiths.length })),
    dataFile: 'hadiths.json'
  };

  fs.writeFileSync(
    path.join(collectionDir, 'metadata.json'),
    JSON.stringify(meta, null, 2)
  );

  console.log(`   ✅ Books: ${sortedBooks.length}, Hadiths: ${allHadiths.length}`);
  
  return { slug, books: sortedBooks.length, hadiths: allHadiths.length };
}

// Main
console.log('🔄 Transforming HuggingFace Hadith Data\n');

const results = [];
for (const filename of Object.keys(COLLECTION_MAP)) {
  const result = processCollection(filename);
  if (result) results.push(result);
}

console.log(`\n✨ Complete! Transformed ${results.length} collections`);
console.log(`\n📊 Results:`);
let totalHadiths = 0;
for (const r of results) {
  console.log(`   ${r.slug}: ${r.books} books, ${r.hadiths} hadiths`);
  totalHadiths += r.hadiths;
}
console.log(`   Total: ${totalHadiths} hadiths`);
