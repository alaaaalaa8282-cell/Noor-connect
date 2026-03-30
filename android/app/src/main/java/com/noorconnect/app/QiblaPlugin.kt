package com.noorconnect.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import io.github.derysudrajat.compassqibla.CompassQibla
import io.github.derysudrajat.compassqibla.QiblaDirection
import android.Manifest
import android.content.pm.PackageManager
import android.location.Address
import android.location.Location
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

@CapacitorPlugin(name = "Qibla")
class QiblaPlugin : Plugin() {


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

            CompassQibla.Builder(activity as androidx.appcompat.app.AppCompatActivity)
                .onPermissionGranted {
                    // Logic for permission finished
                }
                .onGetLocationAddress { address: Address ->
                    val res = JSObject()
                    res.put("address", address.getAddressLine(0))
                    res.put("city", address.locality)
                    res.put("country", address.countryName)
                    notifyListeners("locationAddress", res)
                }
                .onDirectionChangeListener { qibla: QiblaDirection ->
                    val res = JSObject()
                    res.put("isFacingQibla", qibla.isFacingQibla)
                    res.put("compassAngle", qibla.compassAngle)
                    res.put("needleAngle", qibla.needleAngle)
                    
                    notifyListeners("qiblaUpdate", res)
                }
                .onPermissionDenied {
                    val res = JSObject()
                    res.put("success", false)
                    res.put("message", "Permission denied")
                    notifyListeners("permissionDenied", res)
                }
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
            if (!isListening) {
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
    override fun checkPermissions(call: PluginCall) {
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

    override fun handleOnDestroy() {
        super.handleOnDestroy()

        isListening = false
    }
}
