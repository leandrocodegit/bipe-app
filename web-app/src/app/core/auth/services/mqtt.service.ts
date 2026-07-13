import { Injectable } from '@angular/core';
import { MqttService } from 'ngx-mqtt';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class MqttConnectionService {
  constructor(
    private readonly mqttService: MqttService,
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService
  ) {}

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
      username: 'web-app',
      password: token
    };

    console.log('[MqttConnectionService] Connecting with options:', { ...options, password: '***' });

    this.mqttService.connect(options);
  }
}
