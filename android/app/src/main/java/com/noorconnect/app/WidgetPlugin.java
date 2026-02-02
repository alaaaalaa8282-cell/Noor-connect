package com.noorconnect.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {

    private static final String TAG = "WidgetPlugin";

    @PluginMethod
    public void updateWidget(PluginCall call) {
        try {
            String name = call.getString("name");
            String time = call.getString("time");
            String remaining = call.getString("remaining");
            String location = call.getString("location");

            if (name == null || time == null) {
                call.reject("Required parameters 'name' or 'time' are missing");
                return;
            }

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PrayerWidget.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            editor.putString(PrayerWidget.KEY_PRAYER_NAME, name);
            editor.putString(PrayerWidget.KEY_PRAYER_TIME, time);
            editor.putString(PrayerWidget.KEY_TIME_REMAINING, remaining != null ? remaining : "");
            editor.putString(PrayerWidget.KEY_LOCATION, location != null ? location : "Unknown");
            editor.putLong(PrayerWidget.KEY_LAST_UPDATE, System.currentTimeMillis());

            editor.apply();

            Log.d(TAG, "Preferences saved, sending broadcast for " + name);

            // Notify all widgets to update immediately
            PrayerWidget.updateAllWidgets(context);

            JSObject ret = new JSObject();
            ret.put("status", "success");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error updating widget", e);
            call.reject("Failed to update widget: " + e.getMessage());
        }
    }
}
