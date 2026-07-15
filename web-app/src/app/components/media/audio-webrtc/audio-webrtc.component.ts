import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';
import { ButtonModule } from 'primeng/button';
import { AudioCallService, CallState, CallInfo } from '@/shared/services/audio-call.service';

interface RtcSignal {
  _type: 'rtc';
  subtype: 'offer' | 'answer' | 'candidate';
  sessaoid?: string;
  sdp?: string;
  candidate?: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
  senderId?: string;
  _id?: string;
}

@Component({
  selector: 'app-audio-webrtc',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './audio-webrtc.component.html',
  styleUrl: './audio-webrtc.component.scss'
})
export class AudioWebrtcComponent implements OnInit, OnDestroy {
  @ViewChild('remoteAudio', { static: true }) remoteAudio?: ElementRef<HTMLAudioElement>;

  public callState: CallState = 'IDLE';
  public callInfo: CallInfo | null = null;
  public callDuration = '00:00';

  private peerConnection?: RTCPeerConnection;
  private localStream?: MediaStream;
  private subscriptions = new Subscription();
  private mqttSignalingSub?: Subscription;
  private mqttCallSub?: Subscription;

  private durationTimer: any;
  private startTime: number = 0;

  private readonly configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  private signalingListenTopic = 'owntracks/+/+/rtc';
  private incomingCallListenTopic = 'owntracks/+/+/call';

  private readonly clientId = `web-${Math.random().toString(36).slice(2, 10)}`;
  private processedMessageIds = new Set<string>();

  constructor(
    private readonly mqttConnectionService: MqttConnectionService,
    private readonly audioCallService: AudioCallService
  ) { }

  ngOnInit(): void {
    // Escuta estado da chamada
    this.subscriptions.add(
      this.audioCallService.callState$.subscribe(state => {
        const prevState = this.callState;
        this.callState = state;
        
        if (state === 'OUTGOING' && prevState === 'IDLE') {
          this.initOutgoingCall();
        } else if (state === 'IN_CALL' && prevState === 'RINGING') {
          // Usuário atendeu
        } else if (state === 'IDLE') {
          this.stopCall();
        }
      })
    );

    this.subscriptions.add(
      this.audioCallService.callInfo$.subscribe(info => {
        this.callInfo = info;
      })
    );

    // Escuta MQTT quando conectado
    this.subscriptions.add(
      this.mqttConnectionService.connected$.subscribe((isConnected: boolean) => {
        if (isConnected) {
          this.subscribeGlobalMqtt();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopCall();
    this.mqttSignalingSub?.unsubscribe();
    this.mqttCallSub?.unsubscribe();
  }

  // --- UI ACTIONS ---

  public acceptCall(): void {
    this.audioCallService.acceptCall();
  }

  public rejectCall(): void {
    this.audioCallService.endCall();
  }

  public hangupCall(): void {
    this.audioCallService.endCall();
  }

  // --- MQTT & WEBRTC LOGIC ---

  private subscribeGlobalMqtt(): void {
    if (this.mqttSignalingSub && !this.mqttSignalingSub.closed) return;

    this.mqttSignalingSub = this.mqttConnectionService.observe(this.signalingListenTopic).subscribe({
      next: (msg: any) => this.handleSignalingMessage(msg)
    });

    this.mqttCallSub = this.mqttConnectionService.observe(this.incomingCallListenTopic).subscribe({
      next: (msg: any) => this.handleIncomingCallMessage(msg)
    });
  }

  private handleIncomingCallMessage(message: any): void {
    const payload = this.parseMqttPayload(message);
    if (!payload || payload._type !== 'call' || payload.senderId === this.clientId) return;

    if (this.isDuplicate(payload._id)) return;

    const parts = message.topic.split('/');
    if (parts.length >= 3) {
      const deviceTopic = `${parts[0]}/${parts[1]}/${parts[2]}`;
      if (this.callState === 'IDLE') {
        this.audioCallService.receiveIncomingCall(deviceTopic, parts[2]);
      }
    }
  }

  private async initOutgoingCall(): Promise<void> {
    if (!this.callInfo) return;
    const callPublishTopic = `${this.callInfo.deviceId}/call`;
    
    this.mqttConnectionService.unsafePublish(
      callPublishTopic,
      JSON.stringify({ _type: 'call', senderId: this.clientId, _id: this.generateMessageId() }),
      { qos: 1, retain: false }
    );
  }

  private stopCall(): void {
    this.stopDurationTimer();
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = undefined;
    }
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = undefined;

    if (this.remoteAudio?.nativeElement) {
      this.remoteAudio.nativeElement.srcObject = null;
    }
  }

  private handleSignalingMessage(message: any): void {
    const payload = this.parseMqttPayload(message);
    if (!payload || payload._type !== 'rtc') return;
    if (this.isDuplicate(payload._id) || payload.senderId === this.clientId) return;

    if (payload.subtype === 'offer') {
      if (this.callState === 'IN_CALL' || this.callState === 'OUTGOING') {
        this.onReceivedOffer(payload);
      }
    } else if (payload.subtype === 'answer') {
      this.onReceivedAnswer(payload);
    } else if (payload.subtype === 'candidate') {
      this.onReceivedCandidate(payload);
    }
  }

  private async prepareLocalMedia(): Promise<void> {
    if (this.localStream) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (error) {
      console.error('Erro ao acessar o microfone:', error);
    }
  }

  private async ensurePeerConnection(): Promise<void> {
    if (this.peerConnection) return;

    await this.prepareLocalMedia();

    this.peerConnection = new RTCPeerConnection(this.configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callInfo) {
        this.sendSignalingMessage({
          _type: 'rtc',
          subtype: 'candidate',
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid!,
          sdpMLineIndex: event.candidate.sdpMLineIndex!,
          senderId: this.clientId
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (this.remoteAudio?.nativeElement) {
          this.remoteAudio.nativeElement.srcObject = event.streams[0];
          this.remoteAudio.nativeElement.play().catch(console.error);
        }
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'connected') {
        this.audioCallService.acceptCall();
        this.startDurationTimer();
      } else if (this.peerConnection?.iceConnectionState === 'disconnected' || this.peerConnection?.iceConnectionState === 'failed') {
        this.audioCallService.endCall();
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }
  }

  private async onReceivedOffer(payload: any): Promise<void> {
    await this.ensurePeerConnection();

    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: payload.sdp
      }));

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.sendSignalingMessage({
        _type: 'rtc',
        subtype: 'answer',
        sdp: answer.sdp,
        senderId: this.clientId
      });
      
      this.audioCallService.acceptCall();
    } catch (err) {
      console.error('Erro ao processar offer:', err);
    }
  }

  private async onReceivedAnswer(payload: any): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: payload.sdp
      }));
    } catch (err) {
      console.error('Erro ao processar answer:', err);
    }
  }

  private async onReceivedCandidate(payload: any): Promise<void> {
    if (!this.peerConnection) return;
    try {
      const candidate = new RTCIceCandidate({
        candidate: payload.candidate,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex
      });
      await this.peerConnection.addIceCandidate(candidate);
    } catch (err) {
      console.error('Erro ao adicionar ICE candidate:', err);
    }
  }

  private sendSignalingMessage(message: RtcSignal): void {
    if (!this.callInfo) return;
    message._id = this.generateMessageId();
    
    const topic = `${this.callInfo.deviceId}/rtc`;
    this.mqttConnectionService.unsafePublish(topic, JSON.stringify(message), { qos: 1, retain: false });
  }

  private parseMqttPayload(message: any): any {
    try {
      const str = typeof message.payload === 'string' ? message.payload : new TextDecoder().decode(message.payload);
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  private isDuplicate(id: string | undefined): boolean {
    if (!id) return false;
    if (this.processedMessageIds.has(id)) return true;
    this.processedMessageIds.add(id);
    return false;
  }

  private generateMessageId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.startTime = Date.now();
    this.durationTimer = setInterval(() => {
      const diff = Math.floor((Date.now() - this.startTime) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      this.callDuration = `${m}:${s}`;
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
    this.callDuration = '00:00';
  }
}
