package com.noorconnect.app.widgets

import android.app.NotificationChannel
import android.app.NotificationManager
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import org.json.JSONObject

/**
 * Background worker that reads SharedPreferences and pushes data to all widgets.
 * Runs expedited for quick refresh, falls back to normal if quota exceeded.
 */
class WidgetDataWorker(
    ctx: Context,
    params: WorkerParameters
) : CoroutineWorker(ctx, params) {

    companion object {
        private const val TAG = "WidgetDataWorker"
        private const val NOTIFICATION_ID = 9901
        private const val CHANNEL_ID = "widget_sync_channel"
    }

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences(
            "NoorConnectWidgetPrefs", Context.MODE_PRIVATE
        )
        val prayerJson = prefs.getString("widget_prayer_data", null)
        val ayahJson = prefs.getString("widget_ayah_data", null)

        if (prayerJson == null || ayahJson == null) {
            // Push empty state to all widgets — do not crash
            updateAllWidgetsEmptyState(applicationContext)
            return Result.success()
        }

        try {
            JSONObject(prayerJson)
            JSONObject(ayahJson)
            // Just validate parsing passes, then trigger widget updates
            updateAllWidgets(applicationContext)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse widget data", e)
            updateAllWidgetsEmptyState(applicationContext)
        }

        return Result.success()
    }

    override suspend fun getForegroundInfo(): ForegroundInfo {
        // Required for setExpedited() on API < 31
        // Minimal silent notification (no sound, no vibration)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
                as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Widget Sync",
                    NotificationManager.IMPORTANCE_MIN
                ).apply {
                    setShowBadge(false)
                    enableVibration(false)
                    setSound(null, null)
                }
                nm.createNotificationChannel(channel)
            }
        }

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(com.noorconnect.app.R.mipmap.ic_launcher)
            .setContentTitle("Updating widgets…")
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()

        return ForegroundInfo(NOTIFICATION_ID, notification)
    }

    private fun updateAllWidgets(context: Context) {
        val mgr = AppWidgetManager.getInstance(context)

        // Update NextAdhanWidgets
        val nextAdhanIds = mgr.getAppWidgetIds(
            ComponentName(context, NextAdhanWidget::class.java)
        )
        for (id in nextAdhanIds) {
            NextAdhanWidget.updateWidget(context, mgr, id)
        }

        // Update DailyScheduleWidgets
        val scheduleIds = mgr.getAppWidgetIds(
            ComponentName(context, DailyScheduleWidget::class.java)
        )
        for (id in scheduleIds) {
            DailyScheduleWidget.updateWidget(context, mgr, id)
        }

        // Update DailyAyahWidgets
        val ayahIds = mgr.getAppWidgetIds(
            ComponentName(context, DailyAyahWidget::class.java)
        )
        for (id in ayahIds) {
            DailyAyahWidget.updateWidget(context, mgr, id)
        }

        Log.d(TAG, "All widgets updated: nextAdhan=${nextAdhanIds.size}, schedule=${scheduleIds.size}, ayah=${ayahIds.size}")
    }

    private fun updateAllWidgetsEmptyState(context: Context) {
        val mgr = AppWidgetManager.getInstance(context)

        val nextAdhanIds = mgr.getAppWidgetIds(
            ComponentName(context, NextAdhanWidget::class.java)
        )
        for (id in nextAdhanIds) {
            NextAdhanWidget.updateWidget(context, mgr, id)
        }

        val scheduleIds = mgr.getAppWidgetIds(
            ComponentName(context, DailyScheduleWidget::class.java)
        )
        for (id in scheduleIds) {
            DailyScheduleWidget.updateWidget(context, mgr, id)
        }

        val ayahIds = mgr.getAppWidgetIds(
            ComponentName(context, DailyAyahWidget::class.java)
        )
        for (id in ayahIds) {
            DailyAyahWidget.updateWidget(context, mgr, id)
        }
    }
}
