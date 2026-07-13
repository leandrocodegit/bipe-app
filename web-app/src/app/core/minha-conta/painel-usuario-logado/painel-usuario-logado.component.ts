import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { KeycloakUserProfileComponent } from '../keycloak/keycloak-user-profile/keycloak-user-profile.component';
import { KeycloakSessionsComponent } from '../keycloak/keycloak-sessions/keycloak-sessions.component';
import { KeycloakAccountSettingsComponent } from '../keycloak/keycloak-account-settings/keycloak-account-settings.component';
import { UsuarioService } from '@/shared/services/usuario.service';
import { AuthService } from '@/core/auth/services/auth.service';

@Component({
  selector: 'app-painel-usuario-logado',
  imports: [
    RouterModule,
    KeycloakUserProfileComponent,
    KeycloakSessionsComponent,
    KeycloakAccountSettingsComponent
  ],
  templateUrl: './painel-usuario-logado.component.html',
  styleUrl: './painel-usuario-logado.component.scss'
})
export class PainelUsuarioLogadoComponent implements OnInit {

  constructor(
    private readonly authService: AuthService,
    private readonly usuarioService: UsuarioService){}

  ngOnInit(): void {
    this.usuarioService.listaSessoesUsuarios(this.authService.extrairIdUsuario()).subscribe();
  }

}
