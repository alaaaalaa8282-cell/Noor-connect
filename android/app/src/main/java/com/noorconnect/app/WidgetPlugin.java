package com.noorconnect.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * WidgetPlugin — Capacitor bridge for all home-screen widgets.
 *
 * Methods exposed to TypeScript:
 * updateWidget(name, time, remaining, location) ← legacy / fast path
 * updateWidgetFull(name, time, remaining, location,
 * hijriDate, currentTime,
 * allPrayers[], ← [{name,time,status}]
 * quranArabic, quranTranslit, quranRef)
 */
@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {

    private static final String TAG = "WidgetPlugin";

    // ─────────────────────────────────────────────────
    // Legacy method (keeps backward compatibility)
    // ─────────────────────────────────────────────────
    @PluginMethod
    public void updateWidget(PluginCall call) {
        try {
            String name = call.getString("name");
            String time = call.getString("time");
            String remaining = call.getString("remaining");
            String location = call.getString("location");

            if (name == null || time == null) {
                call.reject("Required: 'name' and 'time'");
                return;
            }

            Context context = getContext();
            SharedPreferences.Editor editor = prefs(context).edit();
            editor.putString(PrayerWidget.KEY_PRAYER_NAME, name);
            editor.putString(PrayerWidget.KEY_PRAYER_TIME, time);
            editor.putString(PrayerWidget.KEY_TIME_REMAINING, remaining != null ? remaining : "");
            editor.putString(PrayerWidget.KEY_LOCATION, location != null ? location : "");
            editor.putLong(PrayerWidget.KEY_LAST_UPDATE, System.currentTimeMillis());
            editor.apply();

            PrayerWidget.updateAllWidgets(context);
            QuranVerseWidget.updateAllWidgets(context);

            JSObject ret = new JSObject();
            ret.put("status", "success");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "updateWidget error", e);
            call.reject("Failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────
    // Full enriched update (new)
    // ─────────────────────────────────────────────────
    @PluginMethod
    public void updateWidgetFull(PluginCall call) {
        try {
            String name = call.getString("name", "");
            String time = call.getString("time", "");
            String remaining = call.getString("remaining", "");
            String location = call.getString("location", "");
            String hijriDate = call.getString("hijriDate", "");
            String currentTime = call.getString("currentTime", "");
            String quranArabic = call.getString("quranArabic", "");
            String quranTranslit = call.getString("quranTranslit", "");
            String quranRef = call.getString("quranRef", "");

            Context context = getContext();
            SharedPreferences.Editor editor = prefs(context).edit();

            // Basic
            editor.putString(PrayerWidget.KEY_PRAYER_NAME, name);
            editor.putString(PrayerWidget.KEY_PRAYER_TIME, time);
            editor.putString(PrayerWidget.KEY_TIME_REMAINING, remaining);
            editor.putString(PrayerWidget.KEY_LOCATION, location);
            editor.putString(PrayerWidget.KEY_HIJRI_DATE, hijriDate);
            editor.putString(PrayerWidget.KEY_CURRENT_TIME, currentTime);
            editor.putLong(PrayerWidget.KEY_LAST_UPDATE, System.currentTimeMillis());

            // All-5 prayers from JSON array: [{name:"Fajr",time:"05:15",status:"passed"},
            // ...]
            JSONArray allPrayers = call.getArray("allPrayers", new JSONArray()).toJSONArray();
            if (allPrayers != null) {
                String[] prayerKeys = { "fajr", "dhuhr", "asr", "maghrib", "isha" };
                for (int i = 0; i < Math.min(prayerKeys.length, allPrayers.length()); i++) {
                    JSONObject p = allPrayers.getJSONObject(i);
                    String key = prayerKeys[i];
                    editor.putString(key + "_time", p.optString("time", "—"));
                    editor.putString(key + "_status", p.optString("status", "upcoming"));
                }
            }

            // Quran verse
            editor.putString(QuranVerseWidget.KEY_QURAN_ARABIC, quranArabic);
            editor.putString(QuranVerseWidget.KEY_QURAN_TRANSLIT, quranTranslit);
            editor.putString(QuranVerseWidget.KEY_QURAN_REF, quranRef);

            editor.apply();

            PrayerWidget.updateAllWidgets(context);
            QuranVerseWidget.updateAllWidgets(context);

            Log.d(TAG, "updateWidgetFull: prayer=" + name + " hijri=" + hijriDate + " quran=" + quranRef);

            JSObject ret = new JSObject();
            ret.put("status", "success");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "updateWidgetFull error", e);
            call.reject("Failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────
    // "Dumb Widget" bridge — accepts pre-localized strings from React
    // ─────────────────────────────────────────────────
    @PluginMethod
    public void setWidgetStrings(PluginCall call) {
        try {
            String strings = call.getString("strings", "{}");
            Context context = getContext();
            SharedPreferences.Editor editor = prefs(context).edit();
            editor.putString(PrayerWidget.KEY_WIDGET_STRINGS, strings);
            editor.apply();

            // Refresh all widgets so labels update immediately
            PrayerWidget.updateAllWidgets(context);
            QuranVerseWidget.updateAllWidgets(context);

            Log.d(TAG, "setWidgetStrings: " + strings);

            JSObject ret = new JSObject();
            ret.put("status", "success");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "setWidgetStrings error", e);
            call.reject("Failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────
    private SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PrayerWidget.PREFS_NAME, Context.MODE_PRIVATE);
    }
}
