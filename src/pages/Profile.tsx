import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Download, Upload, Trash2, HardDrive, Calculator, Volume2, Bell, BellOff, Calendar, Heart, BookOpen, Mail, HandHeart, Settings, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getTheme, setTheme, getMadhab, setMadhab, getTimeFormat, setTimeFormat as saveTimeFormat } from "@/lib/storage";
import { AdhanSelector } from "@/components/AdhanSelector";
import { CustomAdhanUpload } from "@/components/CustomAdhanUpload";
import { getCalculationMethod, setCalculationMethod, CALCULATION_METHOD_LABELS, type CalculationMethodName } from "@/lib/prayer-calculator";
import { getStorageStats, clearAllBooks, formatFileSize } from "@/lib/ebooks-storage";
import { downloadBackup, importBackup, clearCache, getQuranFontSize, setQuranFontSize } from "@/lib/backup";
import { isSalamGreetingEnabled, setSalamGreetingEnabled } from "@/components/SalamGreeting";
import { notificationManager, type NotificationPreferences } from "@/lib/notification-manager";
import { localNotifications } from "@/lib/local-notifications";
import { PrayerMethodSelector } from "@/components/PrayerMethodSelector";
import { quranFontManager, type QuranFont } from "@/lib/quran-font-manager";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [madhab, setMadhabState] = useState<"shafi" | "hanafi">("shafi");
  const [timeFormat, setTimeFormatState] = useState<"12" | "24">("24");
  const [calculationMethod, setCalculationMethodState] = useState<CalculationMethodName>("MuslimWorldLeague");
  const [quranFontSize, setQuranFontSizeState] = useState(24);
  const [quranFont, setQuranFontState] = useState<QuranFont>("uthmani");
  const [storageStats, setStorageStats] = useState({ totalBooks: 0, totalSize: 0 });
  const [salamGreetingEnabled, setSalamGreetingEnabledState] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    ramadanCountdowns: true,
    eidGreetings: true,
    fridayKahfReminders: true,
    dailyHadithNotifications: false,
    morningReminders: false,
    eveningReminders: false,
  });
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  
  // Prayer notification states
  const [prayerNotificationsEnabled, setPrayerNotificationsEnabled] = useState(false);
  const [prayerNotificationsLoading, setPrayerNotificationsLoading] = useState(true);
  const [scheduledPrayerCount, setScheduledPrayerCount] = useState(0);

  useEffect(() => {
    setIsDarkMode(getTheme() === "dark");
    setMadhabState(getMadhab());
    setTimeFormatState(getTimeFormat());
    setCalculationMethodState(getCalculationMethod());
    setQuranFontSizeState(getQuranFontSize());
    setQuranFontState(quranFontManager.getCurrentFont());
    setSalamGreetingEnabledState(isSalamGreetingEnabled());
    
    // Initialize Quran font manager
    quranFontManager.initialize();
    
    // Load notification preferences
    setNotificationPrefs(notificationManager.getPreferences());
    setNotificationsSupported(notificationManager.areNotificationsEnabled());
    
    // Load prayer notification status
    checkPrayerNotificationStatus();
    
    // Load storage stats
    getStorageStats().then(setStorageStats);
  }, []);

  // Listen for prayer method changes to reload prayer times
  useEffect(() => {
    const handleMethodChange = () => {
      // Trigger prayer time reload when method changes
      // This will be handled by any component that listens for this event
      console.log('Prayer method changed in settings');
    };

    window.addEventListener('prayer-method-changed', handleMethodChange);
    return () => {
      window.removeEventListener('prayer-method-changed', handleMethodChange);
    };
  }, []);

  const handleSalamGreetingToggle = (checked: boolean) => {
    setSalamGreetingEnabledState(checked);
    setSalamGreetingEnabled(checked);
    toast({ title: checked ? "Salam greeting enabled" : "Salam greeting disabled" });
  };

  const handleNotificationToggle = async (key: keyof NotificationPreferences, checked: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: checked };
    setNotificationPrefs(newPrefs);
    notificationManager.updatePreferences({ [key]: checked });
    
    // Request permission if enabling notifications
    if (checked && !notificationsSupported) {
      const granted = await notificationManager.requestPermission();
      setNotificationsSupported(granted);
      if (!granted) {
        toast({ 
          title: "Notification permission denied", 
          description: "Please enable notifications in your browser settings",
          variant: "destructive" 
        });
        return;
      }
    }
    
    toast({ 
      title: `${key.replace(/([A-Z])/g, ' $1').trim()} ${checked ? 'enabled' : 'disabled'}` 
    });
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationManager.requestPermission();
    setNotificationsSupported(granted);
    if (granted) {
      toast({ title: "Notifications enabled! You'll receive Islamic event reminders." });
    } else {
      toast({ 
        title: "Permission denied", 
        description: "Please enable notifications in your browser settings",
        variant: "destructive" 
      });
    }
  };

  const handleTestNotification = () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser does not support notifications.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "granted") {
      try {
        new Notification("Noor Connect", { body: "Test Successful!" });
        toast({ title: "Test notification sent" });
      } catch {
        toast({
          title: "Failed to send notification",
          description: "Your browser blocked the notification.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Enable notifications",
      description: "Please allow notifications in your browser settings to use this feature.",
      variant: "destructive",
    });
  };

  const checkPrayerNotificationStatus = async () => {
    try {
      const enabled = await localNotifications.areNotificationsEnabled();
      setPrayerNotificationsEnabled(enabled);
      
      const scheduled = await localNotifications.getScheduledPrayerNotifications();
      setScheduledPrayerCount(scheduled.length);
    } catch (error) {
      console.error('Failed to check prayer notification status:', error);
    } finally {
      setPrayerNotificationsLoading(false);
    }
  };

  const handlePrayerNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await localNotifications.initialize();
      if (success) {
        setPrayerNotificationsEnabled(true);
        toast({
          title: "Prayer Notifications Enabled",
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
      setPrayerNotificationsEnabled(false);
      setScheduledPrayerCount(0);
      toast({
        title: "Prayer Notifications Disabled",
        description: "Prayer reminders have been cancelled",
      });
    }
  };

  const handleRefreshPrayerNotifications = async () => {
    setPrayerNotificationsLoading(true);
    await checkPrayerNotificationStatus();
  };

  const handleClearPrayerNotifications = async () => {
    await localNotifications.clearPrayerNotifications();
    setScheduledPrayerCount(0);
    toast({
      title: "Prayer Notifications Cleared",
      description: "All scheduled prayer reminders have been cancelled",
    });
  };

  const toggleTheme = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  const handleMadhabChange = (value: "shafi" | "hanafi") => {
    setMadhabState(value);
    setMadhab(value);
    toast({ title: `Madhab: ${value === "shafi" ? "Shafi'i" : "Hanafi"}` });
  };

  const handleTimeFormatChange = (value: "12" | "24") => {
    setTimeFormatState(value);
    saveTimeFormat(value);
    toast({ title: `Time format: ${value}-hour` });
  };

  const handleMethodChange = (value: string) => {
    setCalculationMethodState(value as CalculationMethodName);
    setCalculationMethod(value as CalculationMethodName);
    toast({ title: "Calculation method updated" });
  };

  const handleFontSizeChange = (value: number[]) => {
    const size = value[0];
    setQuranFontSizeState(size);
    setQuranFontSize(size);
  };

  const handleQuranFontChange = async (font: QuranFont) => {
    setQuranFontState(font);
    quranFontManager.setFont(font);
    
    // Load Google Fonts for the selected font
    await quranFontManager.loadGoogleFonts(font);
    
    const fontOption = quranFontManager.getFontOption(font);
    toast({ 
      title: "Quran font changed", 
      description: `Now using ${fontOption.name}` 
    });
  };

  const handleBackup = () => {
    downloadBackup();
    toast({ title: "Backup downloaded" });
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await importBackup(file);
    toast({ 
      title: result.success ? "Success" : "Error", 
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
    
    if (result.success) {
      setTimeout(() => window.location.reload(), 500);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearCache = async () => {
    if (confirm("This will delete all downloaded books and cached data. Continue?")) {
      await clearCache();
      setStorageStats({ totalBooks: 0, totalSize: 0 });
      toast({ title: "Cache cleared" });
    }
  };

  const handleClearBooks = async () => {
    if (confirm("Delete all downloaded e-books?")) {
      await clearAllBooks();
      const stats = await getStorageStats();
      setStorageStats(stats);
      toast({ title: "E-books deleted" });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">Customize your experience</p>
          </div>
        </div>

        {/* Appearance */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sun className="w-4 h-4" /> Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <Label>Dark Mode</Label>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quran Font Size: {quranFontSize}px</Label>
            <Slider
              value={[quranFontSize]}
              onValueChange={handleFontSizeChange}
              min={16}
              max={42}
              step={2}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Type className="w-3 h-3" />
              Quran Font
            </Label>
            <Select value={quranFont} onValueChange={handleQuranFontChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Quran font" />
              </SelectTrigger>
              <SelectContent>
                {quranFontManager.getAvailableFonts().map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{font.name}</span>
                      <span className="text-xs text-muted-foreground">{font.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Prayer Settings */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Prayer Settings
          </h3>
          
          {/* Prayer Method Selector */}
          <PrayerMethodSelector />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Asr Calculation (Madhab)</Label>
            <Select value={madhab} onValueChange={(v) => handleMadhabChange(v as "shafi" | "hanafi")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shafi">Shafi'i / Maliki / Hanbali</SelectItem>
                <SelectItem value="hanafi">Hanafi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Time Format</Label>
            <Select value={timeFormat} onValueChange={(v) => handleTimeFormatChange(v as "12" | "24")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Adhan Settings */}
        <Card className="p-4 space-y-4">
          <AdhanSelector />
          <CustomAdhanUpload />
        </Card>

        {/* Audio Settings */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> Audio Settings
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Label>Salam Greeting</Label>
              <p className="text-xs text-muted-foreground">Play "Assalamu Alaikum" when app opens</p>
            </div>
            <Switch checked={salamGreetingEnabled} onCheckedChange={handleSalamGreetingToggle} />
          </div>
        </Card>

        {/* Storage & Backup */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Storage & Backup
          </h3>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Downloaded Books</span>
              <span className="font-medium">{storageStats.totalBooks}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">{formatFileSize(storageStats.totalSize)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />
              Backup
            </Button>
            <input 
              type="file" 
              accept=".json"
              ref={fileInputRef}
              onChange={handleRestore}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Restore
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleClearBooks} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Books
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearCache} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Preferences
          </h3>
          
          {!notificationsSupported ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Enable browser notifications to receive Islamic event reminders and daily spiritual content.
              </p>
              <Button 
                onClick={requestNotificationPermission}
                className="w-full"
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
              <Button
                onClick={handleTestNotification}
                className="w-full"
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                Test Notification
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleTestNotification}
                className="w-full"
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                Test Notification
              </Button>

              {/* Prayer Notifications */}
              <div className="space-y-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Prayer Reminders
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified at prayer times
                    </p>
                  </div>
                  <Switch
                    checked={prayerNotificationsEnabled}
                    onCheckedChange={handlePrayerNotificationToggle}
                    disabled={prayerNotificationsLoading}
                  />
                </div>

                {/* Prayer Notification Status */}
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  {prayerNotificationsEnabled ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                  <span className="text-xs">
                    {prayerNotificationsEnabled
                      ? `${scheduledPrayerCount} prayer reminders scheduled`
                      : 'Prayer reminders are disabled'}
                  </span>
                </div>

                {/* Prayer Notification Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshPrayerNotifications}
                    disabled={prayerNotificationsLoading}
                    className="flex-1"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                  
                  {prayerNotificationsEnabled && scheduledPrayerCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearPrayerNotifications}
                      className="flex-1"
                    >
                      <BellOff className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Uses system alarm to wake up device</p>
                  <p>• Works even when app is closed</p>
                  <p>• FOSS-friendly - no proprietary services</p>
                </div>
              </div>

              {/* Ramadan Countdowns */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    Ramadan Countdowns
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Daily reminders 30 days before Ramadan
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.ramadanCountdowns}
                  onCheckedChange={(checked) => handleNotificationToggle('ramadanCountdowns', checked)}
                />
              </div>

              {/* Eid Greetings */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Eid Greetings
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Festive notifications for Eid-ul-Fitr and Eid-ul-Adha
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.eidGreetings}
                  onCheckedChange={(checked) => handleNotificationToggle('eidGreetings', checked)}
                />
              </div>

              {/* Friday Surah Kahf */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Friday Surah Kahf
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Weekly reminder to read Surah Al-Kahf
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.fridayKahfReminders}
                  onCheckedChange={(checked) => handleNotificationToggle('fridayKahfReminders', checked)}
                />
              </div>

              {/* Daily Hadith */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    Daily Hadith
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Daily wisdom from the Prophet (PBUH)
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.dailyHadithNotifications}
                  onCheckedChange={(checked) => handleNotificationToggle('dailyHadithNotifications', checked)}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Notification History */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification History
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/notification-history')}
            >
              View All
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            View and manage your notification history from prayer times, Ramadan countdowns, and Islamic events.
          </p>
        </Card>

        {/* About */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-2">About Noor Connect</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            100% Free, Open Source & Privacy-focused. All data stored locally on your device. No accounts, no tracking, no ads.
          </p>
          <p className="text-xs text-center text-muted-foreground mt-3">
            FOSS • Made with ❤️ for the Ummah
          </p>
        </Card>

        {/* Contact & Support */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-3">Contact & Support</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = 'mailto:ubaid0345@proton.me'}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Developer
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                toast({
                  title: "JazakAllah Khair!",
                  description: "Your duas are the best support. May Allah accept them and reward you abundantly.",
                });
              }}
            >
              <HandHeart className="w-4 h-4 mr-2" />
              Make Dua for Me
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Your feedback and duas keep this project going
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
