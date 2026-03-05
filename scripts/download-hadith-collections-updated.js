import fs from 'fs';
import path from 'path';

// Hadith collections from AhmedBaset/hadith-json repository
const hadithCollections = [
  {
    name: 'Sahih Muslim',
    filename: 'muslim',
    url: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/muslim.json'
  },
  {
    name: 'Sunan al-Tirmidhi',
    filename: 'tirmidhi',
    url: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/tirmidhi.json'
  },
  {
    name: 'Sunan Abu Dawud',
    filename: 'abudawud',
    url: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/abudawud.json'
  },
  {
    name: 'Sunan al-Nasa\'i',
    filename: 'nasai',
    url: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/nasai.json'
  },
  {
    name: 'Sunan Ibn Majah',
    filename: 'ibnmajah',
    url: 'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/ibnmajah.json'
  }
];

async function downloadAndProcessCollection(collection) {
  console.log(`\n🔍 Downloading ${collection.name}...`);
  
  try {
    const response = await fetch(collection.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ Successfully downloaded ${data.hadiths?.length || data.length || 'unknown number of'} hadiths`);
    
    // Create output directory
    const outputPath = path.join('./src/data/hadith-collections', collection.filename);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    // Transform and save data
    const transformedData = transformData(data, collection.filename);
    
    // Save main hadith file
    fs.writeFileSync(
      path.join(outputPath, 'hadiths.json'),
      JSON.stringify(transformedData.hadiths, null, 2)
    );
    
    // Create metadata
    fs.writeFileSync(
      path.join(outputPath, 'metadata.json'),
      JSON.stringify(transformedData.metadata, null, 2)
    );
    
    console.log(`   💾 Saved to ${outputPath}/`);
    console.log(`   📊 ${transformedData.metadata.totalBooks} books, ${transformedData.metadata.totalHadith} hadiths`);
    
    return { success: true, collection };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, collection, error };
  }
}

function transformData(data, filename) {
  // Handle the actual data structure from the repository
  const hadiths = data.hadiths || [];
  const chapters = data.chapters || [];
  
  // Group hadiths by book (assuming bookId field exists)
  const booksMap = new Map();
  
  hadiths.forEach((hadith, index) => {
    const bookId = hadith.bookId || 1;
    if (!booksMap.has(bookId)) {
      booksMap.set(bookId, {
        number: bookId.toString(),
        name: chapters.find(ch => ch.bookId === bookId)?.english || `Book ${bookId}`,
        arabicName: chapters.find(ch => ch.bookId === bookId)?.arabic || '',
        hadithCount: 0,
        hadiths: []
      });
    }
    
    const book = booksMap.get(bookId);
    const enhancedHadith = {
      id: `${filename}-${bookId}-${hadith.id || index}`,
      collection: filename,
      bookNumber: bookId.toString(),
      bookName: book.name,
      chapterNumber: hadith.chapterId?.toString() || '',
      chapterName: '',
      hadithNumber: hadith.id?.toString() || (index + 1).toString(),
      arabic: hadith.arabic || '',
      arabicPlain: '',
      englishTranslation: hadith.english?.text || '',
      narrator: hadith.english?.narrator || '',
      chain: '',
      grade: getGrade(filename),
      category: 'General',
      tags: [],
      references: ''
    };
    
    book.hadiths.push(enhancedHadith);
    book.hadithCount++;
  });
  
  const books = Array.from(booksMap.values());
  
  // Create individual book files
  books.forEach(book => {
    const bookPath = path.join('./src/data/hadith-collections', filename, `book-${book.number}.json`);
    fs.writeFileSync(bookPath, JSON.stringify(book.hadiths, null, 2));
  });
  
  const metadata = {
    name: filename,
    title: getCollectionTitle(filename),
    arabicTitle: getArabicTitle(filename),
    author: getAuthor(filename),
    death: getDeathYear(filename),
    description: getDescription(filename),
    authenticity: getAuthenticity(filename),
    compilerPeriod: getCompilerPeriod(filename),
    totalHadith: hadiths.length,
    totalBooks: books.length,
    books: books.map(book => ({
      number: book.number,
      name: book.name,
      arabicName: book.arabicName,
      hadithCount: book.hadithCount,
      description: book.name
    }))
  };
  
  return { hadiths, metadata };
}

function getCollectionTitle(filename) {
  const titles = {
    'muslim': 'Sahih Muslim',
    'tirmidhi': 'Sunan al-Tirmidhi',
    'abudawud': 'Sunan Abu Dawud',
    'nasai': 'Sunan al-Nasa\'i',
    'ibnmajah': 'Sunan Ibn Majah'
  };
  return titles[filename] || filename;
}

function getArabicTitle(filename) {
  const titles = {
    'muslim': 'صحيح مسلم',
    'tirmidhi': 'سنن الترمذي',
    'abudawud': 'سنن أبي داود',
    'nasai': 'سنن النسائي',
    'ibnmajah': 'سنن ابن ماجه'
  };
  return titles[filename] || '';
}

function getAuthor(filename) {
  const authors = {
    'muslim': 'Imam Muslim ibn al-Hajjaj',
    'tirmidhi': 'Imam Abu Isa al-Tirmidhi',
    'abudawud': 'Imam Abu Dawud al-Sijistani',
    'nasai': 'Imam al-Nasa\'i',
    'ibnmajah': 'Imam Ibn Majah'
  };
  return authors[filename] || 'Unknown';
}

function getDeathYear(filename) {
  const deaths = {
    'muslim': '261 AH / 875 CE',
    'tirmidhi': '279 AH / 892 CE',
    'abudawud': '275 AH / 889 CE',
    'nasai': '303 AH / 915 CE',
    'ibnmajah': '273 AH / 887 CE'
  };
  return deaths[filename] || '';
}

function getDescription(filename) {
  const descriptions = {
    'muslim': 'Second most authentic collection of Hadith. Imam Muslim was a student of Imam al-Bukhari.',
    'tirmidhi': 'Collection containing authentic, good, and weak hadith with authenticity grading.',
    'abudawud': 'One of the six major Hadith collections focusing on Islamic jurisprudence.',
    'nasai': 'Collection known for detailed chains of narration and strong authenticity.',
    'ibnmajah': 'One of the six canonical Hadith collections covering faith and practice.'
  };
  return descriptions[filename] || 'Hadith collection';
}

function getAuthenticity(filename) {
  const authenticities = {
    'muslim': 'Sahih (Authentic)',
    'tirmidhi': 'Hasan (Good)',
    'abudawud': 'Hasan (Good)',
    'nasai': 'Hasan (Good)',
    'ibnmajah': 'Hasan (Good)'
  };
  return authenticities[filename] || '';
}

function getCompilerPeriod(filename) {
  const periods = {
    'muslim': '204-261 AH',
    'tirmidhi': '209-279 AH',
    'abudawud': '202-275 AH',
    'nasai': '215-303 AH',
    'ibnmajah': '209-273 AH'
  };
  return periods[filename] || '';
}

// Main execution
async function main() {
  console.log('🚀 Starting Hadith Collections Download Process\n');
  
  let successCount = 0;
  
  for (const collection of hadithCollections) {
    const result = await downloadAndProcessCollection(collection);
    if (result.success) {
      successCount++;
    }
  }
  
  console.log(`\n✨ Process Complete! Successfully downloaded ${successCount}/${hadithCollections.length} collections`);
  console.log('\n📁 Updated directories:');
  
  hadithCollections.forEach(collection => {
    console.log(`   src/data/hadith-collections/${collection.filename}/`);
  });
}

main().catch(console.error);
