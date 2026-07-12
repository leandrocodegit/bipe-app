import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../../../../app.module';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-profile-login',
  imports: [
    RouterModule
  ],
  templateUrl: './profile-login.component.html',
  styleUrl: './profile-login.component.scss',
  host: {
    class: 'hidden absolute top-[3.25rem] right-0 w-72 p-4 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]'
  }
})
export class ProfileLoginComponent implements OnInit {

  protected isLogin: any;

  constructor(
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.oauthService.events
    .pipe( )
    .subscribe((e: any) => {
      if(e.type == 'token_received' || e.type == 'token_refreshed')
        this.isLogin = oauthService.hasValidAccessToken() || authService.valid();
    });
  }

  ngOnInit(): void {
    this.isLogin = this.oauthService.hasValidAccessToken() || this.authService.valid();
  }

  login(): void {
   this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
          this.oauthService.initLoginFlow();
    });
  }

  logout() {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocument().then(() => {
      this.oauthService.logOut();
    });
  }
}
