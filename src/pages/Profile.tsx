import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Moon, Sun, Download, Upload, Trash2, HardDrive, Calculator, Volume2, Bell, BellOff, Calendar, Heart, BookOpen, Mail, HandHeart, Type, MessageCircle, Globe, User, UserCircle, UserX, ShieldCheck, ShieldOff, Smartphone, AlertTriangle, RefreshCw } from "lucide-react";
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
import { AladhanAPI } from "@/lib/aladhan-api";
import { getStorageStats, clearAllBooks, formatFileSize, downloadBook, isBookDownloaded } from "@/lib/ebooks-storage";
import { downloadBackup, importBackup, clearCache, getQuranFontSize, setQuranFontSize } from "@/lib/backup";
import { isSalamGreetingEnabled, setSalamGreetingEnabled } from "@/components/SalamGreeting";
import { notificationManager, type NotificationPreferences } from "@/lib/notification-manager";
import { localNotifications } from "@/lib/local-notifications";
import { PrayerMethodSelector } from "@/components/PrayerMethodSelector";
import { quranFontManager, type QuranFont } from "@/lib/quran-font-manager";
import { unifiedNotifications } from "@/lib/unified-notifications";
import { getGenderSettings, setGender, type Gender } from "@/lib/gender-settings";
import { usePrayerAlarm } from "@/hooks/usePrayerAlarm";
import PermissionManager from "@/components/PermissionManager";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
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
  const [notifPermStatus, setNotifPermStatus] = useState<'loading' | 'granted' | 'denied' | 'default'>('loading');
  const [isCapacitorApp] = useState(() => !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  const [requestingPerm, setRequestingPerm] = useState(false);
  const [genderSettings, setGenderSettingsState] = useState(getGenderSettings());

  // Prayer alarm state
  const {
    isEnabled: isAlarmEnabled,
    isPlaying: isAlarmPlaying,
    currentPrayer,
    enableAlarm,
    disableAlarm,
    stopAdhan,
    testAdhan,
  } = usePrayerAlarm();

  const [reminderMinutes, setReminderMinutes] = useState('0');
  const [hijriOffset, setHijriOffset] = useState('0');
  // Prayer notification states
  const [prayerNotificationsEnabled, setPrayerNotificationsEnabled] = useState(false);
  const [prayerNotificationsLoading, setPrayerNotificationsLoading] = useState(true);
  const [scheduledPrayerCount, setScheduledPrayerCount] = useState(0);

  const refreshPermissionStatus = useCallback(async () => {
    const status = await unifiedNotifications.getPermissionStatus();
    setNotifPermStatus(status as 'granted' | 'denied' | 'default');
    setNotificationsSupported(status === 'granted');
  }, []);

  useEffect(() => {
    setIsDarkMode(getTheme() === "dark");
    setMadhabState(getMadhab());
    setTimeFormatState(getTimeFormat());
    setCalculationMethodState(getCalculationMethod());
    setQuranFontSizeState(getQuranFontSize());
    setQuranFontState(quranFontManager.getCurrentFont());
    setSalamGreetingEnabledState(isSalamGreetingEnabled());
    setGenderSettingsState(getGenderSettings());

    // Initialize Quran font manager
    quranFontManager.initialize();

    // Load notification preferences
    setNotificationPrefs(notificationManager.getPreferences());

    // Load reminder minutes
    const saved = localStorage.getItem('prayer-reminder-minutes');
    if (saved) setReminderMinutes(saved);

    const savedHijriOffset = localStorage.getItem('hijri-date-offset');
    if (savedHijriOffset) setHijriOffset(savedHijriOffset);

    // Improved notification support check for mobile
    refreshPermissionStatus();

    // Load prayer notification status
    checkPrayerNotificationStatus();

    // Load storage stats
    getStorageStats().then(setStorageStats);

    // Listen for gender settings changes
    const handleGenderSettingsUpdate = () => {
      setGenderSettingsState(getGenderSettings());
    };

    window.addEventListener('gender-settings-updated', handleGenderSettingsUpdate);

    return () => {
      window.removeEventListener('gender-settings-updated', handleGenderSettingsUpdate);
    };
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
    setRequestingPerm(true);
    try {
      const granted = await unifiedNotifications.requestPermission();
      await refreshPermissionStatus();
      await checkPrayerNotificationStatus();
      if (granted) {
        toast({ title: "✅ Notifications enabled!", description: "You'll now receive prayer times and Islamic event reminders." });
      } else {
        toast({
          title: "Permission denied",
          description: isCapacitorApp
            ? "Go to Android Settings → Apps → Noor Connect → Notifications and turn them on."
            : "Click the lock icon in your browser address bar and allow Notifications.",
          variant: "destructive"
        });
      }
    } finally {
      setRequestingPerm(false);
    }
  };

  const handleTestNotification = async () => {
    const result = await unifiedNotifications.testNotification();
    if (result.success) {
      toast({ title: "Test notification sent" });
    } else {
      toast({
        title: "Failed to send notification",
        description: "Please check your device notification settings.",
        variant: "destructive",
      });
    }
  };

  const checkPrayerNotificationStatus = async () => {
    try {
      const hasPermission = await localNotifications.areNotificationsEnabled();
      const enabledByPreference = localNotifications.arePrayerNotificationsEnabled();
      setPrayerNotificationsEnabled(hasPermission && enabledByPreference);

      if (hasPermission && enabledByPreference) {
        const scheduled = await localNotifications.getScheduledPrayerNotifications();
        setScheduledPrayerCount(scheduled.length);
      } else {
        setScheduledPrayerCount(0);
      }
    } catch (error) {
      console.error('Failed to check prayer notification status:', error);
    } finally {
      setPrayerNotificationsLoading(false);
    }
  };

  const handlePrayerNotificationToggle = async (enabled: boolean) => {
    setPrayerNotificationsLoading(true);
    try {
      if (enabled) {
        const hasPermission = await localNotifications.initialize();
        if (!hasPermission) {
          await localNotifications.setPrayerNotificationsEnabled(false);
          setPrayerNotificationsEnabled(false);
          setScheduledPrayerCount(0);
          toast({
            title: "Permission Denied",
            description: "Please enable notifications in your device settings",
            variant: "destructive",
          });
          return;
        }
      }

      await localNotifications.setPrayerNotificationsEnabled(enabled);
      await checkPrayerNotificationStatus();

      toast({
        title: enabled ? "Prayer Notifications Enabled" : "Prayer Notifications Disabled",
        description: enabled
          ? "Prayer reminders will be scheduled automatically"
          : "Prayer reminders have been cancelled",
      });
    } catch (error) {
      console.error("Failed to update prayer notification settings:", error);
      toast({
        title: "Update Failed",
        description: "Could not update prayer notification settings.",
        variant: "destructive",
      });
      await checkPrayerNotificationStatus();
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

  const handleBackup = async () => {
    toast({ title: "Preparing backup..." });
    await downloadBackup();
    toast({ title: "Backup downloaded" });
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({ title: "Restoring backup..." });
    const result = await importBackup(file);

    if (result.success && result.booksToDownload && result.booksToDownload.length > 0) {
      toast({
        title: "Restoring library...",
        description: `Downloading ${result.booksToDownload.length} books. This may take a while. Please do not close the app.`,
      });

      let downloadedCount = 0;
      for (const book of result.booksToDownload) {
        try {
          const isDownloaded = await isBookDownloaded(book.url);
          if (!isDownloaded) {
            await downloadBook(book);
          }
          downloadedCount++;
        } catch (err) {
          console.error(`Failed to download ${book.title}`, err);
        }
      }

      toast({
        title: "Library Restored",
        description: `Successfully processed ${downloadedCount}/${result.booksToDownload.length} books.`,
      });
    } else {
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    }

    if (result.success) {
      setTimeout(() => window.location.reload(), 1500);
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

  const handleGenderChange = (newGender: Gender) => {
    const updated = setGender(newGender);
    setGenderSettingsState(updated);

    toast({
      title: "Gender updated",
      description: newGender === "female"
        ? "Menstrual mode features are now available."
        : "Your preferences have been updated.",
    });
  };

  const handleReminderChange = (value: string) => {
    setReminderMinutes(value);
    localStorage.setItem('prayer-reminder-minutes', value);
  };

  const handleHijriOffsetChange = (value: string) => {
    setHijriOffset(value);
    localStorage.setItem('hijri-date-offset', value);
    AladhanAPI.clearCachedData();
    window.dispatchEvent(new Event('hijri-date-offset-changed'));
    const days = parseInt(value, 10);
    const sign = days > 0 ? '+' : '';
    toast({ title: `Hijri date offset updated`, description: `Offset is now ${sign}${days} day${Math.abs(days) !== 1 ? 's' : ''}` });
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
            <h1 className="text-xl font-bold text-foreground">{t('settings')}</h1>
            <p className="text-xs text-muted-foreground">{t('appTitle')}</p>
          </div>
        </div>

        {/* Appearance */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sun className="w-4 h-4" /> {t('appearance')}
          </h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              <Globe className="w-3 h-3" />
              {t('language')}
            </Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ar" | "ur")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="ur">Urdu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <Label>{t('darkMode')}</Label>
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

        {/* Gender Settings */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Information
          </h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select value={genderSettings.gender} onValueChange={(v: Gender) => handleGenderChange(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Man</span>
                  </div>
                </SelectItem>
                <SelectItem value="female">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    <span>Woman</span>
                  </div>
                </SelectItem>
                <SelectItem value="prefer-not-to-say">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4" />
                    <span>Prefer not to say</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {genderSettings.gender === "female"
                ? "Menstrual mode features are available for you."
                : "This helps us personalize your experience."}
            </p>
          </div>
        </Card>

        {/* Prayer Settings */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" /> {t('prayerSettings')}
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

          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <Moon className="w-3 h-3" />
              Hijri Date Adjustment
            </Label>
            <Select value={hijriOffset} onValueChange={handleHijriOffsetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-2">-2 Days</SelectItem>
                <SelectItem value="-1">-1 Day</SelectItem>
                <SelectItem value="0">0 Days (Auto)</SelectItem>
                <SelectItem value="1">+1 Day</SelectItem>
                <SelectItem value="2">+2 Days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Adjust the Islamic calendar if the moon sighting differs in your region.
            </p>
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
            <Volume2 className="w-4 h-4" /> {t('audioSettings')}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Label>Salam Greeting</Label>
              <p className="text-xs text-muted-foreground">Play "Assalamu Alaikum" when app opens</p>
            </div>
            <Switch checked={salamGreetingEnabled} onCheckedChange={handleSalamGreetingToggle} />
          </div>

          {/* Prayer Alarm Control */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-sm font-medium">Prayer Alarm (Adhan)</Label>
                <p className="text-xs text-muted-foreground">Play Adhan automatically at prayer times</p>
              </div>
              <Switch
                checked={isAlarmEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    enableAlarm();
                  } else {
                    disableAlarm();
                  }
                }}
              />
            </div>

            {isAlarmPlaying && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 animate-pulse mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary animate-bounce" />
                    <div>
                      <p className="text-sm font-medium text-primary">{currentPrayer} Time!</p>
                      <p className="text-xs text-muted-foreground">Adhan is playing...</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopAdhan}
                  >
                    Stop
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-xs text-muted-foreground">Pre-Prayer Reminder</Label>
                <p className="text-xs text-muted-foreground">Get notified before prayer time</p>
              </div>
              <Select value={reminderMinutes} onValueChange={handleReminderChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Off</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testAdhan}
                disabled={isAlarmPlaying}
                className="flex-1"
              >
                Test Adhan
              </Button>
            </div>
          </div>
        </Card>

        {/* Storage & Backup */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> {t('storageBackup')}
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

        {/* ── Notification Permission Banner ───────────────────────────── */}
        {notifPermStatus !== 'granted' && notifPermStatus !== 'loading' && (
          <Card className="p-0 overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              {isCapacitorApp ? (
                <Smartphone className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <Globe className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">
                  {isCapacitorApp ? 'App Notifications' : 'Browser Notifications'}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {notifPermStatus === 'denied'
                    ? isCapacitorApp
                      ? 'Permission was denied. Open Android Settings to re-enable.'
                      : 'Permission was blocked. Click the lock icon in your browser address bar.'
                    : isCapacitorApp
                      ? 'Allow Noor Connect to send prayer time alerts even when the app is closed.'
                      : 'Allow browser notifications for prayer reminders and Islamic event alerts.'}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notifPermStatus === 'denied' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                {notifPermStatus === 'denied'
                  ? <ShieldOff className="w-4 h-4 text-red-500" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
            </div>

            {/* What you'll get */}
            <div className="mx-4 mb-3 p-2.5 rounded-lg bg-background/60 border border-border/50">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">You will receive</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { emoji: '🕌', label: 'Prayer times (Fajr → Isha)' },
                  { emoji: '🌙', label: 'Ramadan & Eid reminders' },
                  { emoji: '📖', label: 'Friday Surah Al-Kahf alert' },
                  { emoji: '✨', label: 'Daily Hadith reminders' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-foreground">
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 pb-4 flex gap-2">
              {notifPermStatus === 'denied' ? (
                isCapacitorApp ? (
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: 'Open Android Settings',
                        description: 'Go to Settings → Apps → Noor Connect → Notifications → Allow.',
                      });
                    }}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Open Settings Guide
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: 'Unblock in browser',
                        description: 'Click the 🔒 lock icon in the address bar → Site Settings → Notifications → Allow.',
                      });
                    }}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    How to Unblock
                  </Button>
                )
              ) : (
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                  onClick={requestNotificationPermission}
                  disabled={requestingPerm}
                >
                  {requestingPerm ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  {isCapacitorApp ? 'Allow App Notifications' : 'Allow Browser Notifications'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPermissionStatus}
                className="shrink-0"
                title="Refresh permission status"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Permission Management */}
        <PermissionManager className="mt-4" />

        {/* Notification Preferences */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('notificationPreferences')}
          </h3>

          {!notificationsSupported ? (
            <div className="space-y-3 text-center py-3">
              <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <BellOff className="w-5 h-5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Grant notification permission above to unlock these settings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('prayerNotifications')}</Label>
                  <p className="text-xs text-muted-foreground">Receive reminders for daily prayer times</p>
                </div>
                <Switch
                  checked={prayerNotificationsEnabled}
                  onCheckedChange={handlePrayerNotificationToggle}
                  disabled={prayerNotificationsLoading}
                />
              </div>

              {prayerNotificationsEnabled && scheduledPrayerCount > 0 && (
                <div className="flex items-center justify-between bg-background/50 p-2 rounded-md border border-border/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium">{scheduledPrayerCount} {t('upcoming')}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshPrayerNotifications}>
                      <Calculator className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleClearPrayerNotifications}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t border-border/50 my-2 pt-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Islamic Events</Label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">{t('ramadanCountdown')}</Label>
                    </div>
                    <Switch
                      checked={notificationPrefs.ramadanCountdowns}
                      onCheckedChange={(v) => handleNotificationToggle('ramadanCountdowns', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">{t('eidGreetings')}</Label>
                    </div>
                    <Switch
                      checked={notificationPrefs.eidGreetings}
                      onCheckedChange={(v) => handleNotificationToggle('eidGreetings', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">{t('fridayKahfReminder')}</Label>
                    </div>
                    <Switch
                      checked={notificationPrefs.fridayKahfReminders}
                      onCheckedChange={(v) => handleNotificationToggle('fridayKahfReminders', v)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 my-2 pt-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 block">Daily Reminders</Label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('dailyHadith')}</Label>
                    <Switch
                      checked={notificationPrefs.dailyHadithNotifications}
                      onCheckedChange={(v) => handleNotificationToggle('dailyHadithNotifications', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('morningReminders')}</Label>
                    <Switch
                      checked={notificationPrefs.morningReminders}
                      onCheckedChange={(v) => handleNotificationToggle('morningReminders', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('eveningReminders')}</Label>
                    <Switch
                      checked={notificationPrefs.eveningReminders}
                      onCheckedChange={(v) => handleNotificationToggle('eveningReminders', v)}
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleTestNotification}
              >
                {t('testNotification')}
              </Button>
            </div>
          )}
        </Card>

        {/* Notification History */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('notificationHistory')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/notification-history')}
            >
              {t('viewAll')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('notificationHistoryDesc')}
          </p>
        </Card>

        {/* About */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-2">{t('about')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            100% Free, Open Source & Privacy-focused. All data stored locally on your device. No accounts, no tracking, no ads.
          </p>
          <p className="text-xs text-center text-muted-foreground mt-3">
            FOSS - Made with love for the Ummah
          </p>
        </Card>

        {/* Contact & Support */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-3">{t('contactSupport')}</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = 'mailto:ubaid0345@proton.me'}
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('contactDeveloper')}
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
              {t('makeDua')}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-[#5865F2] hover:text-[#5865F2] hover:bg-[#5865F2]/10 border-[#5865F2]/20"
              onClick={() => window.open('https://discord.gg/DNChmZWk5k', '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('joinDiscord')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
