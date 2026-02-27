package com.noorconnect.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Foreground service that plays adhan audio when native alarms fire.
 */
public class AdhanPlaybackService extends Service {
    private static final String TAG = "AdhanPlaybackService";

    public static final String ACTION_PLAY = "com.noorconnect.app.ACTION_ADHAN_PLAY";
    public static final String ACTION_STOP = "com.noorconnect.app.ACTION_ADHAN_STOP";

    private static final String CHANNEL_ID = "adhan_playback_channel";
    private static final int NOTIFICATION_ID = 2102;
    private static final String DEFAULT_ADHAN_URL = "/audio/adhan-makkah.mp3";

    private MediaPlayer mediaPlayer;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_PLAY;

        if (ACTION_STOP.equals(action)) {
            stopPlayback();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        String prayerName = intent != null
                ? intent.getStringExtra(AdhanAlarmReceiver.EXTRA_PRAYER_NAME)
                : "Prayer";
        if (prayerName == null || prayerName.trim().isEmpty()) {
            prayerName = "Prayer";
        }

        String adhanUrl = intent != null
                ? intent.getStringExtra(AdhanAlarmReceiver.EXTRA_ADHAN_URL)
                : DEFAULT_ADHAN_URL;
        if (adhanUrl == null || adhanUrl.trim().isEmpty()) {
            adhanUrl = DEFAULT_ADHAN_URL;
        }

        startForeground(NOTIFICATION_ID, createNotification(prayerName));

        // Release the WakeLock now that startForeground() has been called.
        // This closes the Doze race-condition window opened by AdhanAlarmReceiver.
        AdhanAlarmReceiver.releaseWakeLock();

        playAdhan(adhanUrl, prayerName);

        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }

    private void playAdhan(String adhanUrl, String prayerName) {
        stopPlayback();

        String dataSource = resolveAdhanDataSource(adhanUrl);
        mediaPlayer = new MediaPlayer();

        try {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);

            mediaPlayer.setOnPreparedListener(MediaPlayer::start);
            mediaPlayer.setOnCompletionListener(mp -> {
                stopPlayback();
                stopForeground(true);
                stopSelf();
            });
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "Adhan media playback error what=" + what + " extra=" + extra);
                stopPlayback();
                stopForeground(true);
                stopSelf();
                return true;
            });

            mediaPlayer.setDataSource(dataSource);
            mediaPlayer.prepareAsync();
            Log.d(TAG, "Playing " + prayerName + " adhan from " + dataSource);
        } catch (Exception playbackError) {
            Log.e(TAG, "Failed to play adhan from " + dataSource, playbackError);
            playFallbackAlarmTone(prayerName);
        }
    }

    private void playFallbackAlarmTone(String prayerName) {
        stopPlayback();

        // First try the adhan file bundled in res/raw/
        Uri rawUri = Uri.parse(
                "android.resource://" + getPackageName() + "/" + R.raw.adhan_makkah);

        if (rawUri == null) {
            // Last-resort: system alarm tone
            rawUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        }
        if (rawUri == null) {
            rawUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        if (rawUri == null) {
            stopForeground(true);
            stopSelf();
            return;
        }

        mediaPlayer = new MediaPlayer();
        try {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setOnPreparedListener(MediaPlayer::start);
            mediaPlayer.setOnCompletionListener(mp -> {
                stopPlayback();
                stopForeground(true);
                stopSelf();
            });
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "Fallback tone failed what=" + what + " extra=" + extra);
                stopPlayback();
                stopForeground(true);
                stopSelf();
                return true;
            });

            mediaPlayer.setDataSource(getApplicationContext(), rawUri);
            mediaPlayer.prepareAsync();
            Log.d(TAG, "Playing fallback adhan from res/raw for " + prayerName);
        } catch (Exception fallbackError) {
            Log.e(TAG, "Failed to play fallback alarm tone", fallbackError);
            stopPlayback();
            stopForeground(true);
            stopSelf();
        }
    }

    private void stopPlayback() {
        if (mediaPlayer == null) {
            return;
        }

        try {
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.stop();
            }
        } catch (IllegalStateException ignored) {
            // Ignore invalid player state on shutdown.
        }

        mediaPlayer.reset();
        mediaPlayer.release();
        mediaPlayer = null;
    }

    private String resolveAdhanDataSource(String adhanUrl) {
        if (adhanUrl == null || adhanUrl.trim().isEmpty()) {
            return "file:///android_asset/public" + DEFAULT_ADHAN_URL;
        }

        String normalized = adhanUrl.trim();
        if (normalized.startsWith("file://")
                || normalized.startsWith("http://")
                || normalized.startsWith("https://")) {
            return normalized;
        }

        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }

        return "file:///android_asset/public" + normalized;
    }

    private String getPrayerEmoji(String prayerName) {
        if (prayerName == null)
            return "🕌";
        switch (prayerName.toLowerCase()) {
            case "fajr":
                return "🌅";
            case "dhuhr":
                return "☀️";
            case "asr":
                return "🌤️";
            case "maghrib":
                return "🌇";
            case "isha":
                return "🌙";
            default:
                return "🕌";
        }
    }

    private String getPrayerArabic(String prayerName) {
        if (prayerName == null)
            return "الصلاة";
        switch (prayerName.toLowerCase()) {
            case "fajr":
                return "صلاة الفجر";
            case "dhuhr":
                return "صلاة الظهر";
            case "asr":
                return "صلاة العصر";
            case "maghrib":
                return "صلاة المغرب";
            case "isha":
                return "صلاة العشاء";
            default:
                return "الصلاة";
        }
    }

    private Notification createNotification(String prayerName) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int openFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        int stopFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            openFlags |= PendingIntent.FLAG_IMMUTABLE;
            stopFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, openIntent, openFlags);

        Intent stopIntent = new Intent(this, AdhanPlaybackService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(this, 1, stopIntent, stopFlags);

        String emoji = getPrayerEmoji(prayerName);
        String arabic = getPrayerArabic(prayerName);
        String currentTime = new SimpleDateFormat("h:mm a", Locale.getDefault()).format(new Date());

        // Rich expanded text shown in BigText style
        String bigText = arabic + "\n"
                + "It is time to pray " + prayerName + ".\n"
                + "\"Hayya 'ala as-Salah — Come to Prayer\"\n"
                + "Tap to open Noor Connect ✦ " + currentTime;

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(emoji + " " + prayerName + " Prayer Time")
                .setContentText(arabic + " — " + currentTime)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(bigText)
                        .setBigContentTitle(emoji + " " + prayerName + " Prayer — " + currentTime)
                        .setSummaryText("Noor Connect 🕌"))
                .setSmallIcon(R.drawable.ic_notification)
                .setColor(0xFF22C55E) // Green accent
                .setColorized(true)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setAutoCancel(false)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .addAction(R.drawable.ic_notification, "⏹ Stop Adhan", stopPendingIntent)
                .addAction(R.drawable.ic_notification, "🕌 Open App", contentIntent)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Adhan & Prayer Alerts",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription(
                "Shows rich prayer-time notifications and plays the adhan. Disable sound here — the adhan audio is played separately.");
        channel.setSound(null, null);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 250, 150, 250 });
        channel.setShowBadge(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}
