import fs from 'fs';
import path from 'path';

// Hadith collection sources to try
const hadithSources = [
  {
    name: 'Sahih Muslim',
    filename: 'muslim',
    urls: [
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/9_books/muslim.json',
      'https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/main/sahih_muslim.json',
      'https://raw.githubusercontent.com/halimbahae/Hadith/main/data/muslim.json'
    ]
  },
  {
    name: 'Sunan al-Tirmidhi',
    filename: 'tirmidhi',
    urls: [
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/9_books/tirmidhi.json',
      'https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/main/jami_at_tirmidhi.json',
      'https://raw.githubusercontent.com/halimbahae/Hadith/main/data/tirmidhi.json'
    ]
  },
  {
    name: 'Sunan Abu Dawud',
    filename: 'abu-dawud',
    urls: [
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/9_books/abu_dawud.json',
      'https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/main/sunan_abu_dawud.json',
      'https://raw.githubusercontent.com/halimbahae/Hadith/main/data/abu_dawud.json'
    ]
  },
  {
    name: 'Sunan al-Nasa\'i',
    filename: 'nasai',
    urls: [
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/9_books/nasai.json',
      'https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/main/sunan_an_nasai.json',
      'https://raw.githubusercontent.com/halimbahae/Hadith/main/data/nasai.json'
    ]
  },
  {
    name: 'Sunan Ibn Majah',
    filename: 'ibn-majah',
    urls: [
      'https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/9_books/ibn_majah.json',
      'https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/main/sunan_ibn_majah.json',
      'https://raw.githubusercontent.com/halimbahae/Hadith/main/data/ibn_majah.json'
    ]
  }
];

async function downloadHadithCollection(source) {
  console.log(`\n🔍 Searching for ${source.name}...`);
  
  for (let i = 0; i < source.urls.length; i++) {
    try {
      console.log(`   Trying source ${i + 1}: ${source.urls[i]}`);
      const response = await fetch(source.urls[i]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`   ✅ Successfully downloaded ${data.length || 'unknown number of'} hadiths`);
      
      // Save the data
      const outputPath = path.join('./src/data/hadith-collections', source.filename);
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(outputPath, `${source.filename}.json`),
        JSON.stringify(data, null, 2)
      );
      
      // Create metadata
      const metadata = createMetadata(source.name, source.filename, data);
      fs.writeFileSync(
        path.join(outputPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log(`   💾 Saved to ${outputPath}/`);
      return { success: true, data };
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (i === source.urls.length - 1) {
        console.log(`   🚫 All sources failed for ${source.name}`);
      }
    }
  }
  
  return { success: false, data: null };
}

function createMetadata(name, filename, data) {
  const bookCount = Array.isArray(data) ? 1 : (data.books ? data.books.length : 0);
  const hadithCount = Array.isArray(data) ? data.length : 
    (data.hadiths ? data.hadiths.length : 
    data.books ? data.books.reduce((sum, book) => sum + (book.hadiths ? book.hadiths.length : 0), 0) : 0);

  return {
    name: filename,
    title: name,
    arabicTitle: getArabicTitle(name),
    author: getAuthor(name),
    death: getDeathYear(name),
    description: getDescription(name),
    authenticity: getAuthenticity(name),
    compilerPeriod: getCompilerPeriod(name),
    totalHadith: hadithCount,
    totalBooks: bookCount,
    books: Array.isArray(data) ? [] : (data.books || [])
  };
}

function getArabicTitle(name) {
  const titles = {
    'Sahih Muslim': 'صحيح مسلم',
    'Sunan al-Tirmidhi': 'سنن الترمذي',
    'Sunan Abu Dawud': 'سنن أبي داود',
    'Sunan al-Nasa\'i': 'سنن النسائي',
    'Sunan Ibn Majah': 'سنن ابن ماجه'
  };
  return titles[name] || '';
}

function getAuthor(name) {
  const authors = {
    'Sahih Muslim': 'Imam Muslim ibn al-Hajjaj',
    'Sunan al-Tirmidhi': 'Imam Abu Isa al-Tirmidhi',
    'Sunan Abu Dawud': 'Imam Abu Dawud al-Sijistani',
    'Sunan al-Nasa\'i': 'Imam al-Nasa\'i',
    'Sunan Ibn Majah': 'Imam Ibn Majah'
  };
  return authors[name] || 'Unknown';
}

function getDeathYear(name) {
  const deaths = {
    'Sahih Muslim': '261 AH / 875 CE',
    'Sunan al-Tirmidhi': '279 AH / 892 CE',
    'Sunan Abu Dawud': '275 AH / 889 CE',
    'Sunan al-Nasa\'i': '303 AH / 915 CE',
    'Sunan Ibn Majah': '273 AH / 887 CE'
  };
  return deaths[name] || '';
}

function getDescription(name) {
  const descriptions = {
    'Sahih Muslim': 'Second most authentic collection of Hadith. Imam Muslim was a student of Imam al-Bukhari.',
    'Sunan al-Tirmidhi': 'Collection containing authentic, good, and weak hadith with authenticity grading.',
    'Sunan Abu Dawud': 'One of the six major Hadith collections focusing on Islamic jurisprudence.',
    'Sunan al-Nasa\'i': 'Collection known for detailed chains of narration and strong authenticity.',
    'Sunan Ibn Majah': 'One of the six canonical Hadith collections covering faith and practice.'
  };
  return descriptions[name] || 'Hadith collection';
}

function getAuthenticity(name) {
  const authenticities = {
    'Sahih Muslim': 'Sahih (Authentic)',
    'Sunan al-Tirmidhi': 'Hasan (Good)',
    'Sunan Abu Dawud': 'Hasan (Good)',
    'Sunan al-Nasa\'i': 'Hasan (Good)',
    'Sunan Ibn Majah': 'Hasan (Good)'
  };
  return authenticities[name] || '';
}

function getCompilerPeriod(name) {
  const periods = {
    'Sahih Muslim': '204-261 AH',
    'Sunan al-Tirmidhi': '209-279 AH',
    'Sunan Abu Dawud': '202-275 AH',
    'Sunan al-Nasa\'i': '215-303 AH',
    'Sunan Ibn Majah': '209-273 AH'
  };
  return periods[name] || '';
}

// Main execution
async function main() {
  console.log('🚀 Starting Hadith Collection Download Process\n');
  
  let successCount = 0;
  
  for (const source of hadithSources) {
    const result = await downloadHadithCollection(source);
    if (result.success) {
      successCount++;
    }
  }
  
  console.log(`\n✨ Process Complete! Successfully downloaded ${successCount}/${hadithSources.length} collections`);
  console.log('\n📁 Check the following directories for downloaded data:');
  
  hadithSources.forEach(source => {
    console.log(`   src/data/hadith-collections/${source.filename}/`);
  });
}

main().catch(console.error);
