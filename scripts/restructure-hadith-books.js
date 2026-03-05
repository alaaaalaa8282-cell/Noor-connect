#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..', 'src', 'data', 'hadith-collections');

const COLLECTION_INFO = {
  bukhari: { totalBooks: 97, authenticity: 'Sahih (Authentic)' },
  muslim: { totalBooks: 43, authenticity: 'Sahih (Authentic)' },
  tirmidhi: { totalBooks: 50, authenticity: 'Hasan (Good)' },
  abudawud: { totalBooks: 43, authenticity: 'Hasan (Good)' },
  nasai: { totalBooks: 52, authenticity: 'Hasan (Good)' },
  ibnmajah: { totalBooks: 37, authenticity: 'Hasan (Good)' },
  malik: { totalBooks: 61, authenticity: 'Sahih (Authentic)' },
};

async function restructureCollection(collectionKey) {
  console.log(`\n📚 Restructuring ${collectionKey}...`);
  
  const collectionDir = path.join(BASE_DIR, collectionKey);
  const book1Path = path.join(collectionDir, 'book-1.json');
  const metadataPath = path.join(collectionDir, 'metadata.json');
  
  if (!fs.existsSync(book1Path)) {
    console.log(`   ⚠️ No book-1.json found`);
    return null;
  }

  // Read the single large book file
  const hadiths = JSON.parse(fs.readFileSync(book1Path, 'utf8'));
  console.log(`   📖 Found ${hadiths.length} hadiths`);

  // Group by bookNumber - extract from hadithnumber or book field
  const books = new Map();
  
  hadiths.forEach(hadith => {
    // Try to determine book number from various fields
    let bookNum = '1';
    
    // Check for book reference in text or id
    const idParts = hadith.id ? hadith.id.split('-') : [];
    if (idParts.length >= 2) {
      // Format: collection-book-number
      bookNum = idParts[1] || '1';
    }
    
    // If no book number in ID, use hadithnumber to distribute evenly
    if (bookNum === '1' && hadith.hadithNumber) {
      const info = COLLECTION_INFO[collectionKey];
      if (info) {
        const totalHadiths = hadiths.length;
        const hadithNum = parseInt(hadith.hadithNumber, 10) || 1;
        const estimatedBook = Math.ceil((hadithNum / totalHadiths) * info.totalBooks);
        bookNum = Math.max(1, Math.min(estimatedBook, info.totalBooks)).toString();
      }
    }

    if (!books.has(bookNum)) {
      books.set(bookNum, []);
    }
    books.get(bookNum).push(hadith);
  });

  console.log(`   📚 Distributed into ${books.size} books`);

  // Delete old book-1.json
  fs.unlinkSync(book1Path);

  // Save individual book files
  const bookMetadata = [];
  for (const [bookNum, bookHadiths] of books.entries()) {
    // Sort by hadith number
    bookHadiths.sort((a, b) => {
      const numA = parseInt(a.hadithNumber, 10) || 0;
      const numB = parseInt(b.hadithNumber, 10) || 0;
      return numA - numB;
    });

    const bookPath = path.join(collectionDir, `book-${bookNum}.json`);
    fs.writeFileSync(bookPath, JSON.stringify(bookHadiths, null, 2));
    
    bookMetadata.push({
      number: bookNum,
      name: `Book ${bookNum}`,
      arabicName: '',
      hadithCount: bookHadiths.length
    });
  }

  // Update metadata
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  metadata.totalBooks = books.size;
  metadata.books = bookMetadata.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`   ✅ Restructured into ${books.size} books`);
  return { books: books.size, hadiths: hadiths.length };
}

async function main() {
  console.log('🔧 Restructuring Hadith Collections\n');
  
  let totalBooks = 0;
  let totalHadiths = 0;

  for (const collectionKey of Object.keys(COLLECTION_INFO)) {
    const result = await restructureCollection(collectionKey);
    if (result) {
      totalBooks += result.books;
      totalHadiths += result.hadiths;
    }
  }

  console.log(`\n✨ Restructure Complete!`);
  console.log(`📊 Total: ${totalHadiths} hadiths across ${totalBooks} books`);
}

main().catch(console.error);
