import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { AppModule, authConfig } from './app.module';
import { MegaMenuModule } from 'primeng/megamenu';
import { MqttConnectionService } from './core/auth/services/mqtt.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    AppModule,
    MegaMenuModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'front';


  constructor(
    private oauthService: OAuthService,
    private mqttConnectionService: MqttConnectionService
  ) { }

  ngOnInit() {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      console.log('[AppComponent] loadDiscoveryDocumentAndTryLogin resolved.');
      this.mqttConnectionService.init();
    }).catch(err => {
      console.error('[AppComponent] loadDiscoveryDocumentAndTryLogin error:', err);
    });
  }
}
