package com.noorconnect.app;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Capacitor bridge for native adhan alarm scheduling and playback controls.
 */
@CapacitorPlugin(name = "NativeAdhanPlugin")
public class NativeAdhanPlugin extends Plugin {
    private static final String TAG = "NativeAdhanPlugin";

    @PluginMethod
    public void schedule(PluginCall call) {
        Context context = getContext();
        JSArray alarms = call.getArray("alarms");
        boolean enabled = call.getBoolean("enabled", true);

        if (alarms == null) {
            call.reject("Missing 'alarms' array");
            return;
        }

        NativeAdhanScheduler.setEnabled(context, enabled);
        NativeAdhanScheduler.clearAll(context);

        if (!enabled) {
            JSObject result = new JSObject();
            result.put("scheduled", 0);
            result.put("enabled", false);
            call.resolve(result);
            return;
        }

        int scheduled = 0;
        long now = System.currentTimeMillis();

        for (int i = 0; i < alarms.length(); i++) {
            try {
                JSONObject alarmObject = alarms.getJSONObject(i);
                JSObject alarm = JSObject.fromJSONObject(alarmObject);

                int id = alarm.optInt("id", -1);
                long triggerAt = alarm.optLong("triggerAt", -1L);
                String prayerName = alarm.optString("prayerName", "Prayer");
                String adhanUrl = alarm.optString("adhanUrl", "/audio/adhan-makkah.mp3");

                if (id < 0 || triggerAt <= now) {
                    continue;
                }

                NativeAdhanScheduler.scheduleAlarm(
                        context,
                        new NativeAdhanScheduler.ScheduledAdhan(id, triggerAt, prayerName, adhanUrl),
                        true
                );
                scheduled++;
            } catch (JSONException parseError) {
                Log.w(TAG, "Skipping invalid native adhan alarm item at index " + i, parseError);
            }
        }

        JSObject result = new JSObject();
        result.put("scheduled", scheduled);
        result.put("enabled", true);
        call.resolve(result);
    }

    @PluginMethod
    public void clear(PluginCall call) {
        NativeAdhanScheduler.clearAll(getContext());

        JSObject result = new JSObject();
        result.put("status", "cleared");
        call.resolve(result);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        NativeAdhanScheduler.setEnabled(getContext(), enabled);

        JSObject result = new JSObject();
        result.put("enabled", enabled);
        result.put("count", NativeAdhanScheduler.getScheduledCount(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", NativeAdhanScheduler.isEnabled(getContext()));
        result.put("count", NativeAdhanScheduler.getScheduledCount(getContext()));
        call.resolve(result);
    }
}
