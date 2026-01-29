import { useState, useEffect, useCallback } from 'react';
import { photonAPI, CityResult } from '@/lib/photon-api';

interface UseDebouncedSearchOptions {
  debounceMs?: number;
  minLength?: number;
  limit?: number;
  language?: string;
  country?: string;
  includeTowns?: boolean;
}

interface UseDebouncedSearchReturn {
  results: CityResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
}

/**
 * Hook for debounced city search using Photon API
 */
export const useDebouncedSearch = (options: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn => {
  const {
    debounceMs = 300,
    minLength = 2,
    limit = 10,
    language = 'en',
    country,
    includeTowns = true
  } = options;

  const [results, setResults] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let searchResults: CityResult[];
        
        if (includeTowns) {
          searchResults = await photonAPI.searchCitiesAndTowns(searchQuery, {
            limit,
            language,
            country
          });
        } else {
          searchResults = await photonAPI.searchCities(searchQuery, {
            limit,
            language,
            country
          });
        }

        setResults(searchResults);
        
        if (searchResults.length === 0) {
          setError('No cities found. Try a different search term.');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minLength, limit, language, country, includeTowns]
  );

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      // Cancel any pending API requests
      photonAPI.cancelSearch();
    };
  }, [query, debounceMs, debouncedSearch]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setQuery('');
    photonAPI.cancelSearch();
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults
  };
};
