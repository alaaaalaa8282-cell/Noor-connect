import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { GeocodingService, type GeocodingResult } from "@/lib/geocoding";

interface LocationSearchProps {
  onLocationSelect: (city: string, country: string) => Promise<void>;
  isLoading?: boolean;
}

const POPULAR_CITIES = [
  { city: "Mecca", country: "Saudi Arabia" },
  { city: "Medina", country: "Saudi Arabia" },
  { city: "Karachi", country: "Pakistan" },
  { city: "Lahore", country: "Pakistan" },
  { city: "Cairo", country: "Egypt" },
  { city: "Istanbul", country: "Turkey" },
  { city: "Jakarta", country: "Indonesia" },
  { city: "Dubai", country: "United Arab Emirates" },
  { city: "Riyadh", country: "Saudi Arabia" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Los Angeles", country: "United States" }
];

export function LocationSearch({ onLocationSelect, isLoading = false }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await GeocodingService.searchLocation(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSuggestionSelect = async (place: GeocodingResult) => {
    try {
      // Improve city extraction logic
      const city = place.address.city ||
        place.address.town ||
        place.address.village ||
        place.address.county ||
        place.address.state ||
        place.display_name.split(',')[0];

      const country = place.address.country || "";

      setSearchQuery(place.display_name);
      setShowSuggestions(false);

      await onLocationSelect(city, country);
    } catch (error) {
      console.error("Selection error:", error);
      toast({
        title: "Selection Failed",
        description: "Could not sync prayer times for this location.",
        variant: "destructive"
      });
    }
  };

  const handleManualSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Split by comma if present to try and parse city/country
    const parts = trimmedQuery.split(',');
    const city = parts[0].trim();
    const country = parts.length > 1 ? parts.slice(1).join(',').trim() : "";

    try {
      await onLocationSelect(city, country);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Manual search error:", error);
      toast({
        title: "Location Not Found",
        description: "Could not find prayer times for this location.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Find Your Location</h3>
          <p className="text-sm text-muted-foreground">
            Search for your city to get accurate prayer times.
          </p>
        </div>

        <div className="space-y-4 relative" ref={wrapperRef}>
          <div className="relative">
            <Input
              placeholder="Search city (e.g. London, UK)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover rounded-md border shadow-md max-h-[200px] overflow-auto">
              {suggestions.map((place, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                  onClick={() => handleSuggestionSelect(place)}
                >
                  <p className="font-medium truncate">{place.display_name}</p>
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={handleManualSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting Location...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Set Location
              </>
            )}
          </Button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium mb-3 text-center">Popular Cities</p>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_CITIES.map((city) => (
              <Button
                key={`${city.city}-${city.country}`}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(`${city.city}, ${city.country}`);
                  onLocationSelect(city.city, city.country);
                }}
                disabled={isLoading}
                className="text-xs h-auto py-2 px-2"
              >
                {city.city}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Search provided by OpenStreetMap
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
