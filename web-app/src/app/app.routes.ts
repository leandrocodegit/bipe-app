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




const painelRoutes: Routes = [

  {
    path: '', component: AppLayout, canActivate: [AuthGuard], children: [
      { path: 'friends', component: FriendsComponent },
      { path: 'mapa', component: PainelMapaComponent },
      { path: 'rotinas', component: RoutinesComponent },
      { path: 'waypoint', component: WaypointListComponent },
      { path: 'devices', component: PainelDevicesComponent },
      { path: 'share/accept', component: AcceptShareComponent }
    ]
  },
  { path: 'login', component: LoginSocialComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'auth', component: AutenticacaoComponent },

];

export const routes: Routes = painelRoutes;


