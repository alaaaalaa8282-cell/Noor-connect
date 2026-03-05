import fs from 'fs';
import path from 'path';

// Fetch the Sahih Bukhari data
const response = await fetch('https://raw.githubusercontent.com/essaji/Complete-Sahih-Bukhari-Json/refs/heads/master/sahih_bukhari.json');
const data = await response.json();

// Transform the data to match the app's EnhancedHadith structure
const books = [];
const allHadiths = [];
let totalHadithCount = 0;

data.forEach((volume, volumeIndex) => {
  volume.books.forEach((book, bookIndex) => {
    const bookNumber = (volumeIndex * 100 + bookIndex + 1).toString();
    const bookHadiths = [];
    
    book.hadiths.forEach((hadith, hadithIndex) => {
      // Extract hadith number from info field
      const hadithNumberMatch = hadith.info.match(/Number (\d+) :/);
      const hadithNumber = hadithNumberMatch ? hadithNumberMatch[1] : (hadithIndex + 1).toString();
      
      const enhancedHadith = {
        id: `bukhari-${bookNumber}-${hadithNumber}`,
        collection: "bukhari",
        bookNumber: bookNumber,
        bookName: book.name,
        chapterNumber: "",
        chapterName: "",
        hadithNumber: hadithNumber,
        arabic: "", // Arabic text not available in this dataset
        arabicPlain: "",
        englishTranslation: hadith.text,
        narrator: hadith.by,
        chain: "",
        grade: "Sahih",
        category: "General",
        tags: [],
        references: hadith.info
      };
      
      bookHadiths.push(enhancedHadith);
      allHadiths.push(enhancedHadith);
    });
    
    const bookData = {
      number: bookNumber,
      name: book.name,
      arabicName: "", // Could be added later
      hadithCount: book.hadiths.length,
      description: `Book ${bookNumber}: ${book.name}`
    };
    
    books.push(bookData);
    totalHadithCount += book.hadiths.length;
    
    // Write individual book file
    const bookFileName = `book-${bookNumber}.json`;
    fs.writeFileSync(
      path.join('./src/data/hadith-collections/bukhari', bookFileName),
      JSON.stringify(bookHadiths, null, 2)
    );
  });
});

// Update metadata.json
const metadata = {
  name: "bukhari",
  title: "Sahih al-Bukhari",
  arabicTitle: "صحيح البخاري",
  author: "Imam Muhammad ibn Ismail al-Bukhari",
  death: "256 AH / 870 CE",
  description: "The most authentic collection of Hadith after the Quran. Imam al-Bukhari spent 16 years compiling it, selecting only authentic narrations.",
  authenticity: "Sahih (Authentic)",
  compilerPeriod: "194-256 AH",
  totalHadith: totalHadithCount,
  totalBooks: books.length,
  books: books
};

fs.writeFileSync(
  path.join('./src/data/hadith-collections/bukhari', 'metadata.json'),
  JSON.stringify(metadata, null, 2)
);

// Create main hadiths file with all hadiths
fs.writeFileSync(
  path.join('./src/data/hadith-collections/bukhari', 'hadiths.json'),
  JSON.stringify(allHadiths, null, 2)
);

console.log(`Successfully processed Sahih Bukhari:`);
console.log(`- Total books: ${books.length}`);
console.log(`- Total hadiths: ${totalHadithCount}`);
console.log(`- Files created in src/data/hadith-collections/bukhari/`);
