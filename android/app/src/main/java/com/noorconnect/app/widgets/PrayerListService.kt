package com.noorconnect.app.widgets

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import androidx.core.content.ContextCompat
import com.noorconnect.app.R
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * RemoteViewsService that provides the ListView data for DailyScheduleWidget.
 */
class PrayerListService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory =
        PrayerListFactory(this)
}

/**
 * RemoteViewsFactory that builds prayer row views from SharedPreferences data.
 */
class PrayerListFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private data class PrayerRow(val name: String, val time: Long)

    private var prayers: List<PrayerRow> = emptyList()
    private var nextIndex: Int = -1

    override fun onDataSetChanged() {
        // Re-read SharedPreferences (called on notifyAppWidgetViewDataChanged)
        try {
            val prefs = context.getSharedPreferences(
                "NoorConnectWidgetPrefs", Context.MODE_PRIVATE
            )
            val json = prefs.getString("widget_prayer_data", null) ?: return

            val data = JSONObject(json)
            val prayersArray = data.getJSONArray("prayers")
            nextIndex = data.optInt("nextPrayerIndex", -1)

            val list = mutableListOf<PrayerRow>()
            for (i in 0 until prayersArray.length()) {
                val p = prayersArray.getJSONObject(i)
                list.add(PrayerRow(
                    name = p.getString("name"),
                    time = p.getLong("time")
                ))
            }
            prayers = list
        } catch (e: Exception) {
            prayers = emptyList()
            nextIndex = -1
        }
    }

    override fun getViewAt(position: Int): RemoteViews {
        val rv = RemoteViews(context.packageName, R.layout.widget_prayer_row)
        val row = prayers.getOrNull(position) ?: return rv

        rv.setTextViewText(R.id.row_name, row.name)
        rv.setTextViewText(
            R.id.row_time,
            SimpleDateFormat("h:mm a", Locale.ENGLISH).format(Date(row.time))
        )

        if (position == nextIndex) {
            rv.setInt(
                R.id.row_root, "setBackgroundColor",
                ContextCompat.getColor(context, R.color.m3_secondary_container)
            )
            rv.setTextColor(
                R.id.row_name,
                ContextCompat.getColor(context, R.color.m3_on_secondary_container)
            )
            rv.setTextColor(
                R.id.row_time,
                ContextCompat.getColor(context, R.color.m3_on_secondary_container)
            )
        } else {
            rv.setInt(R.id.row_root, "setBackgroundColor", Color.TRANSPARENT)
            rv.setTextColor(R.id.row_name, android.graphics.Color.parseColor("#E8EAF6"))
            rv.setTextColor(R.id.row_time, android.graphics.Color.parseColor("#C5CAE9"))
        }

        return rv
    }

    override fun getCount(): Int = prayers.size.coerceAtMost(6)

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true

    override fun onCreate() {}

    override fun onDestroy() {}
}
