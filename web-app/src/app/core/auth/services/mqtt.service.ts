import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IMqttMessage, MqttConnectionState, MqttService } from 'ngx-mqtt';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class MqttConnectionService {

  public connected$ = new BehaviorSubject<boolean>(false);
  private topicSubjects = new Map<string, Subject<IMqttMessage>>();
  private topicSubscriptions = new Map<string, Subscription>();
  
  // Cache para simular mensagens "retained" do MQTT localmente
  private messageCache = new Map<string, IMqttMessage>();

  constructor(
    private readonly mqttService: MqttService,
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService
  ) {
    this.mqttService.state.subscribe((state) => {
      const isConnected = state === MqttConnectionState.CONNECTED;
      this.connected$.next(isConnected);
    });
  }

  public observe(topic: string) {
    // Se ainda não temos uma ponte para esse tópico com o broker, criamos agora.
    if (!this.topicSubjects.has(topic)) {
      const subject = new Subject<IMqttMessage>();
      this.topicSubjects.set(topic, subject);
      
      const sub = this.mqttService.observe(topic).subscribe(
        msg => {
          // Atualiza o cache com a última mensagem deste subtópico exato
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
    
    // Converte o tópico MQTT (com + e #) para Regex para podermos buscar no cache
    const regexStr = '^' + topic.replace(/\+/g, '[^/]+').replace(/#/g, '.*') + '$';
    const topicRegex = new RegExp(regexStr);

    return new Observable<IMqttMessage>(observer => {
      // 1. Envia imediatamente todas as mensagens do cache que batem com o tópico
      for (const [msgTopic, msg] of this.messageCache.entries()) {
        if (topicRegex.test(msgTopic)) {
          observer.next(msg);
        }
      }

      // 2. Inscreve-se para receber as novas mensagens do Subject
      const sub = this.topicSubjects.get(topic)!.subscribe(observer);
      
      return () => sub.unsubscribe();
    });
  }

  public unsafePublish(topic: string, message: string, options?: any): void {
    this.mqttService.unsafePublish(topic, message, options);
  }

  /** Chame uma vez, por exemplo no AppComponent (ngOnInit) ou num APP_INITIALIZER. */
  init(): void {
    console.log('[MqttConnectionService] init() called');
    if (this.authService.isLoggedIn() && this.oauthService.getAccessToken()) {
      console.log('[MqttConnectionService] init() - Token is available, connecting immediately.');
      this.connectWithCurrentToken();
    } else {
      console.log('[MqttConnectionService] init() - No valid token found yet.');
    }

    // 'token_received' dispara tanto no login quanto num refresh (silent refresh).
    this.oauthService.events
      .pipe(filter((event: OAuthEvent) => event.type === 'token_received'))
      .subscribe(() => this.connectWithCurrentToken());

    // Se o refresh falhar (token realmente expirou e não deu pra renovar),
    // pelo menos você fica sabendo — decida aqui se quer desconectar o MQTT também.
    this.oauthService.events
      .pipe(filter((event: OAuthEvent) => event.type === 'token_expires'))
      .subscribe(() => {
        console.warn('Token OAuth expirando — verifique se o refresh silencioso está configurado.');
      });
  }

  private connectWithCurrentToken(): void {
    const token = this.oauthService.getAccessToken();
    console.log('[MqttConnectionService] connectWithCurrentToken called. Token length:', token ? token.length : 'none');

    const options = {
      hostname: environment.urlWebSocket,
      port: environment.portaWebSocket,
      protocol: environment.protocoloWebSocket,
      path: '/ws',
      username: this.authService.extrairEmailUsuario(),
      password: token
    };

    console.log('[MqttConnectionService] Connecting with options:', { ...options, password: '***' });

    this.mqttService.connect(options);
  }
}
