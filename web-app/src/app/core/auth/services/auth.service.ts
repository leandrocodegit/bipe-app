import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { __await } from 'tslib';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../../environments/environment';
import { Role, RoleDescriptions } from '../models/role-auth.enum';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../../../app.module';
import { generateCodeChallenge } from '@/shared/services/keycloak.service';
import { LoadService } from '@/shared/components/preload/load.service';


@Injectable({
  providedIn: 'root'
},
)
export class AuthService {

  private grupos: Map<Role, any> = new Map();

  constructor(
    private readonly loadService: LoadService,
    private readonly oauthService: OAuthService,
    private readonly http: HttpClient,
    private readonly router: Router) { }

  public loginOtp(otp: string): Observable<any> {

    const formData = new FormData();
    formData.append('client_id', authConfig.clientId!);
    formData.append('scope', authConfig.scope!);
    formData.append('subject_token', this.oauthService.getAccessToken());
    formData.append('grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange');


    return this.http.post<any>(environment.authConfig.issuer + '/protocol/openid-connect/token', {}, environment.headers
    )
  }

  refreshToken(): Observable<boolean> {
    const body = new HttpParams()
      .set('client_id', authConfig.clientId!)
      .set('grant_type', 'refresh_token')
      .set('refresh_token', this.oauthService.getRefreshToken());

    return this.http.post<any>(
      `${environment.authConfig.issuer}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }
    ).pipe(
      map(response => {
        // aqui você atualiza os tokens
        sessionStorage.setItem('access_token', response.access_token);
        sessionStorage.setItem('refresh_token', response.refresh_token);
        sessionStorage.setItem('id_token', response.id_token);
        sessionStorage.setItem('refresh_expires_in', response.refresh_expires_in);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  getUrl(code: string, redirect?: string) {
    //const verifier = sessionStorage.getItem('PKCE_verifier');
    const nonce = sessionStorage.getItem('nonce');
    const session_state = sessionStorage.getItem('session_state');
    return `${environment.authConfig.issuer}/protocol/openid-connect/auth?client_id=account-console&redirect_uri=${window.location.origin}${redirect ?? '/painel/conta/auth'}&response_type=code&scope=openid&code_challenge=${code}&code_challenge_method=S256&response_mode=query&state=${session_state}&nonce=${nonce}`
  }

  getUrlUpdatePassword(code: string, action?: string) {
    const nonce = sessionStorage.getItem('nonce');
    const session_state = sessionStorage.getItem('session_state');
    return `${environment.authConfig.issuer}/protocol/openid-connect/auth?client_id=account-console&kc_action=${action}&redirect_uri=${window.location.origin}${'/painel/conta/auth'}&response_type=code&scope=openid&code_challenge=${code}&code_challenge_method=S256&response_mode=query&state=${session_state}&nonce=${nonce}`
  }

  verifyClouflare(token: string): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/cloudflare?token=${token}`);
  }

  redirectAccount(redirect?: string) {
    this.loadService.show();
    generateCodeChallenge().then(code => {
      window.location.href = this.getUrl(code, redirect);
    })
  }


  setCliente(data: any) {
    localStorage.setItem("cliente.nome", data.nome);
  }

  get clienteId(): string {
    const clienteId = localStorage.getItem("token.clienteId");
    return clienteId ? clienteId : '';
  }

  get accessToken(): string | null {
    return localStorage.getItem("token.access");
  }

  public valid(): boolean {
    try {
      const expireMillis = this.decodeToken(this.oauthService.getAccessToken()).exp;
      let expire: number = Number.parseInt(expireMillis) * 1000 - 10000;
      const now = Date.now();
      return now < expire;
    } catch (error) {
      return false;
    }
  }

  public isLoggedIn() {
    try {
      const expireMillis = this.decodeToken(this.oauthService.getRefreshToken()).exp;
      let expire: number = Number.parseInt(expireMillis) * 1000 + 20000;
      const now = Date.now();
      return now < expire;
    } catch (error) {
      return false;
    }
  }

  getUserSession() {
    const userJson = sessionStorage.getItem('id_token_claims_obj')
    if (!userJson)
      return {};
    return JSON.parse(userJson);
  }

  public extrairEmailUsuario() {
    try {
      const jwt = this.decodePayloadJWT();
      return jwt.email;
    } catch (error) {
      return '';
    }
  }

  public extrairNomelUsuario() {
    try {
      const jwt = this.decodePayloadJWT();
      return jwt.family_name;
    } catch (error) {
      return '';
    }
  }

  public extrairIdUsuario() {
    try {
      const jwt = this.decodePayloadJWT();
      return jwt.sub;
    } catch (error) {
      return '';
    }
  }

  public extrairGruposUsuario(): string[] {
    try {
      const jwt = this.decodePayloadJWT();
      return jwt.grupos;
    } catch (error) {
      return [];
    }
  }


  public extrairClienteId(token: string) {
    try {
      const jwt = this.decodeToken(token);
      const clienteId = jwt['azp'];
      return clienteId ? clienteId : '';
    } catch (error) {
      return '';
    }
  }

  public decodeToken(token: string): any | null {
    try {
      if (token) {
        const decode = jwtDecode<any>(token);
        return decode;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  public isBusiness() {
    try {
      const jwt = this.decodePayloadJWT();
      const business = jwt['business'];
      return business ? business : false;
    } catch (error) {
      return false;
    }
    return false;
  }

  isAuthorizedRoles(rolesData: Role[]): boolean {
    this.isLoggedIn();
    const tokenPayload = this.decodePayloadJWT();

    if (!tokenPayload || !tokenPayload.roles) {
      this.limparSessao();
      return false;
    }

    const userRoles: Role[] = tokenPayload.grupos;

    if (!userRoles || !rolesData) {
      this.limparSessao();
      return false;
    }

    const hasRole = rolesData.some(role => userRoles.includes(role));

    if (!hasRole) {
      return false;
    }

    return true;
  }
 
  logout() {
    const idToken = sessionStorage.getItem('id_token');
    if (idToken == null) {
      sessionStorage.clear();
      this.router.navigate(['/login']);
    } else {
      const logoutUrl = `${environment.authConfig.issuer}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${authConfig.postLogoutRedirectUri}`;
      window.location.href = logoutUrl;
    }
  }

  loginOrdic(): void {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      this.oauthService.initLoginFlow();
    });
  }

  logoutOrdic() {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocument().then(() => {
      this.oauthService.logOut();
      sessionStorage.clear();
    });
  }

  limparSessao() {
    localStorage.clear();
  }

  public decodePayloadJWT(): any | null {
    try {
      const token = this.oauthService.getAccessToken();
      if (token) {
        const decode = jwtDecode<any>(token);
        return decode;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  hasGrupo(grupoPermissao: Role) {
    return this.grupos.has(grupoPermissao);
  }

  processaAutorizacoes() {
    const gps: Role[] = this.decodePayloadJWT().grupos;
    gps.forEach(gp => {
      this.grupos.set(gp, RoleDescriptions[gp])
    })
  }
}
