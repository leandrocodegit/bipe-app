import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { LoadComponent } from '@/shared/components/load/load.component';

declare var turnstile: any;

@Component({
  selector: 'app-autenticacao',
  imports: [
    CommonModule,
    RouterModule,
    LoadComponent
  ],
  templateUrl: './autenticacao.component.html',
  styleUrl: './autenticacao.component.scss'
})
export class AutenticacaoComponent implements OnInit, OnDestroy {

  protected host?: any;
  protected checando = false;
  protected intervalo: any;
  protected intervaloCount: any;
  protected count = 0;
  @ViewChild('turnstile') turnstileElement!: ElementRef;

  constructor(private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    try {
      this.intervalo = setInterval(() => {
        if (this.oauthService?.hasValidAccessToken()) {
          clearInterval(this.intervalo);
          //this.checkTurnstile();
          this.redirect();
        }
        this.count++;
        if (this.count > 20)
          this.router.navigate(['/login']);
      }, 1000)
    } catch (error) {
      console.log('Erro lançado', error);
      clearInterval(this.intervalo);
      this.router.navigate(['/login']);
    }

  }

  private redirect() {
    if (this.router?.url.includes('/auth'))
       this.router.navigate(['/mapa']);
    else if (sessionStorage.getItem('PKCE_verifier') == null) {
      if (this.intervalo)
        clearInterval(this.intervalo);
      this.router.navigate(['/login']);
    }
  }

  checkTurnstile(): void {
    if (!this.checando) {
      this.checando = true;
      if (typeof turnstile !== 'undefined') {
        turnstile.render(this.turnstileElement.nativeElement, {
          sitekey: environment.sitekey,
          callback: (token: string) => {
            this.authService.verifyClouflare(token).subscribe(response => {
              if (response.success)
                this.redirect();
              else
                this.router.navigate(['/login']);
            }, error => {
              this.router.navigate(['/login']);
            });
          }
        });
      } else {
        console.error('Turnstile não carregado.');
      }
    }
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
    if (this.intervaloCount) {
      clearInterval(this.intervaloCount);
    }
  }
}
