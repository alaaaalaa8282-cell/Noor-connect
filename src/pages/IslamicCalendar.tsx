import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Moon, Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { gToHApiResponseSchema, calendarApiResponseSchema, safeParseApiResponse } from "@/lib/api-schemas";

interface IslamicDate {
  hijri: {
    date: string;
    format: string;
    day: string;
    weekday: {
      en: string;
      ar: string;
    };
    month: {
      number: number;
      en: string;
      ar: string;
    };
    year: string;
    designation: {
      abbreviated: string;
      expanded: string;
    };
    holidays: string[];
  };
  gregorian: {
    date: string;
    format: string;
    day: string;
    weekday: {
      en: string;
    };
    month: {
      number: number;
      en: string;
    };
    year: string;
    designation: {
      abbreviated: string;
      expanded: string;
    };
  };
}

const importantDates = [
  { name: "Ramadan", icon: "🌙", description: "Month of Fasting", color: "bg-primary/10 text-foreground border border-primary/20" },
  { name: "Laylat al-Qadr", icon: "✨", description: "Night of Power", color: "bg-primary/20 text-foreground border border-primary/30" },
  { name: "Eid al-Fitr", icon: "🎉", description: "Festival of Breaking the Fast", color: "bg-accent/10 text-foreground border border-accent/20" },
  { name: "Eid al-Adha", icon: "🐑", description: "Festival of Sacrifice", color: "bg-secondary/20 text-foreground border border-primary/30" },
  { name: "Dhul Hijjah", icon: "🕋", description: "Month of Hajj", color: "bg-primary/15 text-foreground border border-primary/25" },
  { name: "Muharram", icon: "🌟", description: "Islamic New Year", color: "bg-accent/15 text-foreground border border-accent/25" },
  { name: "Ashura", icon: "⭐", description: "Day of Ashura", color: "bg-secondary/25 text-foreground border border-primary/20" },
];

interface CalendarDay {
  hijriDay: number;
  gregorianDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  holidays: string[];
}

export default function IslamicCalendar() {
  const [islamicDate, setIslamicDate] = useState<IslamicDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [monthData, setMonthData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);

  useEffect(() => {
    fetchIslamicDate();
    fetchMonthCalendar(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  const fetchIslamicDate = async () => {
    try {
      const today = new Date();
      const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      const response = await fetch(`https://api.aladhan.com/v1/gToH/${formattedDate}`);
      const rawData = await response.json();
      
      const parseResult = safeParseApiResponse(gToHApiResponseSchema, rawData);
      
      if (parseResult.success && parseResult.data.code === 200) {
        setIslamicDate(parseResult.data.data as IslamicDate);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error('Error fetching Islamic date:', error);
      toast.error('Failed to load Islamic calendar');
    }
  };

  const fetchMonthCalendar = async (month: number, year: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`
      );
      const rawData = await response.json();
      
      const parseResult = safeParseApiResponse(calendarApiResponseSchema, rawData);
      
      if (parseResult.success && parseResult.data.code === 200) {
        setMonthData(parseResult.data.data[0]);
        generateCalendarDays(parseResult.data.data);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (monthData: any[]) => {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    monthData.forEach((dayData: any) => {
      const gregorianDate = new Date(
        dayData.gregorian.year,
        dayData.gregorian.month.number - 1,
        dayData.gregorian.day
      );
      
      days.push({
        hijriDay: parseInt(dayData.hijri.day),
        gregorianDate: `${dayData.gregorian.day} ${dayData.gregorian.month.en}`,
        isCurrentMonth: true,
        isToday: gregorianDate.toDateString() === today.toDateString(),
        holidays: dayData.hijri.holidays || [],
      });
    });

    setCalendarDays(days);
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day);
  };

  const closeDateModal = () => {
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <Moon className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading Islamic Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Current Islamic Date */}
        <Card className="bg-card elevation-4 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Islamic Calendar</CardTitle>
            </div>
            <CardDescription>Today's Hijri Date</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {islamicDate && (
              <>
                <div className="bg-gradient-primary rounded-xl p-6 space-y-2 text-primary-foreground">
                  <div className="text-4xl font-bold mb-2">
                    {islamicDate.hijri.day} {islamicDate.hijri.month.en} {islamicDate.hijri.year} {islamicDate.hijri.designation.abbreviated}
                  </div>
                  <div className="text-3xl quran-arabic mb-4" dir="rtl">
                    {islamicDate.hijri.day} {islamicDate.hijri.month.ar} {islamicDate.hijri.year} {islamicDate.hijri.designation.abbreviated}
                  </div>
                  <div className="opacity-90">
                    {islamicDate.hijri.weekday.en}
                  </div>
                  <div className="text-sm opacity-80 mt-2">
                    Gregorian: {islamicDate.gregorian.day} {islamicDate.gregorian.month.en} {islamicDate.gregorian.year}
                  </div>
                </div>

                {/* Show holidays if any */}
                {islamicDate.hijri.holidays && islamicDate.hijri.holidays.length > 0 && (
                  <div className="bg-gradient-secondary rounded-lg p-4 border-2 border-accent">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-foreground">Special Day</h3>
                    </div>
                    {islamicDate.hijri.holidays.map((holiday, index) => (
                      <p key={index} className="text-center text-foreground font-medium">
                        {holiday}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Full Calendar View */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                {monthData && `${monthData.hijri.month.en} ${monthData.hijri.year} AH`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleToday}
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {monthData && `${monthData.gregorian.month.en} ${monthData.gregorian.year}`}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
            <div className="w-full overflow-x-auto sm:overflow-x-visible">
              <div className="grid grid-cols-7 gap-1 px-0.5 sm:px-0 sm:min-w-[320px]" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-xs md:text-sm text-muted-foreground p-1 md:p-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square min-w-0 p-1 border border-border bg-card min-h-[40px] cursor-pointer hover:bg-muted/50 transition-colors
                      ${day.isToday ? 'border-primary bg-primary/10' : ''}
                      ${day.holidays.length > 0 ? 'bg-accent/5' : ''}
                    `}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex flex-col h-full min-w-0">
                      <div className="flex justify-between items-start mb-0.5 min-w-0">
                        <span className={`text-xs sm:text-sm md:text-base font-bold ${day.isToday ? 'text-primary' : 'text-foreground'}`}>
                          {day.hijriDay}
                        </span>
                      </div>
                      <div className="text-[0.7rem] sm:text-xs text-muted-foreground mb-0.5 truncate min-w-0">
                        {day.gregorianDate}
                      </div>
                      {day.holidays.length > 0 && (
                        <div className="mt-auto">
                          {/* Mobile: show dot; Desktop/Tablet: show badges */}
                          <div className="hidden sm:block">
                            {day.holidays.map((holiday, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="text-[6px] sm:text-[8px] w-full mb-1 justify-center px-1 min-w-0"
                              >
                                {holiday.length > 10 ? `${holiday.substring(0, 10)}...` : holiday}
                              </Badge>
                            ))}
                          </div>
                          <div className="sm:hidden flex justify-center">
                            <div className="w-1 h-1 rounded-full bg-primary/60 mt-1"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Details Modal */}
        {selectedDate && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeDateModal}
          >
            <div 
              className="bg-card rounded-lg shadow-elegant max-w-sm w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Islamic Date Details</h3>
                  <Button variant="ghost" size="icon" onClick={closeDateModal}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Hijri Date */}
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {selectedDate.hijriDay} {monthData?.hijri.month.en} {monthData?.hijri.year} AH
                    </div>
                    <div className="text-xl quran-arabic" dir="rtl">
                      {selectedDate.hijriDay} {monthData?.hijri.month.ar} {monthData?.hijri.year} AH
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {selectedDate.gregorianDate}
                  </div>
                </div>

                {/* Holidays/Events */}
                {selectedDate.holidays.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Events & Holidays
                    </h4>
                    <div className="space-y-1">
                      {selectedDate.holidays.map((holiday, idx) => (
                        <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                          {holiday}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special note if today */}
                {selectedDate.isToday && (
                  <div className="text-center text-sm text-primary font-medium">
                    🌙 Today
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Important Islamic Dates */}
        <Card className="bg-card backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Important Islamic Dates
            </CardTitle>
            <CardDescription>
              Key events in the Islamic calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {importantDates.map((event, index) => (
                <div
                  key={index}
                  className={`${event.color} rounded-lg p-4 transition-all duration-200 hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{event.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Islamic Months */}
        <Card className="bg-card backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              Islamic Months
            </CardTitle>
            <CardDescription>
              The 12 months of the Hijri calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
                "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
                "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah"
              ].map((month, index) => (
                <Badge
                  key={index}
                  variant={islamicDate?.hijri.month.number === index + 1 ? "default" : "outline"}
                  className="justify-center py-2 text-sm"
                >
                  {index + 1}. {month}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
