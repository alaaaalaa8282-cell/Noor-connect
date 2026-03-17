/**
 * Islamic Events Widget
 * Displays upcoming Islamic events and today's special events
 */

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, Clock, Star } from 'lucide-react';
import { islamicEventsService } from '@/lib/islamic-events-service';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface IslamicEvent {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  type: 'eid' | 'ramadan' | 'hajj' | 'other';
  daysUntil?: number;
  isToday?: boolean;
}

export function IslamicEventsWidget() {
  const navigate = useNavigate();
  const [todayEvent, setTodayEvent] = useState<IslamicEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<IslamicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();

    // Listen for widget refresh events
    const handleRefresh = () => {
      loadEvents();
    };

    window.addEventListener('widget-refresh', handleRefresh);

    return () => {
      window.removeEventListener('widget-refresh', handleRefresh);
    };
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Get today's Islamic event
      const todaysEvent = await islamicEventsService.getTodaysIslamicEvent();
      if (todaysEvent) {
        setTodayEvent({
          ...todaysEvent,
          isToday: true
        });
      } else {
        setTodayEvent(null);
      }

      // Get upcoming events
      const upcoming = await islamicEventsService.getUpcomingEventsNext7Days();
      setUpcomingEvents(upcoming.map(event => ({
        id: event.id,
        name: event.name,
        arabicName: event.arabicName,
        description: event.description,
        type: event.type,
        daysUntil: event.daysUntil
      })));

    } catch (error) {
      console.error('Error loading Islamic events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Islamic events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotifications = async () => {
    try {
      await islamicEventsService.scheduleUpcomingEvents();
      toast({
        title: 'Notifications Scheduled',
        description: 'Islamic event notifications have been scheduled',
      });
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule notifications',
        variant: 'destructive'
      });
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'eid': return 'bg-green-100 text-green-800 border-green-200';
      case 'ramadan': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hajj': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'eid': return <Star className="w-4 h-4" />;
      case 'ramadan': return <Calendar className="w-4 h-4" />;
      case 'hajj': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-amber-200/60 bg-gradient-to-br from-amber-50/70 via-card to-transparent dark:from-amber-950/20 dark:via-card dark:to-transparent">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            Islamic Events
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            onClick={scheduleNotifications}
            className="h-8 px-3 rounded-xl gap-2"
          >
            <Bell className="w-4 h-4" />
            Notify
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Upcoming holidays & special days</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Today */}
        {todayEvent ? (
          <div className={`p-3 rounded-2xl border ${getEventColor(todayEvent.type)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getEventIcon(todayEvent.type)}
                  <p className="text-sm font-semibold text-foreground truncate">{todayEvent.name}</p>
                </div>
                <p className="font-arabic text-xs text-muted-foreground mt-1 truncate">
                  {todayEvent.arabicName}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                Today
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {todayEvent.description}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground">
            No special events today.
          </div>
        )}

        {/* Upcoming */}
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Next up
            </p>
            <div className="space-y-2">
              {upcomingEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-2xl border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <p className="text-xs font-semibold text-foreground truncate">{event.name}</p>
                      </div>
                      <p className="font-arabic text-[10px] text-muted-foreground mt-1 truncate">
                        {event.arabicName}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      {event.daysUntil === 1 ? "Tomorrow" : `${event.daysUntil}d`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            No upcoming events in the next 7 days.
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          onClick={() => navigate("/calendar")}
        >
          View Calendar
        </Button>
      </CardContent>
    </Card>
  );
}

export default IslamicEventsWidget;
