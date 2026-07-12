import { Component, OnDestroy, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../../../app.module';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-social',
  imports: [
    FormsModule
  ],
  providers: [
    OAuthService
  ],
  templateUrl: './login-social.component.html',
  styleUrl: './login-social.component.scss'
})
export class LoginSocialComponent implements OnInit {

  protected host?: any;

  constructor(private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly navigate: ActivatedRoute,
    private readonly router: Router
  ) { }

  private intervalo: any;

  ngOnInit(): void {

    this.navigate.queryParamMap.subscribe(param => {
      this.oauthService.configure(authConfig);
      this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {

        this.oauthService.initLoginFlow(param['returnUri']);
      //  this.oauthService.setupAutomaticSilentRefresh();
      });
    })
  }
}
