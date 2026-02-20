/**
 * Islamic Events Widget
 * Displays upcoming Islamic events and today's special events
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bell, Clock, Star } from 'lucide-react';
import { islamicEventsService } from '@/lib/islamic-events-service';
import { islamicCalendarService } from '@/lib/islamic-calendar-service';
import { importantIslamicDates } from '@/data/islamic-dates';
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
  const [todayEvent, setTodayEvent] = useState<IslamicEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<IslamicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
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
    <div className="space-y-4">
      {/* Today's Islamic Event */}
      {todayEvent && (
        <Card className={`border-2 ${getEventColor(todayEvent.type)}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {getEventIcon(todayEvent.type)}
              Today's Islamic Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-bold text-lg">{todayEvent.name}</h3>
              <p className="font-arabic text-sm text-muted-foreground mt-1">
                {todayEvent.arabicName}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {todayEvent.description}
            </p>
            <Badge variant="secondary" className="w-fit">
              {todayEvent.type.charAt(0).toUpperCase() + todayEvent.type.slice(1)}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Upcoming Events
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={scheduleNotifications}
                className="gap-2"
              >
                <Bell className="w-4 h-4" />
                Schedule Notifications
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getEventIcon(event.type)}
                      <h4 className="font-semibold text-sm">{event.name}</h4>
                    </div>
                    <p className="font-arabic text-xs text-muted-foreground">
                      {event.arabicName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil} days`}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Events */}
      {!todayEvent && upcomingEvents.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Special Events This Week</h3>
            <p className="text-sm text-muted-foreground">
              Check back later for upcoming Islamic events and holidays
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
