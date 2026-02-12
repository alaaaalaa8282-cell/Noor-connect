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
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {

            Log.d(TAG, "Boot completed, starting Noor Connect service");

            // Start the foreground service
            Intent serviceIntent = new Intent(context, NoorConnectService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // Update widgets
            PrayerWidget.updateAllWidgets(context);

            Log.d(TAG, "Service started and widgets updated");
        }
    }
}
