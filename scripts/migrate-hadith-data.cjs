#!/usr/bin/env node

/**
 * Hadith Data Migration Script
 * Converts CheeseWithSauce/HadithsJSONFormat data to Noor Connect EnhancedHadith format
 */

const fs = require('fs');
const path = require('path');

// Collection metadata mapping
const COLLECTION_METADATA = {
  bukhari: {
    title: "Sahih al-Bukhari",
    arabicTitle: "صحيح البخاري",
    author: "Imam Muhammad ibn Ismail al-Bukhari",
    death: "256 AH / 870 CE",
    description: "The most authentic collection of Hadith after the Quran. Imam al-Bukhari spent 16 years compiling it, selecting only authentic narrations.",
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "194-256 AH"
  },
  muslim: {
    title: "Sahih Muslim",
    arabicTitle: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj",
    death: "261 AH / 875 CE",
    description: "Second most authentic collection of Hadith. Imam Muslim was a student of Imam al-Bukhari and his collection is renowned for its precise methodology.",
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "204-261 AH"
  },
  abudawud: {
    title: "Sunan Abu Dawud",
    arabicTitle: "سنن أبي داود",
    author: "Imam Abu Dawud al-Sijistani",
    death: "275 AH / 889 CE",
    description: "One of the six major Hadith collections focusing strongly on Islamic jurisprudence and legal rulings.",
    authenticity: "Hasan (Good)",
    compilerPeriod: "202-275 AH"
  },
  tirmidhi: {
    title: "Sunan al-Tirmidhi",
    arabicTitle: "سنن الترمذي",
    author: "Imam Abu Isa al-Tirmidhi",
    death: "279 AH / 892 CE",
    description: "Collection containing authentic, good, and weak hadith. Imam al-Tirmidhi categorized hadith by authenticity grade.",
    authenticity: "Hasan (Good)",
    compilerPeriod: "209-279 AH"
  },
  nasai: {
    title: "Sunan al-Nasa'i",
    arabicTitle: "سنن النسائي",
    author: "Imam al-Nasa'i",
    death: "303 AH / 915 CE",
    description: "Collection known for detailed chains of narration and strong authenticity standards.",
    authenticity: "Hasan (Good)",
    compilerPeriod: "215-303 AH"
  },
  ibnmajah: {
    title: "Sunan Ibn Majah",
    arabicTitle: "سنن ابن ماجه",
    author: "Imam Ibn Majah",
    death: "273 AH / 887 CE",
    description: "One of the six canonical Hadith collections covering faith, character, worship, and legal rulings.",
    authenticity: "Hasan (Good)",
    compilerPeriod: "209-273 AH"
  },
  malik: {
    title: "Muwatta Malik",
    arabicTitle: "موطأ مالك",
    author: "Imam Malik ibn Anas",
    death: "179 AH / 795 CE",
    description: "Early collection of Hadith and legal rulings compiled in Medina.",
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "93-179 AH"
  },
  riyadussalihin: {
    title: "Riyad us-Salihin",
    arabicTitle: "رياض الصالحين",
    author: "Imam al-Nawawi",
    death: "676 AH / 1277 CE",
    description: "Collection focusing on spirituality, character, and daily Islamic practice.",
    authenticity: "Sahih (Authentic)",
    compilerPeriod: "631-676 AH"
  }
};

/**
 * Extract book number and name from book string
 * Example: "1 Purification (Kitab Al-Taharah) كتاب الطهارة" -> { number: "1", name: "Purification (Kitab Al-Taharah)" }
 */
function parseBookInfo(bookString) {
  const match = bookString.match(/^(\d+)\s+(.+?)(?:\s+كتاب|$)/);
  if (match) {
    return {
      number: match[1],
      name: match[2].trim()
    };
  }
  
  // Fallback if pattern doesn't match
  const parts = bookString.split(' ');
  return {
    number: parts[0] || "1",
    name: parts.slice(1).join(' ') || bookString
  };
}

/**
 * Extract narrator from English text
 */
function extractNarrator(englishText) {
  const match = englishText.match(/^Narrated\s+([^:]+):/);
  return match ? match[1] : undefined;
}

/**
 * Generate category from book name
 */
function generateCategory(bookName) {
  const lowerName = bookName.toLowerCase();
  
  if (lowerName.includes('purification') || lowerName.includes('taharah')) return 'Purification';
  if (lowerName.includes('prayer') || lowerName.includes('salah')) return 'Prayer';
  if (lowerName.includes('fasting') || lowerName.includes('sawm')) return 'Fasting';
  if (lowerName.includes('zakat') || lowerName.includes('charity')) return 'Charity';
  if (lowerName.includes('hajj') || lowerName.includes('pilgrimage')) return 'Hajj';
  if (lowerName.includes('marriage') || lowerName.includes('nikah')) return 'Marriage';
  if (lowerName.includes('divorce') || lowerName.includes('talaq')) return 'Divorce';
  if (lowerName.includes('trade') || lowerName.includes('business')) return 'Trade';
  if (lowerName.includes('food') || lowerName.includes('eating')) return 'Food';
  if (lowerName.includes('clothing') || lowerName.includes('dress')) return 'Clothing';
  if (lowerName.includes('medicine') || lowerName.includes('health')) return 'Health';
  if (lowerName.includes('funeral') || lowerName.includes('death')) return 'Funeral';
  if (lowerName.includes('knowledge') || lowerName.includes('ilm')) return 'Knowledge';
  if (lowerName.includes('manners') || lowerName.includes('adab')) return 'Manners';
  if (lowerName.includes('virtues')) return 'Virtues';
  if (lowerName.includes('hereafter') || lowerName.includes('akhira')) return 'Hereafter';
  
  return 'General';
}

/**
 * Generate tags from book name and content
 */
function generateTags(bookName, englishText) {
  const tags = new Set();
  const category = generateCategory(bookName);
  
  tags.add(category);
  
  // Add tags based on content
  const lowerText = englishText.toLowerCase();
  if (lowerText.includes('prophet')) tags.add('Prophet');
  if (lowerText.includes('allah')) tags.add('Allah');
  if (lowerText.includes('quran')) tags.add('Quran');
  if (lowerText.includes('prayer')) tags.add('Salah');
  if (lowerText.includes('fasting')) tags.add('Sawm');
  if (lowerText.includes('charity')) tags.add('Zakat');
  if (lowerText.includes('hajj')) tags.add('Hajj');
  
  return Array.from(tags);
}

/**
 * Convert source hadith to EnhancedHadith format
 */
function convertHadith(source) {
  const bookInfo = parseBookInfo(source.book);
  const narrator = extractNarrator(source.english);
  const category = generateCategory(bookInfo.name);
  const tags = generateTags(bookInfo.name, source.english);
  
  return {
    id: `${source.collection}-${bookInfo.number}-${source.id}`,
    collection: source.collection,
    bookNumber: bookInfo.number,
    bookName: bookInfo.name,
    hadithNumber: source.id.toString(),
    arabic: source.arabic,
    englishTranslation: source.english,
    narrator,
    grade: source.grade.replace(/^Grade\s*:\s*/i, ''),
    category,
    tags,
    references: source.reference
  };
}

/**
 * Process a single collection directory
 */
async function processCollection(collectionPath, collectionName) {
  console.log(`Processing collection: ${collectionName}`);
  
  const targetDir = path.join(process.cwd(), 'src', 'data', 'hadith-collections', collectionName);
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const hadiths = [];
  const books = new Map();
  
  // Read all JSON files in collection directory
  const files = fs.readdirSync(collectionPath).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    const filePath = path.join(collectionPath, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceHadiths = JSON.parse(content);
      
      for (const sourceHadith of sourceHadiths) {
      const enhancedHadith = convertHadith(sourceHadith);
      hadiths.push(enhancedHadith);
      
      // Track book information
      const bookKey = enhancedHadith.bookNumber;
      if (!books.has(bookKey)) {
        books.set(bookKey, {
          name: enhancedHadith.bookName,
          arabicName: '', // Would need to extract from source if available
          hadithCount: 0
        });
      }
      books.get(bookKey).hadithCount++;
      }
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
      continue;
    }
    }
  
  // Write hadiths file
  const hadithsFile = path.join(targetDir, 'hadiths.json');
  fs.writeFileSync(hadithsFile, JSON.stringify(hadiths, null, 2));
  
  // Write metadata file
  const metadata = {
    name: collectionName,
    ...COLLECTION_METADATA[collectionName],
    totalHadith: hadiths.length,
    totalBooks: books.size,
    books: Array.from(books.entries()).map(([number, info]) => ({
      number,
      ...info
    }))
  };
  
  const metadataFile = path.join(targetDir, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  
  console.log(`✅ Processed ${hadiths.length} hadiths from ${books.size} books`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting hadith data migration...');
  
  // This should point to the downloaded CheeseWithSauce/HadithsJSONFormat/Sunnah directory
  const sourceDir = './temp-hadith-data/Sunnah';
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    console.log('Please download the data from https://github.com/CheeseWithSauce/HadithsJSONFormat');
    console.log('and extract it to ./hadiths-data/Sunnah');
    process.exit(1);
  }
  
  const collections = fs.readdirSync(sourceDir);
  
  for (const collection of collections) {
    const collectionPath = path.join(sourceDir, collection);
    
    if (fs.statSync(collectionPath).isDirectory()) {
      // Map collection names to match your app's naming
      const mappedName = collection.toLowerCase().replace(/\s+/g, '-');
      await processCollection(collectionPath, mappedName);
    }
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('📚 Please restart your app to see the new hadith data.');
}

// Run migration
migrate().catch(console.error);
