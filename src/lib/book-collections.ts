
/**
 * Book Collection Management System
 */

export interface Collection {
  id: string;
  name: string;
  description: string;
  books: string[];
  color: string;
  icon: string;
  createdAt: Date;
}

export const createCollection = (name: string, description: string, color: string, icon: string): Collection => ({
  id: Date.now().toString(),
  name,
  description,
  books: [],
  color,
  icon,
  createdAt: new Date()
});

export const getCollections = (): Collection[] => {
  const stored = localStorage.getItem('book-collections');
  return stored ? JSON.parse(stored) : [
    { id: '1', name: 'Ramadan Reading', description: 'Books for Ramadan', books: [], color: 'from-emerald-500 to-emerald-700', icon: '🌙', createdAt: new Date() },
    { id: '2', name: 'Favorites', description: 'My favorite books', books: [], color: 'from-rose-500 to-rose-700', icon: '❤️', createdAt: new Date() }
  ];
};

export const saveCollections = (collections: Collection[]): void => {
  localStorage.setItem('book-collections', JSON.stringify(collections));
};

export const addBookToCollection = (collectionId: string, bookUrl: string): void => {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection && !collection.books.includes(bookUrl)) {
    collection.books.push(bookUrl);
    saveCollections(collections);
  }
};

export const removeBookFromCollection = (collectionId: string, bookUrl: string): void => {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection) {
    collection.books = collection.books.filter(url => url !== bookUrl);
    saveCollections(collections);
  }
};
