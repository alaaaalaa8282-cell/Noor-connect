/**
 * Notification Settings Component
 * UI for configuring menstrual mode notification preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Clock, Moon, Droplets, Pill, AlertTriangle, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/lib/notification-service';
import { storage } from '@/lib/storage';

interface NotificationSettingsData {
  enabled: boolean;
  phaseChanges: boolean;
  symptomCheckins: boolean;
  medicationReminders: boolean;
  pmsWarnings: boolean;
  periodPredictions: boolean;
  refillAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxPerDay: number;
  checkinHour: number;
}

const STORAGE_KEY = 'menstrual-notification-settings';

const DEFAULT_SETTINGS: NotificationSettingsData = {
  enabled: true,
  phaseChanges: true,
  symptomCheckins: true,
  medicationReminders: true,
  pmsWarnings: true,
  periodPredictions: true,
  refillAlerts: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  maxPerDay: 3,
  checkinHour: 9,
};

interface NotificationSettingsProps {
  profileId?: string;
}

export function NotificationSettings({ profileId }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettingsData>(DEFAULT_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, DEFAULT_SETTINGS);
    setSettings(saved);

    // Check permission
    notificationService.hasPermission().then(setHasPermission);
  }, []);

  // Save settings on change
  const updateSetting = useCallback(<K extends keyof NotificationSettingsData>(
    key: K,
    value: NotificationSettingsData[K]
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      storage.set(STORAGE_KEY, updated);

      // Reinitialize notification service with new settings
      notificationService.init({
        quietHoursStart: updated.quietHoursStart,
        quietHoursEnd: updated.quietHoursEnd,
        maxPerDay: updated.maxPerDay,
      });

      return updated;
    });
  }, []);

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      setHasPermission(granted);
      if (granted) {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive smart cycle notifications.',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser/device settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request notification permission.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const notificationTypes = [
    {
      key: 'phaseChanges' as const,
      icon: Droplets,
      label: 'Phase Changes',
      description: 'Get notified when your cycle phase changes',
    },
    {
      key: 'symptomCheckins' as const,
      icon: Bell,
      label: 'Symptom Check-ins',
      description: 'Daily reminders to log symptoms and mood',
    },
    {
      key: 'medicationReminders' as const,
      icon: Pill,
      label: 'Medication Reminders',
      description: 'Reminders for supplements and medications',
    },
    {
      key: 'pmsWarnings' as const,
      icon: AlertTriangle,
      label: 'PMS Warnings',
      description: 'Heads up before PMS symptoms may start',
    },
    {
      key: 'periodPredictions' as const,
      icon: Clock,
      label: 'Period Predictions',
      description: 'Reminders before your predicted period date',
    },
    {
      key: 'refillAlerts' as const,
      icon: Settings,
      label: 'Refill Alerts',
      description: 'Alerts when medications are running low',
    },
  ];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </h3>
        {!hasPermission && (
          <Button size="sm" onClick={requestPermission} disabled={isRequesting}>
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </Button>
        )}
        {hasPermission && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Enabled
          </Badge>
        )}
      </div>

      {/* Master toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <Label className="text-sm font-bold">Notifications</Label>
            <p className="text-xs text-muted-foreground">
              {settings.enabled ? 'Notifications are on' : 'All notifications paused'}
            </p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => updateSetting('enabled', checked)}
        />
      </div>

      {/* Notification types */}
      {settings.enabled && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Notification Types
          </p>
          {notificationTypes.map(({ key, icon: Icon, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={settings[key]}
                onCheckedChange={(checked) => updateSetting(key, checked)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Quiet Hours */}
      {settings.enabled && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quiet Hours
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Start</Label>
              <input
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End</Label>
              <input
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Max notifications per day */}
      {settings.enabled && (
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Max notifications per day</Label>
            <span className="text-sm font-bold">{settings.maxPerDay}</span>
          </div>
          <Slider
            value={[settings.maxPerDay]}
            onValueChange={([v]) => updateSetting('maxPerDay', v)}
            min={1}
            max={10}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      )}

      {/* Check-in time */}
      {settings.enabled && settings.symptomCheckins && (
        <div className="space-y-2 pt-3 border-t">
          <Label className="text-sm">Daily check-in time</Label>
          <input
            type="time"
            value={`${settings.checkinHour.toString().padStart(2, '0')}:00`}
            onChange={(e) => updateSetting('checkinHour', parseInt(e.target.value.split(':')[0], 10))}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground pt-2 border-t">
        Notifications are scheduled intelligently based on your cycle data and predictions.
        Quiet hours prevent notifications during sleep time.
      </p>
    </Card>
  );
}

export default NotificationSettings;
