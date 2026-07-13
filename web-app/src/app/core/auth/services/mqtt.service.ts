import { Injectable } from '@angular/core';
import { MQTT_SERVICE_OPTIONS, MqttService } from 'ngx-mqtt';
import { OAuthEvent, OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class MqttConnectionService {
  constructor(
    private readonly mqttService: MqttService,
    private readonly oauthService: OAuthService
  ) {}

  /** Chame uma vez, por exemplo no AppComponent (ngOnInit) ou num APP_INITIALIZER. */
  init(): void {
    if (this.oauthService.hasValidAccessToken()) {
      this.connectWithCurrentToken();
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
    this.mqttService.connect({
      ...MQTT_SERVICE_OPTIONS,
      password: this.oauthService.getAccessToken(),
    });
  }
}
