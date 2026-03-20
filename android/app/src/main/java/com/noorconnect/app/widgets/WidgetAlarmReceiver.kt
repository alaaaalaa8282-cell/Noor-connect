package com.noorconnect.app.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy

/**
 * Receives alarm broadcasts at each prayer time.
 * Enqueues an expedited WidgetDataWorker and reschedules the next alarm.
 */
class WidgetAlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "WidgetAlarmReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Alarm received: ${intent.action}")

        try {
            // 1. Enqueue one-time WidgetDataWorker (expedited)
            val workRequest = OneTimeWorkRequestBuilder<WidgetDataWorker>()
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .build()

            androidx.work.WorkManager.getInstance(context).enqueueUniqueWork(
                "widget_alarm_refresh",
                ExistingWorkPolicy.REPLACE,
                workRequest
            )

            // 2. Re-read SharedPreferences and reschedule next prayer alarm
            val prefs = context.getSharedPreferences(
                "NoorConnectWidgetPrefs", Context.MODE_PRIVATE
            )
            val prayerJson = prefs.getString("widget_prayer_data", null)
            if (prayerJson != null) {
                AlarmScheduler.scheduleNextPrayerAlarm(context, prayerJson)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error in onReceive", e)
        }
    }
}
