import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCollectionByName, HadithBook, HadithCollection, EnhancedHadith } from "@/data/hadith-collections";
import { getHadithBookData, getHadithCollectionMetadata } from "@/lib/hadith";

function normalizeBookNumber(bookNumber: string): string {
  const parsed = Number.parseInt(bookNumber, 10);
  return Number.isNaN(parsed) ? bookNumber : String(parsed);
}

export function HadithBookContent() {
  const { collection, book } = useParams<{ collection: string; book: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [hadithData, setHadithData] = useState<EnhancedHadith[]>([]);
  const [remoteCollectionData, setRemoteCollectionData] = useState<HadithCollection | null>(null);

  const staticCollectionData = useMemo(() => {
    return collection ? getCollectionByName(collection) : null;
  }, [collection]);

  const collectionData = remoteCollectionData ?? staticCollectionData;

  useEffect(() => {
    let isMounted = true;

    async function loadCollectionMetadata() {
      if (!collection) {
        setRemoteCollectionData(null);
        return;
      }

      try {
        const metadata = await getHadithCollectionMetadata(collection);
        if (isMounted) {
          setRemoteCollectionData(metadata);
        }
      } catch (error) {
        console.warn(`Failed to load metadata for ${collection}:`, error);
        if (isMounted) {
          setRemoteCollectionData(null);
        }
      }
    }

    loadCollectionMetadata();

    return () => {
      isMounted = false;
    };
  }, [collection]);

  useEffect(() => {
    let isMounted = true;

    async function loadBookHadith() {
      if (!collection || !book) {
        setHadithData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getHadithBookData(collection, book);
        if (isMounted) {
          setHadithData(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.warn(`Failed to load hadith for ${collection}/${book}:`, error);
        if (isMounted) {
          setHadithData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBookHadith();

    return () => {
      isMounted = false;
    };
  }, [collection, book]);

  const bookInfo = useMemo<HadithBook | null>(() => {
    if (!book) {
      return null;
    }

    const normalizedBook = normalizeBookNumber(book);
    const fromMetadata = collectionData?.books.find(
      (entry) => normalizeBookNumber(entry.number) === normalizedBook
    );
    if (fromMetadata) {
      return fromMetadata;
    }

    const firstHadith = hadithData[0];
    if (!firstHadith) {
      return null;
    }

    return {
      number: String(firstHadith.bookNumber ?? book),
      name: firstHadith.bookName ?? `Book ${book}`,
      arabicName: "",
      hadithCount: hadithData.length,
      description: undefined,
    };
  }, [book, collectionData, hadithData]);

  const filteredHadith = useMemo(() => {
    if (!searchTerm) return hadithData;

    const term = searchTerm.toLowerCase();
    return hadithData.filter((hadith) => {
      const tags = Array.isArray(hadith.tags) ? hadith.tags : [];
      return (
        hadith.arabic?.toLowerCase().includes(term) ||
        hadith.englishTranslation?.toLowerCase().includes(term) ||
        hadith.narrator?.toLowerCase().includes(term) ||
        hadith.bookName?.toLowerCase().includes(term) ||
        hadith.chapterName?.toLowerCase().includes(term) ||
        tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [hadithData, searchTerm]);

  const [displayCount, setDisplayCount] = useState(50);

  // Reset pagination when searching or changing books
  useEffect(() => {
    setDisplayCount(50);
  }, [searchTerm, book, collection]);

  const displayedHadith = useMemo(() => {
    return filteredHadith.slice(0, displayCount);
  }, [filteredHadith, displayCount]);

  const loadMore = () => {
    setDisplayCount(prev => prev + 50);
  };

  if (!collectionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Collection Not Found
          </h2>
          <p className="text-muted-foreground">
            The requested Hadith collection could not be found.
          </p>
          <Button
            onClick={() => navigate("/hadith/collections")}
            className="mt-4"
          >
            Browse Collections
          </Button>
        </div>
      </div>
    );
  }

  if (!bookInfo && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Book Not Found
          </h2>
          <p className="text-muted-foreground">
            The requested Hadith book could not be found.
          </p>
          <Button
            onClick={() => navigate(`/hadith/collections/${collection}`)}
            className="mt-4"
          >
            Back to Collection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/hadith/collections/${collection}`)}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{bookInfo?.name ?? `Book ${book}`}</h1>
            {bookInfo?.arabicName && (
              <p className="text-muted-foreground font-arabic" dir="rtl">
                {bookInfo.arabicName}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {loading ? "Loading..." : `${filteredHadith.length} Hadith`}
          </Badge>
        </div>

        {/* Book Info */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Book Information</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Collection:</span> {collectionData.title}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Book Number:</span> {bookInfo?.number ?? book}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Total Hadith:</span> {hadithData.length}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bookInfo?.description || "Description is not available for this book."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search hadith in this book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-border/50 focus:border-primary/50"
          />
        </div>

        {loading && (
          <Card className="border-border/50">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading hadith...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hadith List */}
        {!loading && (
          <div className="space-y-4">
            {displayedHadith.map((hadith) => {
              const tags = Array.isArray(hadith.tags) ? hadith.tags : [];
              return (
                <Card
                  key={hadith.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border-border/50 hover:border-primary/30"
                  onClick={() => {
                    // Individual hadith route can be added later.
                  }}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {hadith.hadithNumber}
                          </Badge>
                          {hadith.grade && (
                            <Badge variant="secondary" className="text-xs">
                              {hadith.grade}
                            </Badge>
                          )}
                        </div>

                        {/* Arabic Text */}
                        <div className="glass-card p-4 rounded-xl mb-3">
                          <p className="text-lg font-arabic text-right leading-loose text-foreground" dir="rtl">
                            {hadith.arabic}
                          </p>
                        </div>

                        {/* Translation */}
                        {hadith.englishTranslation && (
                          <p className="text-sm text-muted-foreground italic leading-relaxed whitespace-pre-wrap">
                            {hadith.englishTranslation}
                          </p>
                        )}

                        {/* Narrator */}
                        {hadith.narrator && (
                          <p className="text-sm font-semibold text-primary mt-3">
                            Narrated by: {hadith.narrator}
                          </p>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Load More Button */}
            {filteredHadith.length > displayCount && (
              <div className="pt-4 pb-8 flex justify-center">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="w-full max-w-sm rounded-xl border-primary/20 hover:bg-primary/5"
                >
                  Load More ({filteredHadith.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredHadith.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {hadithData.length === 0 ? "No Hadith Imported Yet" : "No Hadith Found"}
              </h3>
              <p className="text-muted-foreground">
                {hadithData.length === 0
                  ? "This book is configured but has no local hadith data files yet."
                  : "Try adjusting your search terms to find what you're looking for."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
