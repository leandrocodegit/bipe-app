import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';
import { ButtonModule } from 'primeng/button';

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
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './audio-webrtc.component.html',
  styleUrl: './audio-webrtc.component.scss'
})
export class AudioWebrtcComponent implements OnInit {
  @ViewChild('localVideo', { static: true }) localVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteAudio', { static: true }) remoteAudio?: ElementRef<HTMLAudioElement>;

  protected isLocal = false;
  protected mensagensLocal: any[] = [];
  protected mensagensRemoto: any[] = [];
  protected mensagem: any = {
    sessaoid: '',
    tipo: '',
    data: ''
  };

  private peerConnection?: RTCPeerConnection;
  private localStream?: MediaStream;
  private mqttSubscription?: Subscription;
  private mqttCallSubscription?: Subscription;

  private readonly configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  private readonly callPublishTopic = 'owntracks/user_5490c9b2/4713edf5-52f1-4cc7-a539-33c8cea4a82a/call';
  private readonly signalingPublishTopic = 'owntracks/user_5490c9b2/4713edf5-52f1-4cc7-a539-33c8cea4a82a/rtc';
  private readonly signalingListenTopic = 'owntracks/+/+/rtc';

  private readonly offerOptions = {
    offerToReceiveAudio: false,
    offerToReceiveVideo: false
  };

  private readonly clientId = `web-${Math.random().toString(36).slice(2, 10)}`;
  private processedMessageIds = new Set<string>();

  constructor(private readonly mqttConnectionService: MqttConnectionService) { }

  private connectedSubscription?: Subscription;

  ngOnInit(): void {
    this.connectedSubscription = this.mqttConnectionService.connected$.subscribe(
      (isConnected: boolean) => {
        console.log('MQTT Connected:', isConnected);
        if (isConnected) {
          this.init();
        }
      }
    );
  }

  private init(): void {
    if (this.mqttSubscription && !this.mqttSubscription.closed) {
      return;
    }

    // subscribe to RTC signaling
    this.mqttSubscription = this.mqttConnectionService.observe(this.signalingListenTopic).subscribe({
      next: (message: any) => this.handleMqttMessage(message),
      error: (err) => console.error('Erro na assinatura MQTT RTC:', err)
    });

    // subscribe to incoming call commands as well
    this.mqttCallSubscription = this.mqttConnectionService.observe(this.callPublishTopic).subscribe({
      next: (message: any) => this.handleCallMessage(message),
      error: (err) => console.error('Erro na assinatura MQTT CALL:', err)
    });
  }

  private handleMqttMessage(message: any): void {
    const payloadString = typeof message.payload === 'string'
      ? message.payload
      : new TextDecoder().decode(message.payload);

    let payload: any;
    try {
      payload = JSON.parse(payloadString);
      console.warn(payload);
    } catch (err) {
      console.warn('Payload MQTT n�o � JSON:', payloadString);
      return;
    }

    if (!payload || payload._type !== 'rtc') {
      return;
    }

    if (payload._id) {
      if (this.processedMessageIds.has(payload._id)) {
        console.warn('Duplicate RTC message ignored:', payload._id);
        return;
      }
      this.processedMessageIds.add(payload._id);
    }

    if (payload.senderId === this.clientId) {
      console.warn('Ignored own message from same clientId');
      return;
    }

    if (payload.subtype === 'offer') {
      this.mensagensRemoto.push({ tipo: 'offer', sessaoid: payload.sessaoid || '' });
      this.onReceivedOffer(payload);
      return;
    }

    if (payload.subtype === 'answer') {
      this.mensagensRemoto.push({ tipo: 'answer', sessaoid: payload.sessaoid || '' });
      this.onReceivedAnswer(payload);
      return;
    }

    if (payload.subtype === 'candidate') {
      this.onReceivedCandidate(payload);
      return;
    }

    console.warn('RTC subtype desconhecido:', payload.subtype);
  }

  private async handleCallMessage(message: any): Promise<void> {
    const payloadString = typeof message.payload === 'string'
      ? message.payload
      : new TextDecoder().decode(message.payload);

    let payload: any;
    try {
      payload = JSON.parse(payloadString);
    } catch (err) {
      console.warn('Payload CALL MQTT não é JSON:', payloadString);
      return;
    }

    if (!payload || payload._type !== 'call') {
      return;
    }

    if (payload._id) {
      if (this.processedMessageIds.has(payload._id)) {
        console.warn('Duplicate CALL message ignored:', payload._id);
        return;
      }
      this.processedMessageIds.add(payload._id);
    }

    if (payload.senderId === this.clientId) {
      console.warn('Ignored own CALL message from same clientId');
      return;
    }

    // Received a remote-triggered call from another device.
    // In remote-only mode we do NOT create an offer here; the remote device
    // is expected to create the offer and we will respond with an answer
    // when we receive the offer on the /rtc topic.
    console.log('CALL recebido via MQTT — aguardando offer no tópico /rtc');
    this.mensagensRemoto.push({ tipo: 'call', sessaoid: payload.sessaoid || '' });
  }

  private async handleIncomingCall(payload: any): Promise<void> {
    // Deprecated: in remote-only mode we don't create offers on incoming call.
    return;
  }

  protected async start(): Promise<void> {
    // Remote-only mode: publish a call command and let the device generate the offer.
    console.log('Publicando comando CALL para tópico:', this.callPublishTopic);
    this.mqttConnectionService.unsafePublish(
      this.callPublishTopic,
      JSON.stringify({ _type: 'call', senderId: this.clientId, _id: this.generateMessageId() }),
      { qos: 1, retain: false }
    );
  }

  protected async stop(): Promise<void> {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = undefined;
    }
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = undefined;

    if (this.remoteAudio?.nativeElement) {
      this.remoteAudio.nativeElement.srcObject = null;
    }
    if (this.localVideo?.nativeElement) {
      this.localVideo.nativeElement.srcObject = null;
    }
    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }

    // cleanup MQTT subscriptions
    try {
      this.mqttSubscription?.unsubscribe();
    } catch { }
    try {
      this.mqttCallSubscription?.unsubscribe();
    } catch { }
    try {
      this.connectedSubscription?.unsubscribe();
    } catch { }
  }

  private async prepareLocalMedia(): Promise<void> {
    if (this.localStream) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia n�o suportado neste navegador');
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      if (this.localVideo?.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
    } catch (error) {
      console.error('Erro ao acessar o microfone:', error);
    }
  }

  private async ensurePeerConnection(): Promise<void> {
    if (this.peerConnection) {
      return;
    }

    this.peerConnection = new RTCPeerConnection(this.configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      this.publishRtc({
        _type: 'rtc',
        senderId: this.clientId,
        _id: this.generateMessageId(),
        subtype: 'candidate',
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sessaoid: this.mensagem.sessaoid
      });
    };

    this.peerConnection.ontrack = (event) => {
      console.log('ontrack event:', event);
      const stream = event.streams && event.streams.length > 0 ? event.streams[0] : new MediaStream([event.track]);
      if (this.remoteAudio?.nativeElement) {
        this.remoteAudio.nativeElement.srcObject = stream;
        this.remoteAudio.nativeElement.autoplay = true;
       // this.remoteAudio.nativeElement.playsInline = true;
        this.remoteAudio.nativeElement.muted = false;
      }
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = stream;
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', this.peerConnection?.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => this.peerConnection!.addTrack(track, this.localStream!));
    } else {
      this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });
    }
  }

  private async onReceivedOffer(payload: RtcSignal): Promise<void> {
    await this.ensurePeerConnection();

    try {
      const offerDesc: RTCSessionDescriptionInit = { type: 'offer', sdp: payload.sdp };
      await this.peerConnection!.setRemoteDescription(offerDesc);
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      this.publishRtc({
        _type: 'rtc',
        senderId: this.clientId,
        _id: this.generateMessageId(),
        subtype: 'answer',
        sdp: answer.sdp,
        sessaoid: payload.sessaoid || this.mensagem.sessaoid
      });
      this.mensagensLocal.push({ tipo: 'answer', sessaoid: payload.sessaoid || '' });
    } catch (err) {
      console.error('Erro ao processar offer:', err);
    }
  }

  private async onReceivedAnswer(payload: RtcSignal): Promise<void> {
    if (!this.peerConnection) {
      console.warn('Answer recebido sem peerConnection existente');
      return;
    }

    if (payload.senderId === this.clientId) {
      console.warn('Ignored own answer from same clientId');
      return;
    }

    try {
      const answerDesc: RTCSessionDescriptionInit = { type: 'answer', sdp: payload.sdp };
      await this.peerConnection.setRemoteDescription(answerDesc);
      this.mensagensRemoto.push({ tipo: 'answer', sessaoid: payload.sessaoid || '' });
    } catch (err) {
      console.error('Erro ao processar answer:', err);
    }
  }

  private async onReceivedCandidate(payload: RtcSignal): Promise<void> {
    if (!this.peerConnection || !payload.candidate) {
      return;
    }

    if (payload.senderId === this.clientId) {
      console.warn('Ignored own ICE candidate from same clientId');
      return;
    }

    try {
      const candidate = new RTCIceCandidate({
        candidate: payload.candidate,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex
      });
      await this.peerConnection.addIceCandidate(candidate);
      this.mensagensRemoto.push({ tipo: 'candidate', sessaoid: payload.sessaoid || '' });
    } catch (err) {
      console.error('Erro ao adicionar ICE candidate:', err);
    }
  }

  private publishRtc(message: any): void {
    this.mqttConnectionService.unsafePublish(this.signalingPublishTopic, JSON.stringify(message), { qos: 1, retain: false });
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
