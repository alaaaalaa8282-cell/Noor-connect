package com.noorconnect.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import java.util.HashSet;
import java.util.Set;

/**
 * Schedules exact alarm events for native adhan playback and persists them
 * so they can be restored after reboot.
 */
public final class NativeAdhanScheduler {
    private static final String TAG = "NativeAdhanScheduler";

    private static final String PREFS_NAME = "native_adhan_alarms";
    private static final String KEY_IDS = "alarm_ids";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_PREFIX_TIME = "time_";
    private static final String KEY_PREFIX_PRAYER = "prayer_";
    private static final String KEY_PREFIX_AUDIO = "audio_";

    private NativeAdhanScheduler() {
    }

    public static final class ScheduledAdhan {
        public final int id;
        public final long triggerAtMillis;
        public final String prayerName;
        public final String adhanUrl;

        public ScheduledAdhan(int id, long triggerAtMillis, String prayerName, String adhanUrl) {
            this.id = id;
            this.triggerAtMillis = triggerAtMillis;
            this.prayerName = prayerName;
            this.adhanUrl = adhanUrl;
        }
    }

    public static boolean isEnabled(Context context) {
        return getPrefs(context).getBoolean(KEY_ENABLED, true);
    }

    public static void setEnabled(Context context, boolean enabled) {
        getPrefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
        if (!enabled) {
            clearAll(context);
        }
    }

    public static int getScheduledCount(Context context) {
        return getStoredIds(context).size();
    }

    public static void scheduleAlarm(Context context, ScheduledAdhan alarm, boolean persist) {
        if (alarm.triggerAtMillis <= System.currentTimeMillis()) {
            removePersistedAlarm(context, alarm.id);
            return;
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            Log.e(TAG, "AlarmManager unavailable; cannot schedule adhan " + alarm.id);
            return;
        }

        PendingIntent pendingIntent = createPendingIntent(
                context,
                alarm.id,
                alarm.prayerName,
                alarm.adhanUrl
        );

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (canUseExactAlarms(alarmManager)) {
                    alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            alarm.triggerAtMillis,
                            pendingIntent
                    );
                } else {
                    alarmManager.setAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            alarm.triggerAtMillis,
                            pendingIntent
                    );
                }
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, alarm.triggerAtMillis, pendingIntent);
            }
        } catch (SecurityException exactAlarmError) {
            Log.w(TAG, "Exact alarm rejected, falling back to inexact alarm", exactAlarmError);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarm.triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, alarm.triggerAtMillis, pendingIntent);
            }
        }

        if (persist) {
            persistAlarm(context, alarm);
        }
    }

    public static void clearAll(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Set<String> ids = getStoredIds(context);

        for (String idString : ids) {
            int id;
            try {
                id = Integer.parseInt(idString);
            } catch (NumberFormatException e) {
                continue;
            }

            if (alarmManager != null) {
                PendingIntent pendingIntent = createPendingIntent(context, id, null, null);
                alarmManager.cancel(pendingIntent);
            }
        }

        clearPersistedAlarms(context);
        Log.d(TAG, "Cleared all native adhan alarms");
    }

    public static void removeAlarm(Context context, int alarmId) {
        removePersistedAlarm(context, alarmId);
    }

    public static void rescheduleAlarms(Context context) {
        Set<String> ids = getStoredIds(context);
        if (ids.isEmpty()) {
            return;
        }

        SharedPreferences prefs = getPrefs(context);
        long now = System.currentTimeMillis();

        for (String idString : ids) {
            int id;
            try {
                id = Integer.parseInt(idString);
            } catch (NumberFormatException e) {
                continue;
            }

            long triggerAt = prefs.getLong(KEY_PREFIX_TIME + id, -1L);
            if (triggerAt <= now) {
                removePersistedAlarm(context, id);
                continue;
            }

            String prayerName = prefs.getString(KEY_PREFIX_PRAYER + id, "Prayer");
            String adhanUrl = prefs.getString(KEY_PREFIX_AUDIO + id, "/audio/adhan-makkah.mp3");

            scheduleAlarm(
                    context,
                    new ScheduledAdhan(id, triggerAt, prayerName, adhanUrl),
                    false
            );
        }

        Log.d(TAG, "Rescheduled native adhan alarms after reboot/time change");
    }

    private static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static PendingIntent createPendingIntent(
            Context context,
            int alarmId,
            String prayerName,
            String adhanUrl
    ) {
        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);
        intent.putExtra(AdhanAlarmReceiver.EXTRA_ALARM_ID, alarmId);
        if (prayerName != null) {
            intent.putExtra(AdhanAlarmReceiver.EXTRA_PRAYER_NAME, prayerName);
        }
        if (adhanUrl != null) {
            intent.putExtra(AdhanAlarmReceiver.EXTRA_ADHAN_URL, adhanUrl);
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        return PendingIntent.getBroadcast(context, alarmId, intent, flags);
    }

    private static boolean canUseExactAlarms(AlarmManager alarmManager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true;
        }
        return alarmManager.canScheduleExactAlarms();
    }

    private static void persistAlarm(Context context, ScheduledAdhan alarm) {
        SharedPreferences prefs = getPrefs(context);
        Set<String> ids = getStoredIds(context);
        ids.add(String.valueOf(alarm.id));

        prefs.edit()
                .putStringSet(KEY_IDS, ids)
                .putLong(KEY_PREFIX_TIME + alarm.id, alarm.triggerAtMillis)
                .putString(KEY_PREFIX_PRAYER + alarm.id, alarm.prayerName)
                .putString(KEY_PREFIX_AUDIO + alarm.id, alarm.adhanUrl)
                .apply();
    }

    private static Set<String> getStoredIds(Context context) {
        SharedPreferences prefs = getPrefs(context);
        Set<String> ids = prefs.getStringSet(KEY_IDS, new HashSet<>());
        return new HashSet<>(ids);
    }

    private static void removePersistedAlarm(Context context, int alarmId) {
        SharedPreferences prefs = getPrefs(context);
        Set<String> ids = getStoredIds(context);
        ids.remove(String.valueOf(alarmId));

        prefs.edit()
                .putStringSet(KEY_IDS, ids)
                .remove(KEY_PREFIX_TIME + alarmId)
                .remove(KEY_PREFIX_PRAYER + alarmId)
                .remove(KEY_PREFIX_AUDIO + alarmId)
                .apply();
    }

    private static void clearPersistedAlarms(Context context) {
        SharedPreferences prefs = getPrefs(context);
        Set<String> ids = getStoredIds(context);

        SharedPreferences.Editor editor = prefs.edit();
        for (String idString : ids) {
            editor.remove(KEY_PREFIX_TIME + idString);
            editor.remove(KEY_PREFIX_PRAYER + idString);
            editor.remove(KEY_PREFIX_AUDIO + idString);
        }

        editor.remove(KEY_IDS).apply();
    }
}
