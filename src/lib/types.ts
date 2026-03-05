// Hadith Collection Types
export interface HadithCollectionMetadata {
  title: string;
  author: string;
  compiler: string;
  totalHadith: number;
  totalBooks: number;
  books: HadithBook[];
}

export interface HadithBook {
  number: string;
  name: string;
  arabicName: string;
  hadithCount: number;
  chapters?: HadithChapter[];
  description?: string;
}

export interface HadithChapter {
  number: string;
  name: string;
  arabicName: string;
  hadithCount: number;
}
