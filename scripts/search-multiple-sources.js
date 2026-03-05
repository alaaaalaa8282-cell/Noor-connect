#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'hadith-collections');

// Search for hadith data from multiple GitHub repositories
const REPOSITORIES = [
  {
    name: 'Jammooly1/hadiths-json-files',
    url: 'https://api.github.com/repos/Jammooly1/hadiths-json-files/contents',
    baseRawUrl: 'https://raw.githubusercontent.com/Jammooly1/hadiths-json-files/main'
  },
  {
    name: 'AhmedBaset/hadith-json',
    url: 'https://api.github.com/repos/AhmedBaset/hadith-json/contents/db/by_book/the_9_books',
    baseRawUrl: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books'
  },
  {
    name: 'fawazahmed0/hadith-api',
    url: 'https://api.github.com/repos/fawazahmed0/hadith-api/contents/database/linebyline',
    baseRawUrl: 'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/database/linebyline'
  }
];

const COLLECTIONS = {
  bukhari: { name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري', books: 97 },
  muslim: { name: 'Sahih Muslim', arabic: 'صحيح مسلم', books: 43 },
  tirmidhi: { name: 'Sunan al-Tirmidhi', arabic: 'سنن الترمذي', books: 50 },
  abudawud: { name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود', books: 43 },
  abudawood: { name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود', books: 43 },
  nasai: { name: "Sunan al-Nasa'i", arabic: "سنن النسائي", books: 52 },
  ibnmajah: { name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه', books: 37 },
  malik: { name: 'Muwatta Malik', arabic: 'موطأ مالك', books: 61 },
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJSON(url) {
  try {
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'NoorConnect/1.0' },
      timeout: 30000 
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function searchRepository(repo) {
  console.log(`\n🔍 Searching ${repo.name}...`);
  
  const contents = await fetchJSON(repo.url);
  if (!contents || !Array.isArray(contents)) {
    console.log(`   ❌ Failed to list repository contents`);
    return [];
  }

  const foundCollections = [];
  
  for (const item of contents) {
    const name = item.name.toLowerCase().replace('.json', '');
    
    // Check if this matches any collection
    for (const [key, info] of Object.entries(COLLECTIONS)) {
      if (name.includes(key) || key.includes(name.replace(/[-_]/g, ''))) {
        const rawUrl = `${repo.baseRawUrl}/${item.name}`;
        console.log(`   ✅ Found ${info.name} at ${rawUrl}`);
        foundCollections.push({
          collection: key,
          url: rawUrl,
          source: repo.name
        });
        break;
      }
    }
  }
  
  return foundCollections;
}

async function downloadCollection(collectionData) {
  console.log(`\n📥 Downloading ${COLLECTIONS[collectionData.collection]?.name || collectionData.collection} from ${collectionData.source}...`);
  
  const data = await fetchJSON(collectionData.url);
  if (!data) {
    console.log(`   ❌ Failed to download`);
    return null;
  }

  return { data, source: collectionData.source };
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
            bookNumber: book.num,
            bookName: book.english_title || `Book ${book.num}`,
            chapterNumber: '',
            chapterName: '',
            hadithNumber: h.local_num || '',
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
        number: book.num,
        name: book.english_title || `Book ${book.num}`,
        arabicName: book.arabic_title || '',
        hadiths
      });
    }
  }
  
  return books;
}

function transformAhmedBasetData(data, collectionKey) {
  const books = [];
  
  if (Array.isArray(data)) {
    // Group by book
    const bookMap = new Map();
    
    for (const h of data) {
      const bookNum = h.bookId || h.book || 1;
      if (!bookMap.has(bookNum)) {
        bookMap.set(bookNum, []);
      }
      
      bookMap.get(bookNum).push({
        id: h.id || `${collectionKey}-${bookNum}-${h.hadithnumber || Math.random()}`,
        collection: collectionKey,
        bookNumber: bookNum.toString(),
        bookName: h.bookName || `Book ${bookNum}`,
        chapterNumber: h.chapterId?.toString() || '',
        chapterName: '',
        hadithNumber: h.hadithnumber?.toString() || '',
        arabic: h.arabic || '',
        arabicPlain: '',
        englishTranslation: h.english?.text || h.text || '',
        narrator: h.english?.narrator || h.narrator || '',
        chain: '',
        grade: h.grade || '',
        category: 'General',
        tags: [],
        references: ''
      });
    }
    
    for (const [num, hadiths] of bookMap.entries()) {
      books.push({
        number: num.toString(),
        name: hadiths[0]?.bookName || `Book ${num}`,
        arabicName: '',
        hadiths
      });
    }
  }
  
  return books;
}

async function saveBooks(collectionKey, books, source) {
  const collectionDir = path.join(OUTPUT_DIR, collectionKey);
  if (!fs.existsSync(collectionDir)) {
    fs.mkdirSync(collectionDir, { recursive: true });
  }

  // Save individual book files
  let totalHadiths = 0;
  const bookMetadata = [];
  
  for (const book of books) {
    const bookPath = path.join(collectionDir, `book-${book.number}.json`);
    fs.writeFileSync(bookPath, JSON.stringify(book.hadiths, null, 2));
    totalHadiths += book.hadiths.length;
    
    bookMetadata.push({
      number: book.number,
      name: book.name,
      arabicName: book.arabicName || '',
      hadithCount: book.hadiths.length
    });
  }

  // Create metadata
  const info = COLLECTIONS[collectionKey];
  const metadata = {
    name: collectionKey,
    title: info?.name || collectionKey,
    arabicTitle: info?.arabic || '',
    author: '',
    death: '',
    description: `Hadith collection imported from ${source}`,
    authenticity: getAuthenticity(collectionKey),
    compilerPeriod: '',
    totalHadith: totalHadiths,
    totalBooks: books.length,
    books: bookMetadata.sort((a, b) => parseInt(a.number) - parseInt(b.number))
  };

  fs.writeFileSync(
    path.join(collectionDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  return { books: books.length, hadiths: totalHadiths };
}

function getAuthenticity(collection) {
  const authenticities = {
    bukhari: 'Sahih (Authentic)',
    muslim: 'Sahih (Authentic)',
    tirmidhi: 'Hasan (Good)',
    abudawud: 'Hasan (Good)',
    abudawood: 'Hasan (Good)',
    nasai: 'Hasan (Good)',
    ibnmajah: 'Hasan (Good)',
    malik: 'Sahih (Authentic)'
  };
  return authenticities[collection] || 'Varied';
}

async function main() {
  console.log('🚀 Multi-Source Hadith Search Agent\n');
  
  const allFound = [];
  
  // Search all repositories
  for (const repo of REPOSITORIES) {
    const found = await searchRepository(repo);
    allFound.push(...found);
    await sleep(1000);
  }
  
  console.log(`\n📊 Found ${allFound.length} collections across repositories`);
  
  // Download and process each unique collection
  const processed = new Set();
  let totalBooks = 0;
  let totalHadiths = 0;
  
  for (const item of allFound) {
    if (processed.has(item.collection)) continue;
    processed.add(item.collection);
    
    const result = await downloadCollection(item);
    if (!result) continue;
    
    // Transform based on source
    let books = [];
    if (item.source.includes('Jammooly')) {
      books = transformJammoolyData(result.data, item.collection);
    } else if (item.source.includes('AhmedBaset')) {
      books = transformAhmedBasetData(result.data, item.collection);
    }
    
    if (books.length === 0) {
      console.log(`   ⚠️ No books extracted`);
      continue;
    }
    
    // Save
    const saved = await saveBooks(item.collection, books, item.source);
    totalBooks += saved.books;
    totalHadiths += saved.hadiths;
    
    console.log(`   ✅ Saved ${saved.books} books, ${saved.hadiths} hadiths`);
    await sleep(500);
  }
  
  console.log(`\n✨ Search Complete!`);
  console.log(`📊 Total: ${totalHadiths} hadiths in ${totalBooks} books`);
  console.log(`📁 Collections: ${processed.size}`);
}

main().catch(console.error);
