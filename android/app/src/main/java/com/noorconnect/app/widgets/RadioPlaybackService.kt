package com.noorconnect.app.widgets

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle
import com.noorconnect.app.MainActivity
import com.noorconnect.app.R

const val ACTION_PLAY_PAUSE = "com.noorconnect.app.radio.PLAY_PAUSE"
const val ACTION_NEXT = "com.noorconnect.app.radio.NEXT"
const val ACTION_PREV = "com.noorconnect.app.radio.PREV"
const val ACTION_STOP = "com.noorconnect.app.radio.STOP"

class RadioPlaybackService : Service() {

    companion object {
        const val TAG = "RadioPlaybackService"
        const val CHANNEL_ID = "radio_playback_channel"
        const val NOTIFICATION_ID = 3001
    }

    private var mediaPlayer: MediaPlayer? = null
    private var isRadioPlaying = false
    private var currentStationIndex = 0

    private val stations = listOf(
        Pair("Local Radio", "http://10.0.2.2:8080/quran-radio"),
        Pair("Live Makkah", "https://Qurango.net/radio/tarteel"),
        Pair("Quran 24/7", "https://qurango.net/radio/salman_alotaibi")
    )

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_NOT_STICKY

        when (action) {
            ACTION_PLAY_PAUSE -> togglePlayback()
            ACTION_NEXT -> nextStation()
            ACTION_PREV -> previousStation()
            ACTION_STOP -> stopAndCleanup()
        }

        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        stopAndCleanup()
        super.onDestroy()
    }

    private fun togglePlayback() {
        if (isRadioPlaying) {
            pauseRadio()
        } else {
            playRadio()
        }
    }

    private fun playRadio() {
        if (mediaPlayer == null) {
            initializePlayer()
        }

        if (requestAudioFocus()) {
            mediaPlayer?.setupAndPlay(stations[currentStationIndex].second)
            isRadioPlaying = true
            updateNotificationAndWidgets()
        }
    }

    private fun pauseRadio() {
        mediaPlayer?.pause()
        isRadioPlaying = false
        updateNotificationAndWidgets()
        stopForeground(false)
    }

    private fun nextStation() {
        currentStationIndex = (currentStationIndex + 1) % stations.size
        if (isRadioPlaying) {
            mediaPlayer?.reset()
            playRadio()
        } else {
            updateNotificationAndWidgets()
        }
    }

    private fun previousStation() {
        currentStationIndex = if (currentStationIndex - 1 < 0) stations.size - 1 else currentStationIndex - 1
        if (isRadioPlaying) {
            mediaPlayer?.reset()
            playRadio()
        } else {
            updateNotificationAndWidgets()
        }
    }

    private fun stopAndCleanup() {
        isRadioPlaying = false
        mediaPlayer?.release()
        mediaPlayer = null
        stopForeground(true)
        updateNotificationAndWidgets()
        stopSelf()
    }

    private fun initializePlayer() {
        mediaPlayer = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            )
            setOnPreparedListener { 
                it.start()
                isRadioPlaying = true
                updateNotificationAndWidgets()
            }
            setOnErrorListener { _, what, extra ->
                Log.e(TAG, "MediaPlayer error: $what, $extra")
                isRadioPlaying = false
                updateNotificationAndWidgets()
                true
            }
            setOnCompletionListener {
                isRadioPlaying = false
                updateNotificationAndWidgets()
            }
        }
    }

    private fun MediaPlayer.setupAndPlay(url: String) {
        try {
            reset()
            setDataSource(url)
            prepareAsync() 
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play radio stream", e)
            isRadioPlaying = false
            updateNotificationAndWidgets()
        }
    }

    private fun requestAudioFocus(): Boolean {
        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            am.requestAudioFocus(
                AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
                    )
                    .build()
            )
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    }

    private fun updateNotificationAndWidgets() {
        val currentStation = stations[currentStationIndex].first
        val notification = createNotification(currentStation)
        
        if (isRadioPlaying) {
            startForeground(NOTIFICATION_ID, notification)
        } else {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(NOTIFICATION_ID, notification)
        }

        RadioWidget.updateAllWidgets(applicationContext, isRadioPlaying, currentStation)
    }

    private fun createNotification(stationName: String): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pOpenIntent = PendingIntent.getActivity(this, 0, openIntent, PendingIntent.FLAG_IMMUTABLE)

        val playPauseIntent = PendingIntent.getService(this, 1, Intent(this, RadioPlaybackService::class.java).setAction(ACTION_PLAY_PAUSE), PendingIntent.FLAG_IMMUTABLE)
        val nextIntent = PendingIntent.getService(this, 2, Intent(this, RadioPlaybackService::class.java).setAction(ACTION_NEXT), PendingIntent.FLAG_IMMUTABLE)
        val prevIntent = PendingIntent.getService(this, 3, Intent(this, RadioPlaybackService::class.java).setAction(ACTION_PREV), PendingIntent.FLAG_IMMUTABLE)
        val stopIntent = PendingIntent.getService(this, 4, Intent(this, RadioPlaybackService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE)

        val playActionTitle = if (isRadioPlaying) "Pause" else "Play"
        val playActionIcon = if (isRadioPlaying) R.drawable.ic_widget_pause else R.drawable.ic_widget_play

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(stationName)
            .setContentText(if (isRadioPlaying) "Playing live radio" else "Paused")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher))
            .setContentIntent(pOpenIntent)
            .setOngoing(isRadioPlaying)
            .setDeleteIntent(stopIntent)
            .addAction(R.drawable.ic_widget_prev, "Prev", prevIntent)
            .addAction(playActionIcon, playActionTitle, playPauseIntent)
            .addAction(R.drawable.ic_widget_next, "Next", nextIntent)
            .setStyle(MediaStyle().setShowActionsInCompactView(0, 1, 2))

        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Quran Radio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Controls for background live Quran radio playback"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }
}
