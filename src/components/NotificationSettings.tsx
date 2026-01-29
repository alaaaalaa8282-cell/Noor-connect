import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { localNotifications } from "@/lib/local-notifications";
import { useToast } from "@/hooks/use-toast";

export const NotificationSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const enabled = await localNotifications.areNotificationsEnabled();
      setIsEnabled(enabled);
      
      const scheduled = await localNotifications.getScheduledPrayerNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Failed to check notification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const success = await localNotifications.initialize();
      if (success) {
        setIsEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "Prayer reminders will be scheduled automatically",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your device settings",
          variant: "destructive",
        });
      }
    } else {
      await localNotifications.clearPrayerNotifications();
      setIsEnabled(false);
      setScheduledCount(0);
      toast({
        title: "Notifications Disabled",
        description: "Prayer reminders have been cancelled",
      });
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    await checkNotificationStatus();
  };

  const handleClearNotifications = async () => {
    await localNotifications.clearPrayerNotifications();
    setScheduledCount(0);
    toast({
      title: "Notifications Cleared",
      description: "All scheduled prayer reminders have been cancelled",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <CardTitle>Prayer Notifications</CardTitle>
        </div>
        <CardDescription>
          Receive reminders for prayer times even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">Prayer Reminders</div>
            <div className="text-sm text-muted-foreground">
              Get notified at prayer times
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
          {isEnabled ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-orange-500" />
          )}
          <span className="text-sm">
            {isEnabled
              ? `${scheduledCount} prayer reminders scheduled`
              : 'Prayer reminders are disabled'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isLoading}
          >
            <Settings className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          
          {isEnabled && scheduledCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearNotifications}
            >
              <BellOff className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Notifications use system alarm to wake up device</p>
          <p>• Works even when app is closed or device is in deep sleep</p>
          <p>• Automatically schedules next day's prayers</p>
          <p>• FOSS-friendly - no proprietary services required</p>
        </div>
      </CardContent>
    </Card>
  );
};
