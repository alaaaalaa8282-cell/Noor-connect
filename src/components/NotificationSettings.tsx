import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { notificationManager, NotificationPreferences } from '@/lib/notification-manager';
import { Bell, Clock, Settings, Trash2, TestTube } from 'lucide-react';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationManager.getPreferences()
  );
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPreferences(notificationManager.getPreferences());
    setTodayCount(notificationManager.getTodayNotificationCount());
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationManager.updatePreferences({ [key]: value });
    toast.success('Notification preferences updated');
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      await notificationManager.sendTestNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    notificationManager.clearNotificationHistory();
    toast.success('Notification history cleared');
  };

  const notificationCategories = [
    {
      title: 'Islamic Events',
      description: 'Special occasions and religious observances',
      items: [
        { key: 'ramadanCountdowns', label: 'Ramadan Countdown', description: 'Daily countdown during Ramadan preparation' },
        { key: 'eidGreetings', label: 'Eid Greetings', description: 'Eid-ul-Fitr and Eid-ul-Adha notifications' },
        { key: 'fridayKahfReminders', label: 'Friday Reminders', description: 'Surah Al-Kahf reading reminders' },
      ]
    },
    {
      title: 'Daily Content',
      description: 'Regular Islamic inspiration and knowledge',
      items: [
        { key: 'dailyHadithNotifications', label: 'Daily Hadith', description: 'Random hadith throughout the day' },
        { key: 'quranicVerses', label: 'Quranic Verses', description: 'Morning Quran verses for reflection' },
        { key: 'dhikrReminders', label: 'Dhikr Reminders', description: 'Morning and evening remembrance' },
        { key: 'islamicKnowledge', label: 'Islamic Knowledge', description: 'Interesting facts and teachings' },
        { key: 'motivationalMessages', label: 'Motivational Messages', description: 'Daily Islamic motivation' },
      ]
    },
    {
      title: 'Time-Based',
      description: 'Specific time notifications',
      items: [
        { key: 'morningReminders', label: 'Morning Reminders', description: 'Early morning Islamic content' },
        { key: 'eveningReminders', label: 'Evening Reminders', description: 'Evening Islamic content' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Enhanced Notification Settings</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {todayCount} today
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={isLoading}
              >
                <TestTube className="h-4 w-4 mr-1" />
                Test
              </Button>
            </div>
          </div>
          <CardDescription>
            Customize your Islamic notification preferences and frequency with diverse content
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Notification Categories */}
      {notificationCategories.map((category, categoryIndex) => (
        <Card key={categoryIndex}>
          <CardHeader>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {category.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {item.label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch
                  checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange(item.key as keyof NotificationPreferences, checked)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Frequency Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Frequency
          </CardTitle>
          <CardDescription>
            Control maximum number of notifications per day to avoid notification fatigue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Max Daily Notifications</label>
              <Badge variant="secondary">{preferences.maxDailyNotifications}</Badge>
            </div>
            <Slider
              value={[preferences.maxDailyNotifications]}
              onValueChange={([value]) => 
                handlePreferenceChange('maxDailyNotifications', value)
              }
              min={1}
              max={15}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimal (1)</span>
              <span>Moderate (5)</span>
              <span>Frequent (10)</span>
              <span>Maximum (15)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium">About Enhanced Notifications</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our enhanced notification system provides diverse Islamic content including hadith, 
                Quranic verses, dhikr reminders, and motivational messages. 
                Notifications are time-sensitive and respect your frequency preferences 
                to provide spiritual enrichment without overwhelming you.
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium">Features:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Diverse Islamic content (hadith, Quran, dhikr, knowledge)</li>
                  <li>• Time-based notifications (morning/evening themes)</li>
                  <li>• Smart frequency control to prevent notification fatigue</li>
                  <li>• Contextual Ramadan countdown messages</li>
                  <li>• Enhanced Friday reminders with varied content</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
