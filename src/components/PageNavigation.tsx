import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, BookOpen, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { quranService } from '@/lib/quran-service';
import { mushafService } from '@/lib/mushaf-service';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: PageNavigationProps) {
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [showSurahDialog, setShowSurahDialog] = useState(false);
  const [jumpPage, setJumpPage] = useState(currentPage.toString());

  const { prev, next } = mushafService.getAdjacentPages(currentPage);

  const handleFirstPage = useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);

  const handlePrevPage = useCallback(() => {
    if (prev) onPageChange(prev);
  }, [prev, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (next) onPageChange(next);
  }, [next, onPageChange]);

  const handleLastPage = useCallback(() => {
    onPageChange(totalPages);
  }, [totalPages, onPageChange]);

  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(jumpPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setShowJumpDialog(false);
      setJumpPage(currentPage.toString());
    }
  }, [jumpPage, totalPages, onPageChange, currentPage]);

  const handleJumpToSurah = useCallback((surahNumber: number) => {
    const pageNum = mushafService.getPageForSurah(surahNumber);
    onPageChange(pageNum);
    setShowSurahDialog(false);
  }, [onPageChange]);

  const allSurahs = quranService.getAllSurahs();

  return (
    <div className="flex items-center justify-between gap-2 p-4 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 dark:from-amber-900/50 dark:via-yellow-900/30 dark:to-orange-900/50 rounded-2xl border-2 border-amber-300 dark:border-amber-700">
      {/* First & Previous */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleFirstPage}
          disabled={currentPage <= 1 || isLoading}
          className="h-10 w-10 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          title="First Page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={!prev || isLoading}
          className="h-10 w-10 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          title="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Page Info & Jump */}
      <div className="flex items-center gap-3">
        <Dialog open={showJumpDialog} onOpenChange={setShowJumpDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 h-10 px-4 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold"
            >
              <Hash className="w-4 h-4" />
              Page {currentPage}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs border-4 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
            <DialogHeader>
              <DialogTitle className="text-amber-900 dark:text-amber-100">Jump to Page</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                className="h-10 border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40"
                placeholder="Page #"
              />
              <Button
                onClick={handleJumpToPage}
                className="h-10 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white border-2 border-amber-300"
              >
                Go
              </Button>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              Enter a page number (1-{totalPages})
            </p>
          </DialogContent>
        </Dialog>

        <Dialog open={showSurahDialog} onOpenChange={setShowSurahDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 h-10 px-4 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold"
            >
              <BookOpen className="w-4 h-4" />
              Surah
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-4 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-amber-900 dark:text-amber-100">Jump to Surah</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-2 p-1">
                {allSurahs.map((surah) => {
                  const pageNum = mushafService.getPageForSurah(surah.number);
                  return (
                    <button
                      key={surah.number}
                      onClick={() => handleJumpToSurah(surah.number)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 flex items-center justify-center font-bold text-sm text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-600">
                          {surah.number}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-amber-900 dark:text-amber-100">{surah.englishName}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">{surah.englishNameTranslation}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-arabic text-lg text-amber-900 dark:text-amber-100">{surah.name}</p>
                        <p className="text-xs text-amber-500 dark:text-amber-500">Page {pageNum}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Next & Last */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={!next || isLoading}
          className="h-10 w-10 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          title="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleLastPage}
          disabled={currentPage >= totalPages || isLoading}
          className="h-10 w-10 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          title="Last Page"
        >
          <ChevronsRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
