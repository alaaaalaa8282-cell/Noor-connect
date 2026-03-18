package com.noorconnect.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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

            // Ensure widget has default values if no data exists
            initializeWidgetDefaults(context);

            // Update home-screen widgets
            PrayerWidget.updateAllWidgets(context);
            QuranVerseWidget.updateAllWidgets(context);

            Log.d(TAG, "Adhan alarms rescheduled, widgets updated (no persistent service needed)");
        }
    }

    /**
     * Initialize widget with default values if no data exists yet.
     * This ensures widgets show something meaningful even before the app is opened.
     * 
     * NOTE: We intentionally leave prayer names empty so the widget uses its
     * default string resources, which are properly localized. The React app
     * will populate localized strings via setWidgetStrings on first launch.
     */
    private void initializeWidgetDefaults(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PrayerWidget.PREFS_NAME, Context.MODE_PRIVATE);

        // Only initialize if no prayer data exists
        if (prefs.getString(PrayerWidget.KEY_PRAYER_NAME, null) == null) {
            Log.d(TAG, "Initializing widget with default values");

            SharedPreferences.Editor editor = prefs.edit();

            // Use default string resources for localization support
            editor.putString(PrayerWidget.KEY_PRAYER_NAME,
                    context.getString(R.string.widget_no_data));
            editor.putString(PrayerWidget.KEY_PRAYER_TIME, "18:30");
            editor.putString(PrayerWidget.KEY_TIME_REMAINING,
                    context.getString(R.string.widget_time_remaining_default));
            editor.putString(PrayerWidget.KEY_LOCATION, context.getString(R.string.widget_location_default));
            editor.putString(PrayerWidget.KEY_HIJRI_DATE, context.getString(R.string.widget_hijri_default));

            // Default prayer times
            editor.putString(PrayerWidget.KEY_FAJR_TIME, "05:00");
            editor.putString(PrayerWidget.KEY_DHUHR_TIME, "12:30");
            editor.putString(PrayerWidget.KEY_ASR_TIME, "15:45");
            editor.putString(PrayerWidget.KEY_MAGHRIB_TIME, "18:30");
            editor.putString(PrayerWidget.KEY_ISHA_TIME, "20:00");

            // Default statuses (all upcoming except Maghrib which is active in the evening)
            editor.putString(PrayerWidget.KEY_FAJR_STATUS, "upcoming");
            editor.putString(PrayerWidget.KEY_DHUHR_STATUS, "upcoming");
            editor.putString(PrayerWidget.KEY_ASR_STATUS, "upcoming");
            editor.putString(PrayerWidget.KEY_MAGHRIB_STATUS, "active");
            editor.putString(PrayerWidget.KEY_ISHA_STATUS, "upcoming");

            // Leave widget strings empty - React app will populate with localized strings
            // via setWidgetStrings() on first launch
            editor.putString(PrayerWidget.KEY_WIDGET_STRINGS, "{}");

            editor.apply();
            Log.d(TAG, "Widget defaults initialized");
        }
    }
}
