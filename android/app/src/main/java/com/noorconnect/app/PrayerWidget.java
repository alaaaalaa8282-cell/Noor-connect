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

import org.json.JSONObject;
import java.util.Calendar;

public class PrayerWidget extends AppWidgetProvider {

    private static final String TAG = "PrayerWidget";
    public static final String PREFS_NAME = "com.noorconnect.app.widget";

    // Basic prayer keys (existing)
    public static final String KEY_PRAYER_NAME = "prayer_name";
    public static final String KEY_PRAYER_TIME = "prayer_time";
    public static final String KEY_TIME_REMAINING = "time_remaining";
    public static final String KEY_LOCATION = "location";
    public static final String KEY_LAST_UPDATE = "last_update";

    // New enriched keys
    public static final String KEY_HIJRI_DATE = "hijri_date";
    public static final String KEY_CURRENT_TIME = "current_time";

    // All-5-prayer keys
    public static final String KEY_FAJR_TIME = "fajr_time";
    public static final String KEY_DHUHR_TIME = "dhuhr_time";
    public static final String KEY_ASR_TIME = "asr_time";
    public static final String KEY_MAGHRIB_TIME = "maghrib_time";
    public static final String KEY_ISHA_TIME = "isha_time";
    // Prayer statuses: "passed" | "active" | "upcoming"
    public static final String KEY_FAJR_STATUS = "fajr_status";
    public static final String KEY_DHUHR_STATUS = "dhuhr_status";
    public static final String KEY_ASR_STATUS = "asr_status";
    public static final String KEY_MAGHRIB_STATUS = "maghrib_status";
    public static final String KEY_ISHA_STATUS = "isha_status";

    // "Dumb widget" — pre-localised JSON payload from React
    public static final String KEY_WIDGET_STRINGS = "widget_strings";

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
        if (UPDATE_ACTION.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            updateAllWidgets(context);
        }
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);

        int[] smallIds = mgr.getAppWidgetIds(new ComponentName(context, PrayerWidgetSmall.class));
        int[] mediumIds = mgr.getAppWidgetIds(new ComponentName(context, PrayerWidgetMedium.class));
        int[] largeIds = mgr.getAppWidgetIds(new ComponentName(context, PrayerWidgetLarge.class));

        for (int id : smallIds)
            updateAppWidget(context, mgr, id);
        for (int id : mediumIds)
            updateAppWidget(context, mgr, id);
        for (int id : largeIds)
            updateAppWidget(context, mgr, id);
    }

    public static void updateAppWidget(Context context, AppWidgetManager mgr, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String name = prefs.getString(KEY_PRAYER_NAME, null);
        String time = prefs.getString(KEY_PRAYER_TIME, null);
        String remaining = prefs.getString(KEY_TIME_REMAINING, "");
        String location = prefs.getString(KEY_LOCATION, context.getString(R.string.widget_location_default));
        String hijriDate = prefs.getString(KEY_HIJRI_DATE, context.getString(R.string.widget_hijri_default));
        String currentTime = prefs.getString(KEY_CURRENT_TIME, "");

        // Parse the "dumb widget" JSON payload from React
        JSONObject widgetStrings;
        try {
            widgetStrings = new JSONObject(prefs.getString(KEY_WIDGET_STRINGS, "{}"));
        } catch (Exception e) {
            widgetStrings = new JSONObject();
        }

        // All-5 prayer data
        String fajrTime = prefs.getString(KEY_FAJR_TIME, "—");
        String dhuhrTime = prefs.getString(KEY_DHUHR_TIME, "—");
        String asrTime = prefs.getString(KEY_ASR_TIME, "—");
        String maghribTime = prefs.getString(KEY_MAGHRIB_TIME, "—");
        String ishaTime = prefs.getString(KEY_ISHA_TIME, "—");

        String fajrStatus = prefs.getString(KEY_FAJR_STATUS, "upcoming");
        String dhuhrStatus = prefs.getString(KEY_DHUHR_STATUS, "upcoming");
        String asrStatus = prefs.getString(KEY_ASR_STATUS, "upcoming");
        String maghribStatus = prefs.getString(KEY_MAGHRIB_STATUS, "active");
        String ishaStatus = prefs.getString(KEY_ISHA_STATUS, "upcoming");

        // Determine which layout this widget uses
        android.appwidget.AppWidgetProviderInfo info = mgr.getAppWidgetInfo(appWidgetId);

        // Use widget class name as fallback if info is null
        String widgetClassName = null;
        if (info != null && info.provider != null) {
            widgetClassName = info.provider.getClassName();
        }

        Log.d(TAG, "Updating widget ID " + appWidgetId + " (class: " + widgetClassName + ")");

        RemoteViews views;

        // Determine widget type by class name for reliability
        boolean isLarge = widgetClassName != null && widgetClassName.contains("PrayerWidgetLarge");
        boolean isMedium = widgetClassName != null && widgetClassName.contains("PrayerWidgetMedium");
        boolean isSmall = widgetClassName != null && widgetClassName.contains("PrayerWidgetSmall");

        // Fallback to layout check if class name detection fails
        if (info != null) {
            if (info.initialLayout == R.layout.prayer_widget_large)
                isLarge = true;
            else if (info.initialLayout == R.layout.prayer_widget_medium)
                isMedium = true;
            else if (info.initialLayout == R.layout.prayer_widget_small)
                isSmall = true;
        }

        if (isLarge) {
            // ──────── LARGE widget ────────
            views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget_large);

            // Header
            views.setTextViewText(R.id.widget_hijri_date,
                    hijriDate.isEmpty() ? context.getString(R.string.widget_hijri_default) : hijriDate);
            if (!currentTime.isEmpty()) {
                views.setTextViewText(R.id.widget_clock, currentTime);
            }

            // Prayer labels — read from the JSON payload sent by React
            views.setTextViewText(R.id.label_fajr, widgetStrings.optString("fajr", "Fajr"));
            views.setTextViewText(R.id.label_dhuhr, widgetStrings.optString("dhuhr", "Dhuhr"));
            views.setTextViewText(R.id.label_asr, widgetStrings.optString("asr", "Asr"));
            views.setTextViewText(R.id.label_maghrib, widgetStrings.optString("maghrib", "Maghrib"));
            views.setTextViewText(R.id.label_isha, widgetStrings.optString("isha", "Isha"));

            // Prayer times
            views.setTextViewText(R.id.time_fajr, fajrTime);
            views.setTextViewText(R.id.time_dhuhr, dhuhrTime);
            views.setTextViewText(R.id.time_asr, asrTime);
            views.setTextViewText(R.id.time_maghrib, maghribTime);
            views.setTextViewText(R.id.time_isha, ishaTime);

            // Dots
            views.setImageViewResource(R.id.dot_fajr, dotDrawable(fajrStatus));
            views.setImageViewResource(R.id.dot_dhuhr, dotDrawable(dhuhrStatus));
            views.setImageViewResource(R.id.dot_asr, dotDrawable(asrStatus));
            views.setImageViewResource(R.id.dot_maghrib, dotDrawable(maghribStatus));
            views.setImageViewResource(R.id.dot_isha, dotDrawable(ishaStatus));

            // Active row highlight
            highlightActiveRow(views, fajrStatus, dhuhrStatus, asrStatus, maghribStatus, ishaStatus);

            // Footer
            views.setTextViewText(R.id.widget_location,
                    location.isEmpty() ? context.getString(R.string.widget_location_default) : location);
            views.setTextViewText(R.id.widget_time_remaining,
                    remaining.isEmpty() ? context.getString(R.string.widget_time_remaining_default) : remaining);

        } else if (isMedium) {
            // ──────── MEDIUM widget ────────
            views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget_medium);

            views.setTextViewText(R.id.widget_location,
                    location.isEmpty() ? context.getString(R.string.widget_location_default) : location);
            views.setTextViewText(R.id.widget_hijri_date,
                    hijriDate.isEmpty() ? context.getString(R.string.widget_hijri_default) : hijriDate);
            views.setTextViewText(R.id.widget_prayer_name, name != null ? name : "Noor Connect");
            views.setTextViewText(R.id.widget_prayer_time,
                    time != null ? time : context.getString(R.string.widget_time_default));
            views.setTextViewText(R.id.widget_time_remaining,
                    remaining.isEmpty() ? context.getString(R.string.widget_time_remaining_default) : remaining);

            // Dots
            views.setImageViewResource(R.id.dot_fajr, dotDrawable(fajrStatus));
            views.setImageViewResource(R.id.dot_dhuhr, dotDrawable(dhuhrStatus));
            views.setImageViewResource(R.id.dot_asr, dotDrawable(asrStatus));
            views.setImageViewResource(R.id.dot_maghrib, dotDrawable(maghribStatus));
            views.setImageViewResource(R.id.dot_isha, dotDrawable(ishaStatus));

        } else {
            // ──────── SMALL widget (default) ────────
            views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget_small);
            views.setTextViewText(R.id.widget_prayer_name, name != null ? name : "Noor Connect");
            views.setTextViewText(R.id.widget_prayer_time,
                    time != null ? time : context.getString(R.string.widget_time_default));
            views.setTextViewText(R.id.widget_time_remaining,
                    remaining.isEmpty() ? context.getString(R.string.widget_time_remaining_default) : remaining);
        }

        // ──── Tap intent: open app ────
        Intent tapIntent = new Intent(context, MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Set click listener based on widget type
        int clickViewId;
        if (isLarge) {
            clickViewId = R.id.widget_header; // Use header for large widget
        } else if (isMedium) {
            clickViewId = R.id.widget_root; // Use root for medium widget
        } else {
            clickViewId = R.id.widget_root; // Use root for small widget
        }
        views.setOnClickPendingIntent(clickViewId, pendingIntent);

        mgr.updateAppWidget(appWidgetId, views);
    }

    // ──── Helpers ────

    private static int dotDrawable(String status) {
        switch (status) {
            case "active":
                return R.drawable.widget_dot_active;
            case "passed":
                return R.drawable.widget_dot_passed;
            default:
                return R.drawable.widget_dot_upcoming;
        }
    }

    /**
     * Apply gold highlight background to the active prayer row in the large widget.
     * All other rows get a transparent background.
     */
    private static void highlightActiveRow(RemoteViews views,
            String fajrS, String dhuhrS,
            String asrS, String maghribS, String ishaS) {
        int transparent = android.R.color.transparent;
        int goldBg = R.drawable.widget_row_active;

        views.setInt(R.id.row_fajr, "setBackgroundResource", "active".equals(fajrS) ? goldBg : transparent);
        views.setInt(R.id.row_dhuhr, "setBackgroundResource", "active".equals(dhuhrS) ? goldBg : transparent);
        views.setInt(R.id.row_asr, "setBackgroundResource", "active".equals(asrS) ? goldBg : transparent);
        views.setInt(R.id.row_maghrib, "setBackgroundResource", "active".equals(maghribS) ? goldBg : transparent);
        views.setInt(R.id.row_isha, "setBackgroundResource", "active".equals(ishaS) ? goldBg : transparent);

        // Text color adjustment: active row → dark text, others → light text
        int darkText = android.graphics.Color.parseColor("#1A1A1A");
        int lightText = android.graphics.Color.parseColor("#D1FAE5");
        setRowTextColor(views, R.id.label_fajr, R.id.time_fajr, "active".equals(fajrS), darkText, lightText);
        setRowTextColor(views, R.id.label_dhuhr, R.id.time_dhuhr, "active".equals(dhuhrS), darkText, lightText);
        setRowTextColor(views, R.id.label_asr, R.id.time_asr, "active".equals(asrS), darkText, lightText);
        setRowTextColor(views, R.id.label_maghrib, R.id.time_maghrib, "active".equals(maghribS), darkText, lightText);
        setRowTextColor(views, R.id.label_isha, R.id.time_isha, "active".equals(ishaS), darkText, lightText);
    }

    private static void setRowTextColor(RemoteViews views,
            int labelId, int timeId,
            boolean isActive, int darkColor, int lightColor) {
        int labelColor = isActive ? darkColor : lightColor;
        int timeColor = isActive ? darkColor : android.graphics.Color.parseColor("#F59E0B");
        views.setTextColor(labelId, labelColor);
        views.setTextColor(timeId, timeColor);
    }

    private static boolean isNightPause() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        return (hour >= 23 || hour < 3);
    }
}
