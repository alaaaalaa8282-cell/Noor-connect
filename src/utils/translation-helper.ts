/**
 * Translation Helper Utility
 * Helps extract and manage translations
 */

import { translations } from '@/lib/translations';

export const exportTranslationsToJSON = () => {
  // Convert translations to downloadable JSON files
  const dataStr = JSON.stringify(translations, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'translations.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importTranslationsFromJSON = (file: File): Promise<typeof translations> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const translations = JSON.parse(result);
        resolve(translations);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const getMissingTranslations = () => {
  const englishKeys = Object.keys(translations.en);
  const languages = ['ar', 'ur', 'id', 'tr'] as const;
  
  const missing: Record<string, string[]> = {};
  
  languages.forEach(lang => {
    const langKeys = Object.keys(translations[lang]);
    const missingKeys = englishKeys.filter(key => !langKeys.includes(key));
    if (missingKeys.length > 0) {
      missing[lang] = missingKeys;
    }
  });
  
  return missing;
};

export const generateTranslationTemplate = () => {
  const englishKeys = Object.keys(translations.en);
  const template: Record<string, Record<string, string>> = {};
  
  ['ar', 'ur', 'id', 'tr'].forEach(lang => {
    template[lang] = {};
    englishKeys.forEach(key => {
      template[lang][key] = ''; // Empty for translation
    });
  });
  
  return template;
};
