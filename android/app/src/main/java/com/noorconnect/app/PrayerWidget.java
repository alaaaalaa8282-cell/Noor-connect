package com.noorconnect.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.RemoteViews;

import java.util.Calendar;

public class PrayerWidget extends AppWidgetProvider {

    private static final String TAG = "PrayerWidget";
    public static final String PREFS_NAME = "com.noorconnect.app.widget";
    public static final String KEY_PRAYER_NAME = "prayer_name";
    public static final String KEY_PRAYER_TIME = "prayer_time";
    public static final String KEY_TIME_REMAINING = "time_remaining";
    public static final String KEY_LOCATION = "location";
    public static final String KEY_LAST_UPDATE = "last_update";

    public static final String UPDATE_ACTION = "com.noorconnect.app.UPDATE_WIDGET";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        Log.d(TAG, "onUpdate called");
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        Log.d(TAG, "onReceive: " + action);

        if (UPDATE_ACTION.equals(action) ||
                Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_TIME_CHANGED.equals(action) ||
                Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {

            updateAllWidgets(context);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

        int[] smallIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, PrayerWidgetSmall.class));
        for (int id : smallIds) {
            updateAppWidget(context, appWidgetManager, id);
        }

        int[] mediumIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, PrayerWidgetMedium.class));
        for (int id : mediumIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String name = prefs.getString(KEY_PRAYER_NAME, null);
        String time = prefs.getString(KEY_PRAYER_TIME, null);
        String remaining = prefs.getString(KEY_TIME_REMAINING, null);
        String location = prefs.getString(KEY_LOCATION, "Unknown Location");

        // Night Pause Optimization Check
        if (isNightPause()) {
            Log.d(TAG, "Night pause active. Skipping heavy updates if necessary.");
            // We still update but might show "Next Prayer: Fajr" statically.
        }

        RemoteViews views;
        // Check which layout to use by inspecting the widget provider
        // Though simpler is to just know which class we are in, but this is a static
        // method.
        // We can get the info from AppWidgetManager
        android.appwidget.AppWidgetProviderInfo info = appWidgetManager.getAppWidgetInfo(appWidgetId);
        if (info != null && info.initialLayout == R.layout.prayer_widget_medium) {
            views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget_medium);
            views.setTextViewText(R.id.widget_location, location);
        } else {
            views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget_small);
        }

        if (name == null || time == null) {
            views.setTextViewText(R.id.widget_prayer_name, "Noor Connect");
            views.setTextViewText(R.id.widget_prayer_time, context.getString(R.string.widget_no_data));
            views.setTextViewText(R.id.widget_time_remaining, context.getString(R.string.widget_tap_to_setup));
        } else {
            views.setTextViewText(R.id.widget_prayer_name, name);
            views.setTextViewText(R.id.widget_prayer_time, time);
            views.setTextViewText(R.id.widget_time_remaining, remaining);
        }

        // Click Intent
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // You could add extras here to navigate to specific page
        // intent.putExtra("navigate", "prayer-times");
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        views.setOnClickPendingIntent(R.id.widget_prayer_name, pendingIntent);
        if (info != null && info.initialLayout == R.layout.prayer_widget_medium) {
            views.setOnClickPendingIntent(R.id.widget_right_section, pendingIntent);
        } else {
            views.setOnClickPendingIntent(R.id.widget_text_container, pendingIntent);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static boolean isNightPause() {
        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        // Pause heavy processing between 11 PM and 3 AM
        return (hour >= 23 || hour < 3);
    }
}
