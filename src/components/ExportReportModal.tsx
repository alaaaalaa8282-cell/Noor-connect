/**
 * Export Report Modal
 * UI for generating and downloading PDF reports
 */

import { useState } from 'react';
import { FileDown, Calendar, Loader2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generatePDFReport, prepareReportData, downloadPDF } from '@/lib/pdf-generator';
import type { CycleRecord, CycleStatistics, MedicationDefinition } from '@/types/menstrual';
import { format } from 'date-fns';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  cycles: CycleRecord[];
  statistics: CycleStatistics | null;
  medications: MedicationDefinition[];
}

type DateRangeOption = 3 | 6 | 12;

export function ExportReportModal({
  isOpen,
  onClose,
  profileName,
  cycles,
  statistics,
  medications,
}: ExportReportModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeOption>(6);
  const [includeCycles, setIncludeCycles] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const reportData = prepareReportData(profileName, cycles, statistics, medications, dateRange);
      
      // Filter based on options
      if (!includeMeds) {
        reportData.medications = [];
      }
      if (!includeStats) {
        reportData.statistics = null;
      }
      if (!includeCycles) {
        reportData.cycles = [];
      }

      const blob = await generatePDFReport(reportData);
      const filename = `noor-connect-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      downloadPDF(blob, filename);

      toast({
        title: 'Report Generated',
        description: `Your report has been downloaded as ${filename}`,
      });
      onClose();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Export PDF Report
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Generate a comprehensive health report that you can share with your healthcare provider
          or keep for personal records.
        </p>

        {/* Date Range */}
        <div>
          <Label className="text-sm font-medium">Report Period</Label>
          <div className="flex gap-2 mt-2">
            {([3, 6, 12] as DateRangeOption[]).map(months => (
              <Button
                key={months}
                variant={dateRange === months ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setDateRange(months)}
                className="flex-1"
              >
                {months} months
              </Button>
            ))}
          </div>
        </div>

        {/* Sections to include */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Include Sections</Label>

          <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Cycle History</span>
            </div>
            <Switch checked={includeCycles} onCheckedChange={setIncludeCycles} />
          </div>

          <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Statistics & Summary</span>
            </div>
            <Switch checked={includeStats} onCheckedChange={setIncludeStats} />
          </div>

          <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Medication Log</span>
            </div>
            <Switch checked={includeMeds} onCheckedChange={setIncludeMeds} />
          </div>
        </div>

        {/* Preview info */}
        <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground space-y-1">
          <p>• Report will include data from the last {dateRange} months</p>
          <p>• Generated for profile: <strong>{profileName}</strong></p>
          <p>• {cycles.filter(c => c.endDate).length} completed cycles will be included</p>
          <p>• This report is for personal use, not a medical document</p>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!includeCycles && !includeStats && !includeMeds)}
          className="w-full bg-rose-600 hover:bg-rose-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Generate & Download PDF
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}

export default ExportReportModal;
