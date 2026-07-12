import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from '../../../app.configurator';
import { OAuthService } from 'angular-oauth2-oidc';
import { SelectModule } from 'primeng/select';
import { AuthService } from '@/core/auth/services/auth.service';
import { PopoverModule } from 'primeng/popover';
import { BrokerStatusComponent } from '@/shared/components/broker-status/broker-status.component';
import { LayoutService } from '@/shared/services/layout.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    AppConfigurator,
    RouterModule,
    SelectModule,
    PopoverModule,
    BrokerStatusComponent
  ],
  templateUrl: './top-bar.component.html'
})
export class TopBarComponent implements OnInit {

  @Input() noToogle = false;
  protected items!: MenuItem[];
  protected isLogin = false;

  constructor(
    public readonly layoutService: LayoutService,
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService,
  ) {
    this.oauthService.events
      .pipe()
      .subscribe((e: any) => {
        if (e.type == 'token_received' || e.type == 'token_refreshed')
          this.isLogin = oauthService.hasValidAccessToken() || authService.valid();
      });
  }

  ngOnInit(): void {
    this.isLogin = this.oauthService.hasValidAccessToken() || this.authService.valid();

  }

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    this.layoutService.setPreferencias();
  }

  sideBarOpen() {
    localStorage.setItem('toggle', String(this.layoutService.toogled()));
    this.layoutService.onMenuToggle();
    if (this.layoutService.isDesktop())
      this.layoutService.setPreferencias();

  }

  login(): void {
    this.authService.loginOrdic();
  }

  logout() {
    this.authService.logoutOrdic();
  }
}
