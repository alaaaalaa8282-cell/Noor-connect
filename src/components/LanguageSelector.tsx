import { useState, useEffect } from "react";
import { Search, Globe, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { quranService, type QuranEdition } from "@/lib/quran-service";

interface LanguageSelectorProps {
  selectedEditionId: string;
  onEditionChange: (editionId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface GroupedEditions {
  [language: string]: (QuranEdition & { id: string })[];
}

export function LanguageSelector({
  selectedEditionId,
  onEditionChange,
  onClose,
  isOpen
}: LanguageSelectorProps) {
  const [editions, setEditions] = useState<GroupedEditions>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentEditions, setRecentEditions] = useState<string[]>([]);

  // Load recent editions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quran-recent-editions");
    if (saved) {
      try {
        setRecentEditions(JSON.parse(saved));
      } catch {
        setRecentEditions([]);
      }
    }
  }, []);

  // Fetch editions
  useEffect(() => {
    if (!isOpen) return;

    const loadEditions = async () => {
      try {
        setLoading(true);
        
        // Use synchronous method from quranService
        const groupedEditions = quranService.getEditionsByLanguage();
        setEditions(groupedEditions);
      } catch (error) {
        console.error("Error loading editions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEditions();
  }, [isOpen]);

  // Filter editions based on search
  const filteredEditions: GroupedEditions = {};
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    for (const [lang, langEditions] of Object.entries(editions)) {
      const matching = langEditions.filter(
        (e) =>
          e.language.toLowerCase().includes(query) ||
          e.author.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filteredEditions[lang] = matching;
      }
    }
  }

  const handleEditionSelect = (editionId: string) => {
    // Update recent editions
    const newRecent = [editionId, ...recentEditions.filter((id) => id !== editionId)].slice(0, 5);
    setRecentEditions(newRecent);
    localStorage.setItem("quran-recent-editions", JSON.stringify(newRecent));

    onEditionChange(editionId);
  };

  const getEditionDisplay = (editionId: string) => {
    for (const langEditions of Object.values(editions)) {
      const edition = langEditions.find((e) => e.id === editionId);
      if (edition) {
        return {
          language: edition.language,
          author: edition.author,
          direction: edition.direction
        };
      }
    }
    return null;
  };

  if (!isOpen) return null;

  const currentEdition = getEditionDisplay(selectedEditionId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-lg" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Select Translation</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Current Selection */}
        {currentEdition && (
          <div className="p-4 bg-primary/5 border-b flex-shrink-0">
            <div className="text-sm text-muted-foreground mb-1">Current:</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentEdition.language}</Badge>
              <span className="font-medium">{currentEdition.author}</span>
              {currentEdition.direction === "rtl" && (
                <Badge variant="outline" className="text-xs">
                  RTL
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search language, author, or edition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recent Editions */}
              {!searchQuery && recentEditions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent</h3>
                  <div className="space-y-1">
                    {recentEditions.map((editionId) => {
                      const edition = getEditionDisplay(editionId);
                      if (!edition) return null;
                      return (
                        <button
                          key={editionId}
                          onClick={() => handleEditionSelect(editionId)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                            selectedEditionId === editionId
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {edition.language}
                            </Badge>
                            <span className="text-sm">{edition.author}</span>
                          </div>
                          {selectedEditionId === editionId && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Language Groups */}
              {(searchQuery ? filteredEditions : editions) &&
                Object.entries(searchQuery ? filteredEditions : editions).map(
                  ([language, langEditions]) => (
                    <div key={language}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        {language}
                        <Badge variant="outline" className="text-xs">
                          {langEditions.length}
                        </Badge>
                      </h3>
                      <div className="space-y-1">
                        {langEditions.map((edition) => (
                          <button
                            key={`${edition.id}-${edition.author}`} // Unique key combining id and author
                            onClick={() => handleEditionSelect(edition.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                              selectedEditionId === edition.id
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-sm font-medium">{edition.author}</span>
                              {edition.comments && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {edition.comments}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {edition.direction === "rtl" && (
                                <Badge variant="outline" className="text-xs">
                                  RTL
                                </Badge>
                              )}
                              {selectedEditionId === edition.id && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}

              {/* No Results */}
              {searchQuery && Object.keys(filteredEditions).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No translations found for &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {Object.values(editions).reduce((acc, arr) => acc + arr.length, 0)} translations
            available
          </span>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
