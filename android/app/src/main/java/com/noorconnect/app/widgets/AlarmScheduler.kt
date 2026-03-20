package com.noorconnect.app.widgets

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONObject

/**
 * Schedules exact alarms to fire at the next prayer time,
 * triggering a widget refresh via WidgetAlarmReceiver.
 *
 * Falls back to inexact alarms if SCHEDULE_EXACT_ALARM is denied on API 31+.
 */
object AlarmScheduler {

    private const val TAG = "AlarmScheduler"
    private const val ACTION_WIDGET_REFRESH =
        "com.noorconnect.app.WIDGET_PRAYER_REFRESH"

    fun scheduleNextPrayerAlarm(context: Context, prayerDataJson: String) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE)
                as? AlarmManager ?: return

            val data = JSONObject(prayerDataJson)
            val prayers = data.getJSONArray("prayers")
            val now = System.currentTimeMillis()

            // Find the first prayer with time > now
            var triggerAtMs: Long = -1L
            for (i in 0 until prayers.length()) {
                val prayerTime = prayers.getJSONObject(i).getLong("time")
                if (prayerTime > now) {
                    triggerAtMs = prayerTime
                    break
                }
            }

            // If all prayers have passed, schedule for first prayer tomorrow (+24h)
            if (triggerAtMs == -1L && prayers.length() > 0) {
                triggerAtMs = prayers.getJSONObject(0).getLong("time") + 86_400_000L
            }

            if (triggerAtMs <= now) return

            val intent = Intent(context, WidgetAlarmReceiver::class.java)
                .setAction(ACTION_WIDGET_REFRESH)
            val pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            // Cancel existing alarm before setting new one
            alarmManager.cancel(pendingIntent)

            // IMPORTANT: SCHEDULE_EXACT_ALARM is denied by default on API 34+
            // for non-calendar/alarm apps. Always check before using exact alarms.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent
                    )
                } else {
                    // Permission not granted — inexact but battery-safe fallback.
                    // ~15 min accuracy is acceptable; WorkManager covers the gap.
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent
                    )
                    Log.d(TAG,
                        "Exact alarms not permitted — using inexact fallback")
                }
            } else {
                // API 24–30: no permission check needed
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent
                )
            }

            Log.d(TAG, "Scheduled widget alarm at $triggerAtMs")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule alarm", e)
        }
    }

    fun cancelAllAlarms(context: Context) {
        try {
            val intent = Intent(context, WidgetAlarmReceiver::class.java)
                .setAction(ACTION_WIDGET_REFRESH)
            val pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            (context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager)
                ?.cancel(pendingIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to cancel alarms", e)
        }
    }
}
