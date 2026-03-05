#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'hadith-collections');

const REMAINING_COLLECTIONS = {
  abudawud: {
    name: 'Sunan Abu Dawud',
    arabic: 'سنن أبي داود',
    author: 'Imam Abu Dawud al-Sijistani',
    death: '275 AH / 889 CE',
    books: 43,
    authenticity: 'Hasan (Good)',
    sources: [
      'https://raw.githubusercontent.com/Jammooly1/hadiths-json-files/main/Sunan%20Abi%20Dawud.json',
      'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud.json',
      'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud.json'
    ]
  },
  ibnmajah: {
    name: 'Sunan Ibn Majah',
    arabic: 'سنن ابن ماجه',
    author: 'Imam Ibn Majah',
    death: '273 AH / 887 CE',
    books: 37,
    authenticity: 'Hasan (Good)',
    sources: [
      'https://raw.githubusercontent.com/Jammooly1/hadiths-json-files/main/Sunan%20Ibn%20Majah.json',
      'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-ibnmajah.json',
      'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-ibnmajah.json'
    ]
  },
  malik: {
    name: 'Muwatta Malik',
    arabic: 'موطأ مالك',
    author: 'Imam Malik ibn Anas',
    death: '179 AH / 795 CE',
    books: 61,
    authenticity: 'Sahih (Authentic)',
    sources: [
      'https://raw.githubusercontent.com/Jammooly1/hadiths-json-files/main/Muwatta%20Imam%20Malik.json',
      'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-malik.json',
      'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-malik.json'
    ]
  }
};

async function fetchJSON(url) {
  try {
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'NoorConnect/1.0' },
      timeout: 60000 
    });
    if (!response.ok) {
      console.log(`     ⚠️ HTTP ${response.status} from ${url.split('/').pop()}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.log(`     ⚠️ Error: ${error.message}`);
    return null;
  }
}

function transformJammoolyData(data, collectionKey) {
  const books = [];
  
  if (data.all_books && Array.isArray(data.all_books)) {
    for (const book of data.all_books) {
      const hadiths = [];
      
      if (book.hadith_list && Array.isArray(book.hadith_list)) {
        for (const h of book.hadith_list) {
          hadiths.push({
            id: h.uuid || `${collectionKey}-${book.num}-${h.local_num}`,
            collection: collectionKey,
            bookNumber: book.num?.toString() || '1',
            bookName: book.english_title || `Book ${book.num}`,
            chapterNumber: '',
            chapterName: '',
            hadithNumber: h.local_num?.toString() || '',
            arabic: h.arabic_text || '',
            arabicPlain: '',
            englishTranslation: h.english_text || '',
            narrator: h.narrator || '',
            chain: '',
            grade: h.grade || '',
            category: 'General',
            tags: [],
            references: h.title || ''
          });
        }
      }
      
      books.push({
        number: book.num?.toString() || '1',
        name: book.english_title || `Book ${book.num}`,
        arabicName: book.arabic_title || '',
        hadithCount: hadiths.length,
        hadiths
      });
    }
  }
  
  return books;
}

function transformFawazData(englishData, arabicData, collectionKey) {
  if (!englishData || !englishData.hadiths) return [];
  
  const hadiths = englishData.hadiths.map((h, idx) => ({
    id: `${collectionKey}-${h.hadithnumber || idx}`,
    collection: collectionKey,
    bookNumber: h.bookNumber?.toString() || '1',
    bookName: h.book?.[0]?.name || `Book ${h.bookNumber || 1}`,
    chapterNumber: h.chapter?.toString() || '',
    chapterName: '',
    hadithNumber: h.hadithnumber?.toString() || (idx + 1).toString(),
    arabic: arabicData?.hadiths?.[idx]?.text || arabicData?.hadiths?.[idx]?.arabic || '',
    arabicPlain: '',
    englishTranslation: h.text || h.english?.text || '',
    narrator: h.narrator || h.english?.narrator || '',
    chain: '',
    grade: h.grade || '',
    category: 'General',
    tags: [],
    references: ''
  }));

  // Group by book
  const bookMap = new Map();
  for (const h of hadiths) {
    if (!bookMap.has(h.bookNumber)) {
      bookMap.set(h.bookNumber, []);
    }
    bookMap.get(h.bookNumber).push(h);
  }

  return Array.from(bookMap.entries()).map(([num, hadithList]) => ({
    number: num,
    name: hadithList[0]?.bookName || `Book ${num}`,
    arabicName: '',
    hadithCount: hadithList.length,
    hadiths: hadithList
  }));
}

async function processCollection(collectionKey, info) {
  console.log(`\n📚 Processing ${info.name}...`);
  
  let books = [];
  let source = '';

  // Try Jammooly source first (has proper book structure)
  const jammoolyUrl = info.sources[0];
  console.log(`   Trying Jammooly source...`);
  const jammoolyData = await fetchJSON(jammoolyUrl);
  
  if (jammoolyData && jammoolyData.all_books) {
    console.log(`   ✅ Got data from Jammooly`);
    books = transformJammoolyData(jammoolyData, collectionKey);
    source = 'Jammooly1/hadiths-json-files';
  } else {
    // Try Fawaz source
    console.log(`   Trying Fawaz source...`);
    const engData = await fetchJSON(info.sources[1]);
    const araData = await fetchJSON(info.sources[2]);
    
    if (engData) {
      console.log(`   ✅ Got data from fawazahmed0/hadith-api`);
      books = transformFawazData(engData, araData, collectionKey);
      source = 'fawazahmed0/hadith-api';
    }
  }

  if (books.length === 0) {
    console.log(`   ❌ Failed to get data from any source`);
    return null;
  }

  // Save collection
  const collectionDir = path.join(OUTPUT_DIR, collectionKey);
  if (!fs.existsSync(collectionDir)) {
    fs.mkdirSync(collectionDir, { recursive: true });
  }

  let totalHadiths = 0;
  const bookMetadata = [];
  
  for (const book of books) {
    const bookPath = path.join(collectionDir, `book-${book.number}.json`);
    fs.writeFileSync(bookPath, JSON.stringify(book.hadiths, null, 2));
    totalHadiths += book.hadithCount;
    
    bookMetadata.push({
      number: book.number,
      name: book.name,
      arabicName: book.arabicName,
      hadithCount: book.hadithCount
    });
  }

  // Create metadata
  const metadata = {
    name: collectionKey,
    title: info.name,
    arabicTitle: info.arabic,
    author: info.author,
    death: info.death,
    description: `Hadith collection imported from ${source}`,
    authenticity: info.authenticity,
    compilerPeriod: '',
    totalHadith: totalHadiths,
    totalBooks: books.length,
    books: bookMetadata.sort((a, b) => parseInt(a.number) - parseInt(b.number))
  };

  fs.writeFileSync(
    path.join(collectionDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`   ✅ Saved ${books.length} books, ${totalHadiths} hadiths`);
  return { books: books.length, hadiths: totalHadiths };
}

async function main() {
  console.log('🚀 Fetching Remaining Hadith Collections\n');
  
  let totalBooks = 0;
  let totalHadiths = 0;
  let successCount = 0;

  for (const [key, info] of Object.entries(REMAINING_COLLECTIONS)) {
    const result = await processCollection(key, info);
    if (result) {
      totalBooks += result.books;
      totalHadiths += result.hadiths;
      successCount++;
    }
  }

  console.log(`\n✨ Complete! Fetched ${successCount}/${Object.keys(REMAINING_COLLECTIONS).length} collections`);
  console.log(`📊 Total: ${totalHadiths} hadiths in ${totalBooks} books`);
}

main().catch(console.error);
