#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..', 'src', 'data', 'hadith-collections');

// Collections to merge
const COLLECTIONS = ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah', 'malik'];

async function mergeCollectionBooks(collection) {
  console.log(`\n📚 Processing ${collection}...`);
  
  const collectionDir = path.join(BASE_DIR, collection);
  
  if (!fs.existsSync(collectionDir)) {
    console.log(`   ⚠️ Collection directory not found`);
    return null;
  }

  // Find all book files
  const files = fs.readdirSync(collectionDir);
  const bookFiles = files
    .filter(f => f.startsWith('book-') && f.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/book-(\d+)\.json/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/book-(\d+)\.json/)?.[1] || '0', 10);
      return numA - numB;
    });

  if (bookFiles.length === 0) {
    console.log(`   ⚠️ No book files found`);
    return null;
  }

  console.log(`   Found ${bookFiles.length} book files`);

  // Merge all hadiths
  const allHadiths = [];
  const bookMetadata = [];

  for (const bookFile of bookFiles) {
    const bookPath = path.join(collectionDir, bookFile);
    const bookNum = bookFile.match(/book-(\d+)\.json/)?.[1] || '1';
    
    try {
      const hadiths = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
      
      if (Array.isArray(hadiths) && hadiths.length > 0) {
        allHadiths.push(...hadiths);
        
        bookMetadata.push({
          number: bookNum,
          name: hadiths[0]?.bookName || `Book ${bookNum}`,
          arabicName: '',
          hadithCount: hadiths.length,
          startIndex: allHadiths.length - hadiths.length,
          endIndex: allHadiths.length - 1
        });
        
        // Delete the individual book file
        fs.unlinkSync(bookPath);
      }
    } catch (e) {
      console.log(`   ⚠️ Error processing ${bookFile}: ${e.message}`);
    }
  }

  // Sort all hadiths by book number and hadith number
  allHadiths.sort((a, b) => {
    const bookA = parseInt(a.bookNumber, 10) || 0;
    const bookB = parseInt(b.bookNumber, 10) || 0;
    if (bookA !== bookB) return bookA - bookB;
    
    const numA = parseInt(a.hadithNumber, 10) || 0;
    const numB = parseInt(b.hadithNumber, 10) || 0;
    return numA - numB;
  });

  // Save combined file
  const combinedPath = path.join(collectionDir, 'hadiths.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allHadiths, null, 2));
  
  // Update metadata
  const metadataPath = path.join(collectionDir, 'metadata.json');
  let metadata = {};
  
  if (fs.existsSync(metadataPath)) {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }
  
  metadata.totalHadith = allHadiths.length;
  metadata.totalBooks = bookMetadata.length;
  metadata.books = bookMetadata.map(({ number, name, arabicName, hadithCount }) => ({
    number, name, arabicName, hadithCount
  }));
  metadata.dataFile = 'hadiths.json';
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log(`   ✅ Combined ${allHadiths.length} hadiths from ${bookMetadata.length} books`);
  console.log(`   🗑️  Deleted ${bookFiles.length} individual files`);
  
  return { 
    collection, 
    hadiths: allHadiths.length, 
    books: bookMetadata.length,
    dataSize: (fs.statSync(combinedPath).size / 1024 / 1024).toFixed(2) + ' MB'
  };
}

async function main() {
  console.log('🔧 Combining Hadith Book Files\n');
  
  const results = [];
  let totalHadiths = 0;
  let totalBooks = 0;
  
  for (const collection of COLLECTIONS) {
    const result = await mergeCollectionBooks(collection);
    if (result) {
      results.push(result);
      totalHadiths += result.hadiths;
      totalBooks += result.books;
    }
  }
  
  console.log(`\n✨ Complete! Combined ${results.length} collections`);
  console.log(`📊 Total: ${totalHadiths} hadiths from ${totalBooks} books`);
  
  console.log(`\n📁 Results:`);
  for (const r of results) {
    console.log(`   ${r.collection}: ${r.hadiths} hadiths (${r.dataSize})`);
  }
}

main().catch(console.error);
