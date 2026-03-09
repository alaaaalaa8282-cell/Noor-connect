package com.noorconnect.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.derysudrajat.compassqibla.CompassQibla
import com.derysudrajat.compassqibla.QiblaDirection
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

@CapacitorPlugin(name = "Qibla")
class QiblaPlugin : Plugin() {

    private var compassQibla: CompassQibla? = null
    private var isListening = false

    override fun load() {
        super.load()
        // Check if we have location permissions
        checkLocationPermissions()
    }

    private fun checkLocationPermissions() {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        
        val hasPermissions = permissions.all { permission ->
            ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
        }
        
        if (!hasPermissions) {
            ActivityCompat.requestPermissions(activity, permissions, 1001)
        }
    }

    @PluginMethod
    fun startCompass(call: PluginCall) {
        try {
            if (isListening) {
                call.resolve(JSObject().apply {
                    put("success", true)
                    put("message", "Compass already started")
                })
                return
            }

            compassQibla = CompassQibla.Builder(context)
                .onDirectionChangeListener { qiblaDirection ->
                    val result = JSObject().apply {
                        put("isFacingQibla", qiblaDirection.isFacingQibla)
                        put("compassAngle", qiblaDirection.compassAngle)
                        put("needleAngle", qiblaDirection.needleAngle)
                        put("qiblaBearing", calculateQiblaBearing(qiblaDirection.location?.latitude, qiblaDirection.location?.longitude))
                        put("latitude", qiblaDirection.location?.latitude)
                        put("longitude", qiblaDirection.location?.longitude)
                        put("accuracy", qiblaDirection.location?.accuracy)
                    }
                    
                    // Notify the web view about direction changes
                    notifyListeners("qiblaDirectionChange", result)
                }
                .onPermissionGranted { permission ->
                    val result = JSObject().apply {
                        put("success", true)
                        put("permission", permission)
                        put("message", "Permission granted")
                    }
                    notifyListeners("permissionGranted", result)
                }
                .onPermissionDenied {
                    val result = JSObject().apply {
                        put("success", false)
                        put("message", "Permission denied")
                    }
                    notifyListeners("permissionDenied", result)
                }
                .onGetLocationAddress { address ->
                    val result = JSObject().apply {
                        put("address", address?.getAddressLine(0))
                        put("city", address?.locality)
                        put("country", address?.countryName)
                    }
                    notifyListeners("locationAddress", result)
                }
                .build()

            isListening = true
            
            call.resolve(JSObject().apply {
                put("success", true)
                put("message", "Compass started successfully")
            })

        } catch (e: Exception) {
            call.reject("Failed to start compass: ${e.message}")
        }
    }

    @PluginMethod
    fun stopCompass(call: PluginCall) {
        try {
            if (!isListening) {
                call.resolve(JSObject().apply {
                    put("success", true)
                    put("message", "Compass already stopped")
                })
                return
            }

            compassQibla = null
            isListening = false

            call.resolve(JSObject().apply {
                put("success", true)
                put("message", "Compass stopped successfully")
            })

        } catch (e: Exception) {
            call.reject("Failed to stop compass: ${e.message}")
        }
    }

    @PluginMethod
    fun getQiblaDirection(call: PluginCall) {
        try {
            if (!isListening || compassQibla == null) {
                call.reject("Compass not started. Call startCompass() first.")
                return
            }

            // The current direction will be available through the listener
            call.resolve(JSObject().apply {
                put("success", true)
                put("message", "Qibla direction tracking active")
                put("isListening", isListening)
            })

        } catch (e: Exception) {
            call.reject("Failed to get Qibla direction: ${e.message}")
        }
    }

    @PluginMethod
    fun checkPermissions(call: PluginCall) {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        
        val permissionStatus = JSObject()
        permissions.forEach { permission ->
            val hasPermission = ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
            permissionStatus.put(permission.split(".").last(), hasPermission)
        }

        call.resolve(JSObject().apply {
            put("permissions", permissionStatus)
            put("allGranted", permissions.all { 
                ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED 
            })
        })
    }

    private fun calculateQiblaBearing(latitude: Double?, longitude: Double?): Double {
        if (latitude == null || longitude == null) return 0.0
        
        val kaabaLat = 21.4225
        val kaabaLng = 39.8262
        
        val lat1 = Math.toRadians(latitude)
        val lat2 = Math.toRadians(kaabaLat)
        val diffLng = Math.toRadians(kaabaLng - longitude)
        
        val y = Math.sin(diffLng)
        val x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(diffLng)
        
        var bearing = Math.toDegrees(Math.atan2(y, x))
        bearing = (bearing + 360) % 360
        
        return bearing
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        compassQibla = null
        isListening = false
    }
}
