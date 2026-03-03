import { lazy } from 'react';

// Lazy load the heavy PDF viewer only when needed
export const PdfViewer = lazy(() => import('../PdfViewer'));

// Create a wrapper for ebook data loading
export const loadEbooksData = () => import('../../data/ebooks-library.json');
