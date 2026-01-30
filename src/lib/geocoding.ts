/**
 * Geocoding Service using Nominatim (OpenStreetMap)
 * Free and open-source geocoding API
 */

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country: string;
    state?: string;
    postcode?: string;
  };
}

export class GeocodingService {
  private static readonly NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

  /**
   * Search for a location by query (city name, address, etc.)
   */
  static async searchLocation(query: string): Promise<GeocodingResult[]> {
    try {
      const url = `${this.NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Noor-Connect-Islamic-App/1.0' // Required by Nominatim policy
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const results = await response.json();
      return results;
    } catch (error) {
      console.error('Failed to search location:', error);
      throw error;
    }
  }

  /**
   * Get coordinates for a specific city and country
   */
  static async getCityCoordinates(city: string, country: string): Promise<{
    latitude: number;
    longitude: number;
    displayName: string;
  }> {
    const query = `${city}, ${country}`;
    const results = await this.searchLocation(query);

    if (results.length === 0) {
      throw new Error(`Location not found: ${query}`);
    }

    // Find the best match (prefer exact city matches)
    const bestMatch = results.find(result => 
      result.address.city?.toLowerCase() === city.toLowerCase() ||
      result.address.town?.toLowerCase() === city.toLowerCase() ||
      result.address.village?.toLowerCase() === city.toLowerCase()
    ) || results[0];

    return {
      latitude: parseFloat(bestMatch.lat),
      longitude: parseFloat(bestMatch.lon),
      displayName: bestMatch.display_name
    };
  }

  /**
   * Format location data for storage
   */
  static formatLocationData(
    latitude: number,
    longitude: number,
    displayName: string,
    source: 'manual' | 'geolocation' | 'ip' | 'default' = 'manual'
  ) {
    // Extract city and country from display name
    const parts = displayName.split(',');
    const city = parts[0]?.trim() || 'Unknown';
    const country = parts[parts.length - 1]?.trim() || 'Unknown';

    return {
      latitude,
      longitude,
      city,
      country,
      displayName,
      source,
      timestamp: new Date().toISOString()
    };
  }
}
