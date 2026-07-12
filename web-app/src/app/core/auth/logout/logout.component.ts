import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss'
})
export class LogoutComponent implements OnInit {

  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService) { }

  ngOnInit(): void {
    this.authService.loginOrdic();
    this.oauthService.logOut();
  }
}
