import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  const [searchCity, setSearchCity] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchCity.trim()) {
      toast({
        title: "City Required",
        description: "Please enter a city name",
        variant: "destructive"
      });
      return;
    }

    try {
      await onLocationSelect(searchCity.trim(), searchCountry.trim() || "");
      setSearchQuery("");
      setSearchCity("");
      setSearchCountry("");
    } catch (error) {
      toast({
        title: "Location Not Found",
        description: "Could not find prayer times for this location. Please try a different city.",
        variant: "destructive"
      });
    }
  };

  const handlePopularCity = async (city: string, country: string) => {
    try {
      await onLocationSelect(city, country);
    } catch (error) {
      toast({
        title: "Location Not Found",
        description: "Could not find prayer times for this location. Please try a different city.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Find Your Location</h3>
          <p className="text-sm text-muted-foreground">
            We couldn't detect your location automatically. Please search for your city.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="City name"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Input
              placeholder="Country"
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !searchCity.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Location
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
                onClick={() => handlePopularCity(city.city, city.country)}
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
            Prayer times are calculated using the Aladhan API
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
