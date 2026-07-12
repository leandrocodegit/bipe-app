import { KeycloakService } from '@/shared/services/keycloak.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-keycloak-session-token-auth',
  imports: [
    ProgressSpinner
  ],
  templateUrl: './keycloak-session-token-auth.component.html',
  styleUrl: './keycloak-session-token-auth.component.scss'
})
export class KeycloakSessionTokenAuthComponent implements OnInit {

  constructor(
      private readonly keycloakService: KeycloakService,
      private readonly activeRoute: ActivatedRoute,
      private readonly router: Router
    ) { }

    ngOnInit(): void {
      this.activeRoute.queryParams.subscribe(params => {
         const verifier = sessionStorage.getItem('PKCE_verifier')!;
        this.keycloakService.getTokenAccount(params['code'], params['redirect'], verifier).subscribe(response => {
          sessionStorage.setItem('account_token', response['access_token']);
          this.router.navigate(['/conta']);
        }, error => console.log(error.error));

      })
    }
}
