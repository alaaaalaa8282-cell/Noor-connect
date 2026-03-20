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
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.noorconnect.app.MainActivity
import com.noorconnect.app.R
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * Daily Ayah Widget (4×4)
 * Shows a daily Quran verse with Arabic text, translation, and reference.
 * Ayah index is computed as DAY_OF_YEAR % ayahs.size at update time.
 */
class DailyAyahWidget : AppWidgetProvider() {

    companion object {
        private const val TAG = "DailyAyahWidget"
        private const val WORK_TAG = "noor_widget_periodic"

        fun updateWidget(
            context: Context,
            mgr: AppWidgetManager,
            id: Int
        ) {
            val rv = RemoteViews(context.packageName, R.layout.widget_daily_ayah)
            val prefs = context.getSharedPreferences(
                "NoorConnectWidgetPrefs", Context.MODE_PRIVATE
            )
            val json = prefs.getString("widget_ayah_data", null)

            if (json == null) {
                showEmptyState(rv)
            } else {
                try {
                    val data = JSONObject(json)
                    val ayahs = data.getJSONArray("ayahs")

                    if (ayahs.length() == 0) {
                        showEmptyState(rv)
                    } else {
                        val index = Calendar.getInstance()
                            .get(Calendar.DAY_OF_YEAR) % ayahs.length()
                        val ayah = ayahs.getJSONObject(index)

                        rv.setTextViewText(R.id.ayah_arabic, ayah.optString("arabic", ""))
                        rv.setTextViewText(R.id.ayah_translation, ayah.optString("translation", ""))
                        rv.setTextViewText(R.id.ayah_reference, ayah.optString("reference", ""))

                        rv.setViewVisibility(R.id.ayah_arabic, View.VISIBLE)
                        rv.setViewVisibility(R.id.ayah_translation, View.VISIBLE)
                        rv.setViewVisibility(R.id.ayah_reference, View.VISIBLE)
                        rv.setViewVisibility(R.id.empty_ayah, View.GONE)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing ayah data", e)
                    showEmptyState(rv)
                }
            }

            // Tap → open app
            val intent = Intent(context, MainActivity::class.java)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            val pi = PendingIntent.getActivity(
                context, 102, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            // Set click on the root layout (first child is ayah_arabic)
            rv.setOnClickPendingIntent(R.id.ayah_arabic, pi)
            rv.setOnClickPendingIntent(R.id.ayah_translation, pi)
            rv.setOnClickPendingIntent(R.id.ayah_reference, pi)
            rv.setOnClickPendingIntent(R.id.empty_ayah, pi)

            mgr.updateAppWidget(id, rv)
        }

        private fun showEmptyState(rv: RemoteViews) {
            rv.setViewVisibility(R.id.ayah_arabic, View.GONE)
            rv.setViewVisibility(R.id.ayah_translation, View.GONE)
            rv.setViewVisibility(R.id.ayah_reference, View.GONE)
            rv.setViewVisibility(R.id.empty_ayah, View.VISIBLE)
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
        val periodicWork = PeriodicWorkRequestBuilder<WidgetDataWorker>(
            15, TimeUnit.MINUTES
        ).build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_TAG,
            ExistingPeriodicWorkPolicy.KEEP,
            periodicWork
        )

        Log.d(TAG, "Widget enabled")
    }

    override fun onDisabled(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(WORK_TAG)
        Log.d(TAG, "Widget disabled")
    }
}
