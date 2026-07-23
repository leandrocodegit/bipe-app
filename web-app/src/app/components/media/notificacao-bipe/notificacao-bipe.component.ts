import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';
import { ButtonModule } from 'primeng/button';
import { AudioCallService, CallInfo } from '@/shared/services/audio-call.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { DeviceService } from '@/shared/services/device.service';
import { AuthService } from '@/core/auth/services/auth.service';

export type BipeStage = 'IDLE' | 'START' | 'WAITING_ACCEPT' | 'ACCEPTED' | 'COMPLETED' | 'VIBRATE_COMPLETED' | 'TIMEOUT' | 'ERROR' | 'FORCE';

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
  private holdTimer: any;
  private isLongPress = false;

  private readonly clientId = `web-${Math.random().toString(36).slice(2, 10)}`;

  constructor(
    private readonly mqttConnectionService: MqttConnectionService,
    private readonly audioCallService: AudioCallService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly deviceService: DeviceService
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.audioCallService.bipeState$.subscribe(state => {
        console.log('Mensagem de Bipe recebida no /bipe:', state);
        if (state === 'BIPE' && this.audioCallService.currentCallInfo) {
          this.callInfo = this.audioCallService.currentCallInfo;
          this.iniciarFluxoBipe();
        }

        this.callInfo = this.audioCallService.currentCallInfo;
        console.log('Iniciando fluxo de Bipe para:', this.callInfo);
      })
    );

    this.subscriptions.add(
      this.mqttConnectionService.connected$.subscribe((isConnected: boolean) => {
        if (isConnected) {
          this.subscribeGlobalBipeMqtt();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.cancelarBipe();
    if (this.mqttSignalingSub && !this.mqttSignalingSub.closed) {
      this.mqttSignalingSub.unsubscribe();
    }
    this.subscriptions.unsubscribe();
  }

  public iniciarFluxoBipe(): void {
    if (!this.callInfo) return;



    this.stopCallTimeout();
    this.stopAutoDismiss();

    this.statusStage = 'START';
    delete this.remoteNickName;
    delete this.remoteUserName;
    this.remoteIcon = this.callInfo?.card?.face;
    this.remoteColor = this.callInfo?.card?.color;

    this.displayTitle = 'Solicitando Bipe...';
    this.displaySubtitle = 'Aguardando resposta';
    this.statusMessage = 'Aguardando resposta do dispositivo';
    this.completedCount = 0;

    this.cdr.detectChanges();

    this.startCallTimeout();
  }

  private subscribeGlobalBipeMqtt(): void {
    if (this.mqttSignalingSub && !this.mqttSignalingSub.closed) {
      this.mqttSignalingSub.unsubscribe();
    }

    const globalBipeTopic = `bipe/${this.authService.extrairEmailUsuario()}/push/${this.authService.extrairIdUsuario()}`;
    console.log('Inscrito no tópico global de Bipe:', globalBipeTopic);

    this.mqttSignalingSub = this.mqttConnectionService.observe(globalBipeTopic).subscribe({
      next: (msg: any) => {
        this.handleBipeMessage(msg);
      },
      error: (err: any) => {
        console.error('Erro na assinatura global do bipe MQTT:', err);
      }
    });
  }

  handleBipeMessage(msg: any): void {
    try {
      const jsonString = typeof msg.payload === 'string'
        ? msg.payload
        : new TextDecoder('utf-8').decode(msg.payload);
      const payload = JSON.parse(jsonString);

      if (payload._type !== 'bipe' && payload._type !== 'vibrate') return;

      console.log('Mensagem de Bipe recebida no /bipe:', payload);

      const status = (payload.status || payload.action || '').toUpperCase();

      this.remoteNickName = payload.nickname || payload.nicknameConfigured || payload.apelido || payload.nome;
      this.remoteUserName = payload.userName || payload.username || payload.user || this.callInfo?.userName;
      this.remoteIcon = payload.icon || payload.face || payload.mascot;
      this.remoteColor = payload.color || '#3b82f6';

      // Se for FORCE, sempre mostra a notificação (mesmo que esteja em IDLE ou em outro estado)
      if (status === 'FORCE') {
        const parts = msg.topic.split('/');
        const topicUserName = parts[1];
        const topicDeviceId = parts[2];

        // Garante que callInfo está configurado para o dispositivo do FORCE
        if (!this.callInfo || this.callInfo.deviceId !== topicDeviceId) {
          this.callInfo = {
            deviceId: topicDeviceId,
            userName: topicUserName,
            direction: 'incoming'
          };
        }

        this.stopCallTimeout();
        this.statusStage = 'FORCE';
        this.statusMessage = `RECURSO FORÇADO`;

        const name = this.remoteNickName || this.remoteUserName || topicUserName || 'Dispositivo';
        this.displayTitle = name;
        this.displaySubtitle = this.remoteNickName && this.remoteUserName ? `@${this.remoteUserName}` : '';

        this.playAlertSound();

        this.cdr.detectChanges();
        return;
      }

      // Para outros status, só processa se estivermos em um fluxo ativo para este dispositivo
      if (this.statusStage === 'IDLE' || !this.callInfo) {
        return;
      }

      // Verifica se a mensagem pertence ao dispositivo ativo que estamos chamando
      const parts = msg.topic.split('/');
      const topicDeviceId = parts[2];
      if (this.callInfo.deviceId !== topicDeviceId) {
        return;
      }

      if (status === 'ACCEPTED') {
        if (this.statusStage === 'COMPLETED') {
          console.log('Ignorando status ACCEPTED pois o bipe já está concluído (COMPLETED)');
          return;
        }
        this.stopCallTimeout();
        this.statusStage = 'ACCEPTED';

        const name = this.remoteNickName || this.remoteUserName || this.callInfo?.userName || 'Dispositivo';
        this.displayTitle = name;
        this.displaySubtitle = this.remoteNickName && this.remoteUserName ? `@${this.remoteUserName}` : '';
        this.statusMessage = 'Aguardando usuário interagir';

        this.cdr.detectChanges();
      } else if (status === 'COMPLETED' || status === 'VIBRATE_COMPLETED') {
        this.stopCallTimeout();
        this.statusStage = status;
        const name = this.remoteNickName || this.remoteUserName || this.callInfo?.userName || 'Dispositivo';
        this.statusMessage = `${name} (${this.completedCount}x)!`;

        this.playSuccessSound();

        this.cdr.detectChanges();
      }
    } catch (err) {
      console.error('Erro ao ler payload de bipe MQTT:', err);
    }
  }

  public startHold(event?: Event): void {
    this.isLongPress = false;
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
    }
    this.holdTimer = setTimeout(() => {
      this.isLongPress = true;
      this.executarBipeForce();
    }, 3000);
  }

  public endHold(event?: Event): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (!this.isLongPress) {
      this.confirmarExecutarBipe();
    }
  }

  public cancelHold(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  public executarBipeForce(): void {
    if (!this.callInfo) return;

    const type = 'bipe';
    const status = 'FORCE';

    console.log('Enviando comando de Bipe FORCE via backend para dispositivo:', this.callInfo.deviceId);

    this.deviceService.sendCommand(this.callInfo.deviceId, { type, status }).subscribe({
      next: () => {
        this.statusStage = 'WAITING_ACCEPT';
        this.completedCount++;
        const name = this.remoteNickName || this.remoteUserName || this.callInfo?.userName || 'Dispositivo';
        this.statusMessage = `Bipe FORÇADO enviado para ${name} (${this.completedCount}x)!`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao enviar bipe FORCE:', err);
      }
    });
  }

  public confirmarExecutarBipe(): void {
    if (!this.callInfo) return;

    const type = this.callInfo.vibrate ? 'vibrate' : 'bipe';
    const status = 'START';

    console.log('Enviando comando de Bipe via backend para dispositivo:', this.callInfo.deviceId);

    this.deviceService.sendCommand(this.callInfo.deviceId, { type, status }).subscribe({
      next: () => {
        this.statusStage = 'WAITING_ACCEPT';
        this.completedCount++;
        const name = this.remoteNickName || this.remoteUserName || this.callInfo?.userName || 'Dispositivo';
        this.statusMessage = `Bipe enviado com sucesso para ${name} (${this.completedCount}x)!`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao enviar bipe:', err);
      }
    });
  }



  public cancelarBipe(forceStop?: boolean): void {

    if (!this.callInfo) return;

    const cmdTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/cmd`;
    const bipeTopic = `owntracks/${this.callInfo.userName}/${this.callInfo.deviceId}/bipe`;

    const initialPayload = JSON.stringify({
      _type: 'STOP'
    });

    this.mqttConnectionService.unsafePublish(cmdTopic, initialPayload, { qos: 1, retain: false });
    if (forceStop)
      this.mqttConnectionService.unsafePublish(bipeTopic, '{}', { qos: 1, retain: true });

    this.stopCallTimeout();
    this.stopAutoDismiss();
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

  private playAlertSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Tom do alarme
      oscillator.type = 'sawtooth';

      const time = audioCtx.currentTime;
      oscillator.frequency.setValueAtTime(880, time);
      oscillator.frequency.setValueAtTime(660, time + 0.15);
      oscillator.frequency.setValueAtTime(880, time + 0.3);
      oscillator.frequency.setValueAtTime(660, time + 0.45);

      gainNode.gain.setValueAtTime(0.4, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

      oscillator.start();
      oscillator.stop(time + 0.6);
    } catch (e) {
      console.warn('Web Audio API não suportada ou bloqueada pelo navegador:', e);
    }
  }

  private playSuccessSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Tom de sucesso simples (sine wave suave)
      oscillator.type = 'sine';

      const time = audioCtx.currentTime;

      // Nota 1: C5 (Dó)
      oscillator.frequency.setValueAtTime(523.25, time);
      gainNode.gain.setValueAtTime(0.25, time);
      gainNode.gain.linearRampToValueAtTime(0.01, time + 0.08);

      // Nota 2: E5 (Mi)
      oscillator.frequency.setValueAtTime(659.25, time + 0.1);
      gainNode.gain.setValueAtTime(0.25, time + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.01, time + 0.22);

      oscillator.start(time);
      oscillator.stop(time + 0.22);
    } catch (e) {
      console.warn('Web Audio API não suportada ou bloqueada pelo navegador:', e);
    }
  }
}
