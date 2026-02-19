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

        Uri fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (fallbackUri == null) {
            fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }

        if (fallbackUri == null) {
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

            mediaPlayer.setDataSource(getApplicationContext(), fallbackUri);
            mediaPlayer.prepareAsync();
            Log.d(TAG, "Playing fallback alarm tone for " + prayerName);
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

    private Notification createNotification(String prayerName) {
        Intent openIntent = new Intent(this, MainActivity.class);
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

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(prayerName + " Adhan")
                .setContentText("Noor Connect is playing adhan")
                .setSmallIcon(R.drawable.ic_notification)
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .addAction(0, "Stop", stopPendingIntent)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Adhan Playback",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Foreground playback channel for adhan alarms");
        channel.setSound(null, null);
        channel.enableVibration(false);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }
}
