#!/usr/bin/env node

/**
 * Test script to verify hadith migration
 */

import fs from 'fs';
import path from 'path';
import { HADITH_COLLECTIONS } from '../src/data/hadith-collections/index.js';

function testMigration() {
  console.log('🧪 Testing hadith migration...\n');
  
  const collectionsDir = path.join(process.cwd(), 'src', 'data', 'hadith-collections');
  
  if (!fs.existsSync(collectionsDir)) {
    console.log('❌ Collections directory not found');
    return false;
  }
  
  const collections = fs.readdirSync(collectionsDir)
    .filter(item => {
      const itemPath = path.join(collectionsDir, item);
      return fs.statSync(itemPath).isDirectory() && item !== 'node_modules';
    });
  
  console.log(`📚 Found ${collections.length} collections`);
  
  let totalHadiths = 0;
  let totalBooks = 0;
  
  for (const collection of collections) {
    const metadataPath = path.join(collectionsDir, collection, 'metadata.json');
    const hadithsPath = path.join(collectionsDir, collection, 'hadiths.json');
    
    if (!fs.existsSync(metadataPath)) {
      console.log(`❌ ${collection}: metadata.json not found`);
      continue;
    }
    
    if (!fs.existsSync(hadithsPath)) {
      console.log(`❌ ${collection}: hadiths.json not found`);
      continue;
    }
    
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      const hadiths = JSON.parse(fs.readFileSync(hadithsPath, 'utf-8'));
      
      console.log(`✅ ${collection}: ${hadiths.length} hadiths, ${metadata.totalBooks} books`);
      
      totalHadiths += hadiths.length;
      totalBooks += metadata.totalBooks;
      
      // Test a few hadiths
      if (hadiths.length > 0) {
        const sampleHadith = hadiths[0];
        const requiredFields = ['id', 'collection', 'bookNumber', 'bookName', 'hadithNumber', 'arabic', 'category', 'tags'];
        
        for (const field of requiredFields) {
          if (!sampleHadith[field]) {
            console.log(`⚠️  ${collection}: Missing field '${field}' in sample hadith`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ ${collection}: Error reading files - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Summary: ${totalHadiths} total hadiths across ${totalBooks} books`);
  
  // Test the index file
  console.log('\n🔍 Testing index file...');
  
  try {
    const collectionNames = Object.keys(HADITH_COLLECTIONS);
    console.log(`✅ Index loads ${collectionNames.length} collections`);
    
    for (const name of collectionNames) {
      const collection = HADITH_COLLECTIONS[name];
      if (collection && collection.totalHadith > 0) {
        console.log(`✅ ${collection.title}: ${collection.totalHadith} hadiths`);
      }
    }
  } catch (error) {
    console.log(`❌ Index file error: ${error.message}`);
    return false;
  }
  
  console.log('\n🎉 Migration test completed!');
  return true;
}

// Run test if this script is executed directly
if (require.main === module) {
  testMigration();
}

export { testMigration };
