/**
 * Photon API Service
 * Search-as-you-type city selection using Komoot's Photon API
 * FOSS-friendly alternative to proprietary geocoding services
 * Updated: Fixed OpenCage API references
 */

export interface CityResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  extent: number[];
  country: string;
  osm_key: string;
  osm_value: string;
  name: string;
  state?: string;
  postcode?: string;
  city?: string;
  street?: string;
  house_number?: string;
  lat: number;
  lon: number;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon: string;
  boundingbox: [number, number, number, number];
}

export interface SearchOptions {
  limit?: number;
  language?: string;
  country?: string;
}

class PhotonAPIService {
  private readonly BASE_URL = 'https://photon.komoot.io/api/';
  private searchAbortController: AbortController | null = null;

  /**
   * Search for cities with debouncing
   */
  async searchCities(query: string, options: SearchOptions = {}): Promise<CityResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    // Cancel previous search if still pending
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }

    // Create new abort controller for this search
    this.searchAbortController = new AbortController();

    try {
      const params = new URLSearchParams({
        q: query,
        // Filter for cities and towns only
        osm_tag: 'place:city',
        // Limit results for better performance
        limit: (options.limit || 10).toString(),
        // Language preference
        lang: options.language || 'en'
      });

      // Add country filter if specified
      if (options.country) {
        params.append('osm_tag', `place:city&country:${options.country}`);
      }

      const url = `${this.BASE_URL}?${params.toString()}`;
      
      const response = await fetch(url, {
        signal: this.searchAbortController.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Noor-Connect-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter results to ensure we only get cities and towns
      const cities = data.features?.filter((feature: any) => {
        const properties = feature.properties;
        return properties.osm_key === 'place' && 
               (properties.osm_value === 'city' || properties.osm_value === 'town');
      }) || [];

      // Transform to our CityResult interface
      return cities.map((feature: any) => ({
        place_id: feature.properties.place_id,
        osm_id: feature.properties.osm_id,
        osm_type: feature.properties.osm_type,
        extent: feature.properties.extent || [],
        country: feature.properties.country || '',
        osm_key: feature.properties.osm_key,
        osm_value: feature.properties.osm_value,
        name: feature.properties.name,
        state: feature.properties.state,
        postcode: feature.properties.postcode,
        city: feature.properties.city,
        street: feature.properties.street,
        house_number: feature.properties.house_number,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        display_name: feature.properties.display_name || feature.properties.name,
        class: feature.properties.class || '',
        type: feature.properties.type || '',
        importance: feature.properties.importance || 0,
        icon: feature.properties.icon || '',
        boundingbox: feature.properties.boundingbox || [0, 0, 0, 0]
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Search request was aborted');
        return [];
      }
      
      console.error('Photon API search error:', error);
      return [];
    } finally {
      this.searchAbortController = null;
    }
  }

  /**
   * Search for both cities and towns
   */
  async searchCitiesAndTowns(query: string, options: SearchOptions = {}): Promise<CityResult[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    // Cancel previous search if still pending
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }

    // Create new abort controller for this search
    this.searchAbortController = new AbortController();

    try {
      const params = new URLSearchParams({
        q: query,
        limit: (options.limit || 15).toString(),
        lang: options.language || 'en'
      });

      // Add country filter if specified
      if (options.country) {
        params.append('osm_tag', `country:${options.country}`);
      }

      const url = `${this.BASE_URL}?${params.toString()}`;
      
      const response = await fetch(url, {
        signal: this.searchAbortController.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Noor-Connect-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter results to ensure we only get cities, towns, and villages
      const places = data.features?.filter((feature: any) => {
        const properties = feature.properties;
        return properties.osm_key === 'place' && 
               ['city', 'town', 'village'].includes(properties.osm_value);
      }) || [];

      // Sort by importance and limit results
      const sortedPlaces = places.sort((a: any, b: any) => 
        (b.properties.importance || 0) - (a.properties.importance || 0)
      ).slice(0, options.limit || 15);

      // Transform to our CityResult interface
      return sortedPlaces.map((feature: any) => ({
        place_id: feature.properties.place_id,
        osm_id: feature.properties.osm_id,
        osm_type: feature.properties.osm_type,
        extent: feature.properties.extent || [],
        country: feature.properties.country || '',
        osm_key: feature.properties.osm_key,
        osm_value: feature.properties.osm_value,
        name: feature.properties.name,
        state: feature.properties.state,
        postcode: feature.properties.postcode,
        city: feature.properties.city,
        street: feature.properties.street,
        house_number: feature.properties.house_number,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        display_name: this.formatDisplayName(feature.properties),
        class: feature.properties.class || '',
        type: feature.properties.type || '',
        importance: feature.properties.importance || 0,
        icon: feature.properties.icon || '',
        boundingbox: feature.properties.boundingbox || [0, 0, 0, 0]
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Search request was aborted');
        return [];
      }
      
      console.error('Photon API search error:', error);
      return [];
    } finally {
      this.searchAbortController = null;
    }
  }

  /**
   * Format display name for better UX
   */
  private formatDisplayName(properties: any): string {
    const parts = [properties.name];
    
    if (properties.state && properties.state !== properties.name) {
      parts.push(properties.state);
    }
    
    if (properties.country) {
      parts.push(properties.country);
    }
    
    return parts.join(', ');
  }

  /**
   * Cancel any pending search requests
   */
  cancelSearch(): void {
    if (this.searchAbortController) {
      this.searchAbortController.abort();
      this.searchAbortController = null;
    }
  }

  /**
   * Get popular Islamic cities as fallback
   */
  getPopularIslamicCities(): CityResult[] {
    return [
      {
        place_id: 1,
        osm_id: 1,
        osm_type: 'relation',
        extent: [],
        country: 'Saudi Arabia',
        osm_key: 'place',
        osm_value: 'city',
        name: 'Mecca',
        state: 'Mecca Region',
        lat: 21.3891,
        lon: 39.8579,
        display_name: 'Mecca, Mecca Region, Saudi Arabia',
        class: 'place',
        type: 'city',
        importance: 1,
        icon: '',
        boundingbox: [21.3891, 39.8579, 21.3891, 39.8579]
      },
      {
        place_id: 2,
        osm_id: 2,
        osm_type: 'relation',
        extent: [],
        country: 'Saudi Arabia',
        osm_key: 'place',
        osm_value: 'city',
        name: 'Medina',
        state: 'Medina Region',
        lat: 24.4686,
        lon: 39.6119,
        display_name: 'Medina, Medina Region, Saudi Arabia',
        class: 'place',
        type: 'city',
        importance: 1,
        icon: '',
        boundingbox: [24.4686, 39.6119, 24.4686, 39.6119]
      },
      {
        place_id: 3,
        osm_id: 3,
        osm_type: 'relation',
        extent: [],
        country: 'Palestine',
        osm_key: 'place',
        osm_value: 'city',
        name: 'Jerusalem',
        state: 'Jerusalem',
        lat: 31.7683,
        lon: 35.2137,
        display_name: 'Jerusalem, Jerusalem, Palestine',
        class: 'place',
        type: 'city',
        importance: 1,
        icon: '',
        boundingbox: [31.7683, 35.2137, 31.7683, 35.2137]
      }
    ];
  }
}

export const photonAPI = new PhotonAPIService();
