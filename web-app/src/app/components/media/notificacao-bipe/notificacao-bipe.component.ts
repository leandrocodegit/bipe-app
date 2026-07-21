import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';
import { ButtonModule } from 'primeng/button';
import { AudioCallService, CallState, CallInfo } from '@/shared/services/audio-call.service';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-notificacao-bipe',
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './notificacao-bipe.component.html',
  styleUrl: './notificacao-bipe.component.scss'
})
export class NotificacaoBipeComponent {

  @ViewChild('remoteAudio', { static: true }) remoteAudio?: ElementRef<HTMLAudioElement>;

  public callState: CallState = 'BIPE';
  public callInfo: CallInfo | null = null;
  public callDuration = '00:00';

  
  private subscriptions = new Subscription();
  private mqttSignalingSub?: Subscription;
  private mqttCallSub?: Subscription;

  private durationTimer: any;
  private callTimeoutTimer: any;
  private startTime: number = 0;
  protected resposta?: string;

  constructor(
    private readonly mqttConnectionService: MqttConnectionService,
    private readonly audioCallService: AudioCallService,
    private readonly oauthService: OAuthService
  ) { }

  ngOnInit(): void {
    // Escuta estado da chamada
    this.subscriptions.add(
      this.audioCallService.bipeState$.subscribe(state => {

        console.log('Bipe enviado', state);
        this.callState = state;
        this.subscribeGlobalMqtt()
        this.initSendBipe();
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
    this.mqttSignalingSub?.unsubscribe();
    this.mqttCallSub?.unsubscribe();
  }



  // --- MQTT & WEBRTC LOGIC ---

  private subscribeGlobalMqtt(): void {
    if (this.mqttSignalingSub && !this.mqttSignalingSub.closed) return;

    if (!this.callInfo) return;

    const callPublishTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/bipe`;

    console.log('Inscrito em ', callPublishTopic);
    

    this.mqttSignalingSub = this.mqttConnectionService.observe(callPublishTopic).subscribe({
      next: (msg: any) => {
        this.resposta = "Bipe foi respondido";
      }
    });
  }

  private async initSendBipe(): Promise<void> {
 
    if (!this.callInfo) return;
    const callPublishTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/cmd`;


     console.log(callPublishTopic);
    this.mqttConnectionService.unsafePublish(
      callPublishTopic,
      JSON.stringify(
        {
          _type: 'bipe',
          token: this.oauthService.getAccessToken()
        }),
      { qos: 1, retain: false }
    );
  }

  fechar(){
    delete this.resposta;
  }

  private stopCallTimeout(): void {
    if (this.callTimeoutTimer) {
      clearTimeout(this.callTimeoutTimer);
      this.callTimeoutTimer = null;
    }
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
