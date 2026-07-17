import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Subscription, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IMqttMessage, IOnErrorEvent, MqttConnectionState, MqttService } from 'ngx-mqtt';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class MqttConnectionService {

  public connected$ = new BehaviorSubject<boolean>(false);
  private topicSubjects = new Map<string, Subject<IMqttMessage>>();
  private topicSubscriptions = new Map<string, Subscription>();
  private messageCache = new Map<string, IMqttMessage>();

  // Evita múltiplas chamadas simultâneas de refresh de token
  private isRefreshing = false;
  private onErrorSubscription?: Subscription;
  private readonly clientId = `web-${Math.random().toString(36).slice(2, 10)}`;

  constructor(
    private readonly mqttService: MqttService,
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.mqttService.state.subscribe((state) => {
      const isConnected = state === MqttConnectionState.CONNECTED;
      this.connected$.next(isConnected);
    });
    // Quando o cliente se reconectar, garante que os tópicos sejam re-subscriptos
    this.mqttService.state.subscribe((state) => {
      if (state === MqttConnectionState.CONNECTED) {
        this.reconnectTopicSubscriptions();
      }
    });
  }

  public observe(topic: string): Observable<IMqttMessage> {
    if (!this.topicSubjects.has(topic)) {
      const subject = new Subject<IMqttMessage>();
      this.topicSubjects.set(topic, subject);

      const sub = this.mqttService.observe(topic).subscribe(
        msg => {
          this.messageCache.set(msg.topic, msg);
          subject.next(msg);
        },
        err => {
          this.topicSubjects.delete(topic);
          subject.error(err);
        },
        () => {
          this.topicSubjects.delete(topic);
          subject.complete();
        }
      );
      this.topicSubscriptions.set(topic, sub);
    }

    const regexStr = '^' + topic.replace(/\+/g, '[^/]+').replace(/#/g, '.*') + '$';
    const topicRegex = new RegExp(regexStr);

    return new Observable<IMqttMessage>(observer => {
      for (const [msgTopic, msg] of this.messageCache.entries()) {
        if (topicRegex.test(msgTopic)) {
          observer.next(msg);
        }
      }

      const sub = this.topicSubjects.get(topic)!.subscribe(observer);
      return () => sub.unsubscribe();
    });
  }

  public unsafePublish(topic: string, message: string, options?: any): void {
    this.mqttService.unsafePublish(topic, message, options);
  }

  init(): void {
    console.log('[MqttConnectionService] init() called');
    if (this.authService.isLoggedIn() && this.oauthService.getAccessToken()) {
      console.log('[MqttConnectionService] init() - Token is available, connecting immediately.');
      this.connectWithCurrentToken();
    } else {
      console.log('[MqttConnectionService] init() - No valid token found yet.');
    }

    this.oauthService.events
      .pipe(filter((event: OAuthEvent) => event.type === 'token_received'))
      .subscribe(() => this.connectWithCurrentToken());

    this.oauthService.events
      .pipe(filter((event: OAuthEvent) => event.type === 'token_expires'))
      .subscribe(() => {
        console.warn('Token OAuth expirando — verifique se o refresh silencioso está configurado.');
      });

    // Reconnect quando a aba voltar a ficar visível (ex: após sleep do SO)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleVisibilityResume();
      }
    });
  }

  /**
   * Centraliza a configuração e tentativa de conexão no broker MQTT
   */
  private connectBroker(): void {
    this.mqttService.connect({
      hostname: environment.urlWebSocket,
      port: environment.portaWebSocket,
      protocol: environment.protocoloWebSocket,
      path: '/ws',
      username: this.authService.extrairEmailUsuario(),
      password: this.oauthService.getAccessToken(),
      clientId: `web-app-${this.clientId}`
    });
  }

  private connectWithCurrentToken(): void {
    this.connectBroker();

    // Inscreve no onError somente uma vez
    if (!this.onErrorSubscription || this.onErrorSubscription.closed) {
      this.onErrorSubscription = this.mqttService.onError.subscribe((error: IOnErrorEvent) => {
      const isNotAuthorized = error.message.toLowerCase().includes('not authorized');
      const isRefused = error.message.toLowerCase().includes('refused');

      if ((isNotAuthorized || isRefused) && !this.isRefreshing) {
        this.isRefreshing = true;

        console.warn(`[MqttConnectionService] Conexão falhou (${error.message}). Tentando atualizar o token...`);

        if (isRefused) {
          this.mqttService.disconnect();
        }

        this.authService.refreshToken().subscribe({
          next: (success: boolean) => {
            this.isRefreshing = false;

            if (success) {
              console.log('[MqttConnectionService] Token atualizado com sucesso! Reconectando ao MQTT...');
              this.connectBroker();
            } else {
              console.error('[MqttConnectionService] Falha ao renovar token. Redirecionando para login.');
              this.redirectToLogin();
            }
          },
          error: (err) => {
            this.isRefreshing = false;
            console.error('[MqttConnectionService] Erro crítico no refresh token:', err);
            this.redirectToLogin();
          }
        });
      }
    });
    }
  }

  private handleVisibilityResume(): void {
    try {
      if (!this.authService.isLoggedIn()) return;

      if (this.connected$.value) {
        // Já conectado, nada a fazer
        return;
      }

      const token = this.oauthService.getAccessToken();
      if (!token) {
        // Tenta refresh de token antes de reconectar
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.authService.refreshToken().subscribe({
            next: (success: boolean) => {
              this.isRefreshing = false;
              if (success) {
                this.connectBroker();
              } else {
                this.redirectToLogin();
              }
            },
            error: (err) => {
              this.isRefreshing = false;
              console.error('[MqttConnectionService] Erro no refresh ao retomar visibilidade:', err);
              this.redirectToLogin();
            }
          });
        }
      } else {
        // Token presente, apenas conecta
        this.connectWithCurrentToken();
      }
    } catch (err) {
      console.error('[MqttConnectionService] Erro ao tratar visibilidade:', err);
    }
  }

  private reconnectTopicSubscriptions(): void {
    for (const [topic, subject] of this.topicSubjects.entries()) {
      const currentSub = this.topicSubscriptions.get(topic);
      if (!currentSub || (currentSub && currentSub.closed)) {
        const sub = this.mqttService.observe(topic).subscribe(
          msg => {
            this.messageCache.set(msg.topic, msg);
            subject.next(msg);
          },
          err => {
            this.topicSubjects.delete(topic);
            subject.error(err);
          },
          () => {
            this.topicSubjects.delete(topic);
            subject.complete();
          }
        );
        this.topicSubscriptions.set(topic, sub);
      }
    }
  }

  private redirectToLogin(): void {
    this.mqttService.disconnect();
    // Você também pode usar this.authService.logout() caso o seu serviço de autenticação limpe a sessão
    this.router.navigate(['/login']);
  }
}
