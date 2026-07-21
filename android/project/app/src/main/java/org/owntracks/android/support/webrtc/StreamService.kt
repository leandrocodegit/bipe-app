package org.owntracks.android.support.webrtc

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import org.owntracks.android.R
import org.webrtc.*
import timber.log.Timber

class StreamService : Service() {

    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var localAudioSource: AudioSource? = null
    private var localAudioTrack: AudioTrack? = null

    companion object {
        private const val NOTIFICATION_ID = 1010
        private const val CHANNEL_ID = "StreamServiceChannel"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        initWebRTC()
    }

    private fun initWebRTC() {
        try {
            val initializationOptions = PeerConnectionFactory.InitializationOptions.builder(this)
                .createInitializationOptions()
            PeerConnectionFactory.initialize(initializationOptions)

            val options = PeerConnectionFactory.Options()
            peerConnectionFactory = PeerConnectionFactory.builder()
                .setOptions(options)
                .createPeerConnectionFactory()

            // Aqui entraria a lógica de sinalização via MQTT ou Socket
            Timber.d("WebRTC iniciado no serviço de segundo plano")

        } catch (e: Exception) {
            Timber.e(e, "Falha ao inicializar WebRTC no serviço")
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Serviço de Transmissão de Áudio",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BIPE")
            .setContentText("Transmissão de áudio ativa em segundo plano")
            .setSmallIcon(R.drawable.ic_baseline_mic_24)
            .setOngoing(true)
            .build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Lógica para iniciar a chamada específica aqui se necessário
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        peerConnection?.dispose()
        localAudioSource?.dispose()
        localAudioTrack?.dispose()
        super.onDestroy()
    }
}
