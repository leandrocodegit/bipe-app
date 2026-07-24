import { Routes } from '@angular/router';
import { AppLayout } from './admin/base/sidebar/app.layout';
import { PainelMapaComponent } from './admin/components/mapa/painel-mapa/painel-mapa.component';
import { AuthGuard } from './core/auth/services/auth.guard';
import { LoginSocialComponent } from './core/auth/login-social/login-social.component';
import { LogoutComponent } from './core/auth/logout/logout.component';
import { AutenticacaoComponent } from './core/auth/autenticacao/autenticacao.component';
import { PainelDevicesComponent } from './components/device/painel-devices/painel-devices.component';
import { AcceptShareComponent } from './components/device/accept-share/accept-share.component';
import { FriendsComponent } from './components/device/friends/friends.component';
import { WaypointListComponent } from './admin/components/mapa/waypoint-list/waypoint-list.component';
import { RoutinesComponent } from './components/rotinas/routines/routines.component';
import { KeycloakUserProfileComponent } from './core/minha-conta/keycloak/keycloak-user-profile/keycloak-user-profile.component';
import { KeycloakSessionsComponent } from './core/minha-conta/keycloak/keycloak-sessions/keycloak-sessions.component';
import { PainelUsuarioLogadoComponent } from './core/minha-conta/painel-usuario-logado/painel-usuario-logado.component';
import { PainelRouteBaseComponent } from './shared/components/painel-route-base/painel-route-base.component';
import { RotinaNaoAtendidaDetailComponent } from './components/rotinas/rotina-nao-atendida-detail/rotina-nao-atendida-detail.component';
import { AmigosProximosRadarComponent } from './shared/components/amigos-proximos-radar/amigos-proximos-radar.component';
import { AmigosProximosBarraComponent } from './shared/components/amigos-proximos-barra/amigos-proximos-barra.component';
import { PainelRotinasComponent } from './components/rotinas/painel-rotinas/painel-rotinas.component';
import { TrajetoDiarioComponent } from './components/rotinas/trajeto-diario/trajeto-diario.component';

const painelRoutes: Routes = [

  {
    path: '', component: AppLayout, canActivate: [AuthGuard], children: [
      { path: 'friends', component: FriendsComponent },
      { path: 'mapa', component: PainelMapaComponent },
      { path: 'radar', component: AmigosProximosRadarComponent },
      { path: 'distancia', component: AmigosProximosBarraComponent },
      { path: 'mapa/waypoint', component: PainelMapaComponent },
      { path: 'rotinas', component: PainelRotinasComponent },
      { path: 'trajeto', component: TrajetoDiarioComponent },
      { path: 'rotina/nao-atendida/:rotinaId/:deviceId', component: RotinaNaoAtendidaDetailComponent },
      { path: 'waypoint', component: WaypointListComponent },
      { path: 'devices', component: PainelDevicesComponent },
      { path: 'share/accept', component: AcceptShareComponent },
       { path: '', redirectTo: '/distancia', pathMatch: 'full' }
    ]
  },
  {
    path: 'conta', component: AppLayout, children: [
      { path: '', component: PainelUsuarioLogadoComponent },
      { path: 'sessions', component: KeycloakSessionsComponent },
      { path: 'perfil', component: KeycloakUserProfileComponent },
    ]
  },
  { path: 'login', component: LoginSocialComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'auth', component: AutenticacaoComponent },


];

export const routes: Routes = painelRoutes;


