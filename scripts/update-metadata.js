import fs from 'fs';
import path from 'path';

const collections = [
  {
    name: 'tirmidhi',
    totalHadith: 4053,
    totalBooks: 49,
    title: 'Sunan al-Tirmidhi',
    arabicTitle: 'سنن الترمذي',
    author: 'Imam Abu Isa al-Tirmidhi',
    death: '279 AH / 892 CE',
    description: 'Collection containing authentic, good, and weak hadith with authenticity grading.',
    authenticity: 'Hasan (Good)',
    compilerPeriod: '209-279 AH'
  },
  {
    name: 'abudawud',
    totalHadith: 5276,
    totalBooks: 43,
    title: 'Sunan Abu Dawud',
    arabicTitle: 'سنن أبي داود',
    author: 'Imam Abu Dawud al-Sijistani',
    death: '275 AH / 889 CE',
    description: 'One of the six major Hadith collections focusing on Islamic jurisprudence.',
    authenticity: 'Hasan (Good)',
    compilerPeriod: '202-275 AH'
  },
  {
    name: 'nasai',
    totalHadith: 5768,
    totalBooks: 50,
    title: 'Sunan al-Nasa\'i',
    arabicTitle: 'سنن النسائي',
    author: 'Imam al-Nasa\'i',
    death: '303 AH / 915 CE',
    description: 'Collection known for detailed chains of narration and strong authenticity.',
    authenticity: 'Hasan (Good)',
    compilerPeriod: '215-303 AH'
  },
  {
    name: 'ibnmajah',
    totalHadith: 4345,
    totalBooks: 37,
    title: 'Sunan Ibn Majah',
    arabicTitle: 'سنن ابن ماجه',
    author: 'Imam Ibn Majah',
    death: '273 AH / 887 CE',
    description: 'One of the six canonical Hadith collections covering faith and practice.',
    authenticity: 'Hasan (Good)',
    compilerPeriod: '209-273 AH'
  }
];

collections.forEach(collection => {
  const metadataPath = path.join('./src/data/hadith-collections', collection.name, 'metadata.json');
  
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    metadata.totalHadith = collection.totalHadith;
    metadata.totalBooks = collection.totalBooks;
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`✅ Updated ${collection.title} metadata: ${collection.totalBooks} books, ${collection.totalHadith} hadiths`);
  }
});

console.log('🎯 All metadata files updated!');
