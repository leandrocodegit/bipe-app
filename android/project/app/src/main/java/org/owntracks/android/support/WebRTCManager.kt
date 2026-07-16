package org.owntracks.android.support

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import android.os.PowerManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.owntracks.android.model.messages.MessageRTC
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.services.MessageProcessor
import org.webrtc.*
import org.webrtc.audio.JavaAudioDeviceModule
import timber.log.Timber
import java.util.Collections
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebRTCManager @Inject constructor(
    @param:ApplicationContext private val context: Context,
    private val messageProcessor: MessageProcessor,
    private val preferences: Preferences
) {
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var localAudioSource: AudioSource? = null
    private var localAudioTrack: AudioTrack? = null
    private var audioManager: AudioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var powerManager: PowerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    private var wakeLock: PowerManager.WakeLock? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    
    private val _isCallInProgress = MutableStateFlow(false)
    val isCallInProgress: StateFlow<Boolean> = _isCallInProgress.asStateFlow()

    private var currentSessionId: String? = null
    private var currentUserName: String? = null
    private var currentClienteId: String? = null
    
    // Filtro de mensagens processadas para evitar loops
    private val processedMessageIds = Collections.synchronizedSet(HashSet<String>())

    init {
        initPeerConnectionFactory()
    }

    private fun initPeerConnectionFactory() {
        val options = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)

        val audioDeviceModule = JavaAudioDeviceModule.builder(context)
            .setAudioSource(MediaRecorder.AudioSource.MIC)
            .setUseHardwareAcousticEchoCanceler(true)
            .setUseHardwareNoiseSuppressor(false)
            .createAudioDeviceModule()

        val factoryOptions = PeerConnectionFactory.Options()
        peerConnectionFactory = PeerConnectionFactory.builder()
            .setOptions(factoryOptions)
            .setAudioDeviceModule(audioDeviceModule)
            .createPeerConnectionFactory()
            
        audioDeviceModule.release()
    }

    fun startCall(sessionId: String? = null, userName: String? = null, clienteId: String? = null) {
        if (_isCallInProgress.value) {
            Timber.d("WebRTC: Chamada já em andamento. Enviando sinal de OCUPADO.")
            sendBusyMessage(sessionId, userName, clienteId)
            return
        }
        
        Timber.d("WebRTC: Iniciando oferta (Send Only). Sessão: $sessionId")
        
        if (!requestAudioFocus()) {
            Timber.e("WebRTC: Falha ao obter foco de áudio. Abortando chamada.")
            return
        }

        acquireWakeLock()
        
        _isCallInProgress.value = true
        currentSessionId = sessionId
        currentUserName = userName
        currentClienteId = clienteId

        setupAudioMode(true)
        createPeerConnection()
        
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "false"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"))
        }

        peerConnection?.createOffer(object : SimpleSdpObserver() {
            override fun onCreateSuccess(p0: SessionDescription?) {
                p0?.let { sdp ->
                    peerConnection?.setLocalDescription(object : SimpleSdpObserver() {
                        override fun onSetSuccess() {
                            sendSignalingMessage("offer", sdp.description)
                        }
                    }, sdp)
                }
            }
        }, constraints)
    }

    private fun setupAudioMode(on: Boolean) {
        if (on) {
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager.isMicrophoneMute = false
        } else {
            audioManager.mode = AudioManager.MODE_NORMAL
            abandonAudioFocus()
        }
    }

    private fun requestAudioFocus(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener { }
                .build()
            audioManager.requestAudioFocus(audioFocusRequest!!) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
    }

    private fun abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            audioManager.abandonAudioFocus(null)
        }
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Sincroled:WebRTCCall")
        }
        if (!wakeLock!!.isHeld) {
            wakeLock!!.acquire(10 * 60 * 1000L /*10 minutes max*/)
        }
    }

    private fun releaseWakeLock() {
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    private fun createPeerConnection() {
        if (peerConnection != null) {
            peerConnection?.dispose()
        }

        val iceServers = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer()
        )
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
        }

        peerConnection = peerConnectionFactory?.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate) {
                sendIceCandidate(candidate)
            }
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
                Timber.d("WebRTC Connection: $state")
                if (state == PeerConnection.IceConnectionState.DISCONNECTED || 
                    state == PeerConnection.IceConnectionState.FAILED ||
                    state == PeerConnection.IceConnectionState.CLOSED) {
                    
                    // Release resources if connection is broken
                    if (_isCallInProgress.value) {
                        Timber.d("WebRTC: Connection lost or closed. Stopping call.")
                        stopCall()
                    }
                }
            }
            override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?) {}
            override fun onSignalingChange(p0: PeerConnection.SignalingState?) {}
            override fun onIceConnectionReceivingChange(p0: Boolean) {}
            override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
            override fun onAddStream(p0: MediaStream?) {}
            override fun onRemoveStream(p0: MediaStream?) {}
            override fun onDataChannel(p0: DataChannel?) {}
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        })

        addAudioTrack()
    }

    private fun addAudioTrack() {
        val audioConstraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
        }
        localAudioSource = peerConnectionFactory?.createAudioSource(audioConstraints)
        localAudioTrack = peerConnectionFactory?.createAudioTrack("ARDAMSa0", localAudioSource)
        localAudioTrack?.setEnabled(true)
        peerConnection?.addTrack(localAudioTrack)
    }

    fun handleIncomingSignaling(message: MessageRTC) {
        // Filtro de Duplicidade por _id da mensagem
        val msgId = message.messageId.toString()
        if (processedMessageIds.contains(msgId)) return
        processedMessageIds.add(msgId)

        // Capture session info from any incoming RTC message if not already set
        if (currentUserName == null) currentUserName = message.userName
        if (currentClienteId == null) currentClienteId = message.clienteId

        when (message.subtype) {
            "offer" -> handleOffer(message.sdp!!, message.sessaoid, message.userName, message.clienteId)
            "answer" -> handleAnswer(message.sdp!!)
            "candidate" -> handleCandidate(message)
        }
    }

    private fun handleOffer(sdp: String, sessionId: String?, userName: String?, clienteId: String?) {
        if (_isCallInProgress.value) {
            sendBusyMessage(sessionId, userName, clienteId)
            return
        }
        
        if (!requestAudioFocus()) return
        acquireWakeLock()
        
        _isCallInProgress.value = true
        currentSessionId = sessionId
        currentUserName = userName
        currentClienteId = clienteId
        
        setupAudioMode(true)
        createPeerConnection()
        
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "false"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", "false"))
        }

        peerConnection?.setRemoteDescription(object : SimpleSdpObserver() {
            override fun onSetSuccess() {
                peerConnection?.createAnswer(object : SimpleSdpObserver() {
                    override fun onCreateSuccess(answerSdp: SessionDescription?) {
                        answerSdp?.let {
                            peerConnection?.setLocalDescription(SimpleSdpObserver(), it)
                            sendSignalingMessage("answer", it.description)
                        }
                    }
                }, constraints)
            }
        }, SessionDescription(SessionDescription.Type.OFFER, sdp))
    }

    private fun handleAnswer(sdp: String) {
        peerConnection?.setRemoteDescription(SimpleSdpObserver(), SessionDescription(SessionDescription.Type.ANSWER, sdp))
    }

    private fun handleCandidate(message: MessageRTC) {
        if (message.candidate != null && message.sdpMid != null && message.sdpMLineIndex != null) {
            peerConnection?.addIceCandidate(IceCandidate(message.sdpMid!!, message.sdpMLineIndex!!, message.candidate!!))
        }
    }

    private fun sendBusyMessage(sessionId: String?, userName: String?, clienteId: String?) {
        val msg = MessageRTC().apply {
            subtype = "busy"
            senderId = preferences.deviceId
            sessaoid = sessionId
            this.userName = userName
            this.clienteId = clienteId
        }
        val customTopic = if (userName != null && clienteId != null) {
            "owntracks/${userName}/${clienteId}/rtc/send"
        } else null
        messageProcessor.queueMessageForSending(msg, customTopic)
    }

    private fun sendSignalingMessage(subtype: String, sdp: String) {
        val msg = MessageRTC().apply {
            this.subtype = subtype
            this.sdp = sdp
            this.senderId = preferences.deviceId
            this.sessaoid = currentSessionId
            this.userName = currentUserName
            this.clienteId = currentClienteId
        }
        
        // Construct custom topic: owntracks/{userName}/{clienteId}/rtc/send
        val customTopic = if (currentUserName != null && currentClienteId != null) {
            "owntracks/${currentUserName}/${currentClienteId}/rtc/send"
        } else {
            null
        }

        messageProcessor.queueMessageForSending(msg, customTopic)
    }

    private fun sendIceCandidate(candidate: IceCandidate) {
        val msg = MessageRTC().apply {
            subtype = "candidate"
            this.candidate = candidate.sdp
            sdpMid = candidate.sdpMid
            sdpMLineIndex = candidate.sdpMLineIndex
            this.senderId = preferences.deviceId
            this.sessaoid = currentSessionId
            this.userName = currentUserName
            this.clienteId = currentClienteId
        }

        val customTopic = if (currentUserName != null && currentClienteId != null) {
            "owntracks/${currentUserName}/${currentClienteId}/rtc/send"
        } else {
            null
        }

        messageProcessor.queueMessageForSending(msg, customTopic)
    }

    fun stopCall() {
        Timber.d("WebRTC: Parando chamada e liberando recursos.")
        _isCallInProgress.value = false
        currentSessionId = null
        currentUserName = null
        currentClienteId = null
        setupAudioMode(false)
        releaseWakeLock()

        peerConnection?.dispose()
        peerConnection = null
        localAudioSource?.dispose()
        localAudioSource = null
        localAudioTrack?.dispose()
        localAudioTrack = null
    }

    open class SimpleSdpObserver : SdpObserver {
        override fun onCreateSuccess(p0: SessionDescription?) {}
        override fun onSetSuccess() {}
        override fun onCreateFailure(p0: String?) { Timber.e("WebRTC Erro: $p0") }
        override fun onSetFailure(p0: String?) { Timber.e("WebRTC Erro Set: $p0") }
    }
}
