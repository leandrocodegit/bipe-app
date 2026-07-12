import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { KeycloakAccountSettingsComponent } from '../keycloak/keycloak-account-settings/keycloak-account-settings.component';
import { KeycloakSessionsComponent } from '../keycloak/keycloak-sessions/keycloak-sessions.component';
import { KeycloakUserProfileComponent } from '../keycloak/keycloak-user-profile/keycloak-user-profile.component';

@Component({
  selector: 'app-painel-conta',
  imports: [
    RouterModule,
    BreadcrumbModule,
    KeycloakUserProfileComponent,
    KeycloakSessionsComponent,
    KeycloakAccountSettingsComponent
  ],
  templateUrl: './painel-conta.component.html',
  styleUrl: './painel-conta.component.scss'
})
export class PainelContaComponent implements OnInit {

  protected items: MenuItem[] | undefined;
  protected home: MenuItem | undefined;

  ngOnInit() {
    this.items = [
      { label: 'Meus Protocolos', route: '/' },
      { label: 'Minha Conta', route: '/' },
      { label: 'Accessories' },
      { label: 'Keyboard' },
      { label: 'Wireless' }
    ];

    this.home = { icon: 'pi pi-home', routerLink: '/' };
  }
}
