package com.noorconnect.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Receives exact alarm events and starts native adhan playback service.
 */
public class AdhanAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AdhanAlarmReceiver";

    public static final String ACTION_TRIGGER = "com.noorconnect.app.ACTION_ADHAN_TRIGGER";
    public static final String EXTRA_ALARM_ID = "alarmId";
    public static final String EXTRA_PRAYER_NAME = "prayerName";
    public static final String EXTRA_ADHAN_URL = "adhanUrl";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_TRIGGER.equals(intent.getAction())) {
            return;
        }

        if (!NativeAdhanScheduler.isEnabled(context)) {
            Log.d(TAG, "Native adhan playback disabled; skipping trigger");
            return;
        }

        int alarmId = intent.getIntExtra(EXTRA_ALARM_ID, -1);
        String prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME);
        String adhanUrl = intent.getStringExtra(EXTRA_ADHAN_URL);

        if (alarmId > -1) {
            NativeAdhanScheduler.removeAlarm(context, alarmId);
        }

        Intent playbackIntent = new Intent(context, AdhanPlaybackService.class);
        playbackIntent.setAction(AdhanPlaybackService.ACTION_PLAY);
        playbackIntent.putExtra(EXTRA_ALARM_ID, alarmId);
        playbackIntent.putExtra(EXTRA_PRAYER_NAME, prayerName);
        playbackIntent.putExtra(EXTRA_ADHAN_URL, adhanUrl);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(playbackIntent);
            } else {
                context.startService(playbackIntent);
            }
            Log.d(TAG, "Started adhan playback service for " + prayerName);
        } catch (Exception serviceError) {
            Log.e(TAG, "Failed to start adhan playback service", serviceError);
        }
    }
}
