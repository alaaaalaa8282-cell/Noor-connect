package com.noorconnect.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Receives BOOT_COMPLETED and system time/timezone changes.
 *
 * Instead of starting a persistent foreground service (which drains battery
 * and shows an annoying notification), we follow the Muslim Pro approach:
 * - Reschedule native adhan alarms (setAlarmClock)
 * - Update home-screen widgets
 *
 * The alarms themselves are Doze-immune (setAlarmClock), so no persistent
 * service is needed to keep them alive.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {

            Log.d(TAG, "System event received (" + action + "), restoring alarms & widgets");

            // Restore native adhan alarms (setAlarmClock — Doze immune)
            NativeAdhanScheduler.rescheduleAlarms(context);

            // Update home-screen widgets
            PrayerWidget.updateAllWidgets(context);

            Log.d(TAG, "Adhan alarms rescheduled, widgets updated (no persistent service needed)");
        }
    }
}
