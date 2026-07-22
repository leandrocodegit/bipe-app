import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';
import { ButtonModule } from 'primeng/button';
import { AudioCallService, CallInfo } from '@/shared/services/audio-call.service';
import { OAuthService } from 'angular-oauth2-oidc';

export type BipeStage = 'IDLE' | 'START' | 'WAITING_ACCEPT' | 'ACCEPTED' | 'COMPLETED' | 'TIMEOUT' | 'ERROR';

@Component({
  selector: 'app-notificacao-bipe',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './notificacao-bipe.component.html',
  styleUrl: './notificacao-bipe.component.scss'
})
export class NotificacaoBipeComponent implements OnInit, OnDestroy {

  public statusStage: BipeStage = 'IDLE';
  public callInfo: CallInfo | null = null;

  public remoteNickName?: string;
  public remoteUserName?: string;
  public remoteIcon?: string;
  public remoteColor?: string;

  public displayTitle: string = '';
  public displaySubtitle: string = '';
  public statusMessage: string = '';
  public completedCount: number = 0;

  private subscriptions = new Subscription();
  private mqttSignalingSub?: Subscription;
  private callTimeoutTimer: any;
  private autoDismissTimer: any;
  private jaAceitou = false;

  constructor(
    private readonly mqttConnectionService: MqttConnectionService,
    private readonly audioCallService: AudioCallService,
    private readonly oauthService: OAuthService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.audioCallService.bipeState$.subscribe(state => {
        if (state === 'BIPE' && this.audioCallService.currentCallInfo) {
          this.callInfo = this.audioCallService.currentCallInfo;
          this.iniciarFluxoBipe();
        }
      })
    );

    this.subscriptions.add(
      this.mqttConnectionService.connected$.subscribe((isConnected: boolean) => {
        if (isConnected && this.statusStage === 'WAITING_ACCEPT') {
          this.subscribeBipeMqtt();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.cancelarBipe();
    this.subscriptions.unsubscribe();
  }

  public iniciarFluxoBipe(): void {
    if (!this.callInfo) return;

    console.log('Iniciando fluxo de Bipe para:', this.callInfo);

    this.stopCallTimeout();
    this.stopAutoDismiss();

    this.statusStage = 'START';
    this.remoteNickName = undefined;
    this.remoteUserName = undefined;
    this.remoteIcon = undefined;
    this.remoteColor = undefined;

    this.displayTitle = 'Solicitando Bipe...';
    this.displaySubtitle = 'Aguardando resposta';
    this.statusMessage = 'Aguardando resposta do dispositivo';
    this.completedCount = 0;

    this.cdr.detectChanges();

    this.subscribeBipeMqtt();

    this.startCallTimeout();
  }

  private subscribeBipeMqtt(): void {
    if (this.mqttSignalingSub && !this.mqttSignalingSub.closed) {
      this.mqttSignalingSub.unsubscribe();
    }

    if (!this.callInfo) return;

    const callBipeTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/bipe`;

    console.log('Inscrito no tópico de resposta do Bipe:', callBipeTopic);

    this.mqttSignalingSub = this.mqttConnectionService.observe(callBipeTopic).subscribe({
      next: (msg: any) => {
        this.handleBipeMessage(msg);
      },
      error: (err: any) => {
        console.error('Erro na assinatura do bipe MQTT:', err);
      }
    });
  }

  private handleBipeMessage(msg: any): void {
    try {
      const jsonString = typeof msg.payload === 'string'
        ? msg.payload
        : new TextDecoder('utf-8').decode(msg.payload);
      const payload = JSON.parse(jsonString);

      console.log('Mensagem de Bipe recebida no /bipe:', payload);

      const status = (payload.status || payload.action || '').toUpperCase();

      if (status === 'ACCEPTED') {
        if (this.statusStage === 'COMPLETED') {
          console.log('Ignorando status ACCEPTED pois o bipe já está concluído (COMPLETED)');
          return;
        }
        this.stopCallTimeout();
        this.statusStage = 'ACCEPTED';
        this.remoteNickName = payload.nickname || payload.nicknameConfigured || payload.apelido || payload.nome;
        this.remoteUserName = payload.userName || payload.username || payload.user || this.callInfo?.userName;
        this.remoteIcon = payload.icon || payload.face || payload.mascot || 'urso';
        this.remoteColor = payload.color || '#3b82f6';

        const name = this.remoteNickName || this.remoteUserName || this.callInfo?.userName || 'Dispositivo';
        this.displayTitle = name;
        this.displaySubtitle = this.remoteNickName && this.remoteUserName ? `@${this.remoteUserName}` : '';
        this.statusMessage = 'Aguardando usuário interagir';

        this.cdr.detectChanges();
      } else if (status === 'COMPLETED') {
        this.stopCallTimeout();
        this.statusStage = 'COMPLETED';
        const name = this.remoteNickName || this.remoteUserName || this.callInfo?.userName || 'Dispositivo';
        this.statusMessage = `${name} (${this.completedCount}x)!`;
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Erro ao ler payload de bipe MQTT:', err);
    }
  }

  private sendInitialBipeCmd(): void {
    if (!this.callInfo) return;
    const bipeTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/bipe`;
    const cmdTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/cmd`;

    const initialPayload = JSON.stringify({
      _type: 'bipe',
      token: this.oauthService.getAccessToken()
    });

    console.log('Enviando comando inicial de Bipe para:', bipeTopic);
    this.mqttConnectionService.unsafePublish(bipeTopic, initialPayload, { qos: 1, retain: false });
    this.mqttConnectionService.unsafePublish(cmdTopic, initialPayload, { qos: 1, retain: false });
  }

  public confirmarExecutarBipe(): void {
    if (!this.callInfo) return;

    const bipeTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/bipe`;
    const cmdTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/cmd`;

    const completePayload = JSON.stringify({
      _type: 'bipe',
      status: 'START',
      token: this.oauthService.getAccessToken()
    });

    console.log('Enviando comando de conclusão de Bipe (COMPLETE) para:', bipeTopic);

    this.mqttConnectionService.unsafePublish(cmdTopic, completePayload, { qos: 1, retain: false });

    this.statusStage = 'WAITING_ACCEPT';
    this.completedCount++;
    const name = this.remoteNickName || this.remoteUserName || this.callInfo.userName || 'Dispositivo';
    this.statusMessage = `Bipe enviado com sucesso para ${name} (${this.completedCount}x)!`;
    this.cdr.detectChanges();
  }

  public cancelarBipe(): void {
    this.stopCallTimeout();
    this.stopAutoDismiss();
    if (this.mqttSignalingSub && !this.mqttSignalingSub.closed) {
      this.mqttSignalingSub.unsubscribe();
    }
    this.statusStage = 'IDLE';
    this.callInfo = null;
    this.remoteNickName = undefined;
    this.remoteUserName = undefined;
    this.remoteIcon = undefined;
    this.remoteColor = undefined;

    this.displayTitle = '';
    this.displaySubtitle = '';
    this.statusMessage = '';
    this.completedCount = 0;

    this.cdr.detectChanges();
  }

  private startCallTimeout(): void {
    this.stopCallTimeout();
    this.callTimeoutTimer = setTimeout(() => {
      if (this.statusStage === 'WAITING_ACCEPT') {
        this.statusStage = 'TIMEOUT';
        this.statusMessage = 'Dispositivo remoto não respondeu ao bipe.';
        this.cdr.detectChanges();
        this.startAutoDismiss(5000);
      }
    }, 30000);
  }

  private stopCallTimeout(): void {
    if (this.callTimeoutTimer) {
      clearTimeout(this.callTimeoutTimer);
      this.callTimeoutTimer = null;
    }
  }

  private startAutoDismiss(ms: number): void {
    this.stopAutoDismiss();
    this.autoDismissTimer = setTimeout(() => {
      this.cancelarBipe();
    }, ms);
  }

  private stopAutoDismiss(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }
}
