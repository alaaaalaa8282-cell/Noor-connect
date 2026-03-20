package com.noorconnect.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.noorconnect.app.MainActivity
import com.noorconnect.app.R
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Next Adhan Widget (2×2)
 * Shows the next prayer name, countdown timer, and a progress bar.
 */
class NextAdhanWidget : AppWidgetProvider() {

    companion object {
        private const val TAG = "NextAdhanWidget"
        private const val WORK_TAG = "noor_widget_periodic"

        fun updateWidget(
            context: Context,
            mgr: AppWidgetManager,
            id: Int
        ) {
            val rv = RemoteViews(context.packageName, R.layout.widget_next_adhan)
            val prefs = context.getSharedPreferences(
                "NoorConnectWidgetPrefs", Context.MODE_PRIVATE
            )
            val json = prefs.getString("widget_prayer_data", null)

            if (json == null) {
                rv.setViewVisibility(R.id.layout_data, View.GONE)
                rv.setViewVisibility(R.id.layout_empty, View.VISIBLE)
            } else {
                try {
                    val data = JSONObject(json)
                    val prayers = data.getJSONArray("prayers")
                    val nextIndex = data.optInt("nextPrayerIndex", 0)
                    val now = System.currentTimeMillis()

                    if (nextIndex < 0 || nextIndex >= prayers.length()) {
                        rv.setViewVisibility(R.id.layout_data, View.GONE)
                        rv.setViewVisibility(R.id.layout_empty, View.VISIBLE)
                    } else {
                        val nextPrayer = prayers.getJSONObject(nextIndex)
                        val nextName = nextPrayer.getString("name")
                        val nextTime = nextPrayer.getLong("time")

                        // Compute countdown
                        val remaining = nextTime - now
                        val countdownStr: String = if (remaining > 3_600_000L) {
                            val hours = remaining / 3_600_000L
                            val minutes = (remaining % 3_600_000L) / 60_000L
                            "${hours}h ${minutes}m"
                        } else if (remaining > 0) {
                            val minutes = remaining / 60_000L
                            val seconds = (remaining % 60_000L) / 1_000L
                            "${minutes}m ${seconds}s"
                        } else {
                            "Now"
                        }

                        // Compute progress (0–100)
                        val windowStart: Long = if (nextIndex > 0) {
                            prayers.getJSONObject(nextIndex - 1).getLong("time")
                        } else {
                            // Start of day for Fajr
                            val cal = java.util.Calendar.getInstance()
                            cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
                            cal.set(java.util.Calendar.MINUTE, 0)
                            cal.set(java.util.Calendar.SECOND, 0)
                            cal.set(java.util.Calendar.MILLISECOND, 0)
                            cal.timeInMillis
                        }
                        val windowEnd = nextTime
                        val progress: Int = if (windowEnd > windowStart) {
                            ((now - windowStart) * 100L / (windowEnd - windowStart))
                                .coerceIn(0L, 100L).toInt()
                        } else {
                            0
                        }

                        // Set all RemoteViews fields
                        rv.setTextViewText(R.id.prayer_name, nextName)
                        rv.setTextViewText(R.id.countdown, countdownStr)
                        rv.setProgressBar(R.id.progress, 100, progress, false)

                        // Last updated timestamp
                        val lastUpdated = data.optLong("lastUpdated", 0L)
                        if (lastUpdated > 0) {
                            val sdf = java.text.SimpleDateFormat("h:mm a", java.util.Locale.ENGLISH)
                            rv.setTextViewText(R.id.last_updated, "Updated ${sdf.format(java.util.Date(lastUpdated))}")
                        }

                        rv.setViewVisibility(R.id.layout_data, View.VISIBLE)
                        rv.setViewVisibility(R.id.layout_empty, View.GONE)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error updating widget", e)
                    rv.setViewVisibility(R.id.layout_data, View.GONE)
                    rv.setViewVisibility(R.id.layout_empty, View.VISIBLE)
                }
            }

            // Full-widget tap → MainActivity
            val intent = Intent(context, MainActivity::class.java)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            val pi = PendingIntent.getActivity(
                context, 100, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            rv.setOnClickPendingIntent(R.id.touch_overlay, pi)

            mgr.updateAppWidget(id, rv)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { updateWidget(context, appWidgetManager, it) }
    }

    override fun onEnabled(context: Context) {
        // Enqueue periodic WorkManager (15 min interval, unique tag)
        val periodicWork = PeriodicWorkRequestBuilder<WidgetDataWorker>(
            15, TimeUnit.MINUTES
        ).build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_TAG,
            ExistingPeriodicWorkPolicy.KEEP,
            periodicWork
        )

        // Schedule next prayer alarm if SharedPreferences has data
        val prefs = context.getSharedPreferences(
            "NoorConnectWidgetPrefs", Context.MODE_PRIVATE
        )
        val prayerJson = prefs.getString("widget_prayer_data", null)
        if (prayerJson != null) {
            AlarmScheduler.scheduleNextPrayerAlarm(context, prayerJson)
        }

        Log.d(TAG, "Widget enabled — periodic work and alarm scheduled")
    }

    override fun onDisabled(context: Context) {
        // Cancel WorkManager task by unique tag
        WorkManager.getInstance(context).cancelUniqueWork(WORK_TAG)
        // Cancel all alarms
        AlarmScheduler.cancelAllAlarms(context)
        Log.d(TAG, "Widget disabled — periodic work and alarms cancelled")
    }
}
