package com.noorconnect.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * Receives BOOT_COMPLETED broadcast and starts the foreground service
 * Ensures app runs in background immediately after phone boots
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

            Log.d(TAG, "System event received (" + action + "), restoring background tasks");

            // Start the foreground service
            Intent serviceIntent = new Intent(context, NoorConnectService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // Update widgets
            PrayerWidget.updateAllWidgets(context);

            // Restore native adhan alarms after reboot/time changes.
            NativeAdhanScheduler.rescheduleAlarms(context);

            Log.d(TAG, "Service started, widgets updated, native adhan alarms restored");
        }
    }
}
