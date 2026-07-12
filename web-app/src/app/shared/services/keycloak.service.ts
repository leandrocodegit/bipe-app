import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatorState } from 'primeng/paginator';
import { AuthService } from '@/core/auth/services/auth.service';
import { Router } from '@angular/router';
import { Usuario } from '../models/usuario.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {

  private memoriaUsuarios: Usuario[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly router: Router
  ) { }

  get getMemoriaUsuarios(): Usuario[] {
    return this.memoriaUsuarios;
  }

  set getMemoriaUsuarios(usuarios: Usuario[]) {
    this.memoriaUsuarios = usuarios;
  }

  // -------------------------------------------------------------------------
  // API interna (/usuario)
  // -------------------------------------------------------------------------

  public criarUsuario(usuario: Usuario): Observable<any> {
    return this.http.post<any>(`${environment.urlApi}/usuario`, usuario);
  }

  public atualizarUsuario(request: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario`, request);
  }

  public atualizarRubrica(request: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario/rubrica`, request);
  }

  public buscarRubricaUsuarioLogado(): Observable<{ rubrica: string }> {
    return this.http.get<{ rubrica: string }>(`${environment.urlApi}/usuario/rubrica/data`);
  }

  public listaUsuarios(page: PaginatorState): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/usuario?page=${page?.page}&size=${page.rows}`);
  }

  public listaTodosUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/usuario?all=true`);
  }

  public listaGruposAcesso(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/usuario/grupos`);
  }

  public joinGruposAcesso(idUsuario: any, idGrupo: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario/grupos/${idUsuario}/${idGrupo}`, {});
  }

  public deleteGruposAcesso(idUsuario: any, idGrupo: any): Observable<any> {
    return this.http.delete<any>(`${environment.urlApi}/usuario/grupos/${idUsuario}/${idGrupo}`);
  }

  public buscarUsuario(id: any): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/usuario/${id}`);
  }

  public infoUsuario(id: any): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/usuario/info/${id}`);
  }

  public listaSessoesUsuarios(userId: any): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/usuario/sessions/${userId}`);
  }

  public logoutUsuario(user: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario/logout`, user);
  }

  public ativarUsuario(userId: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario/ativar/${userId}`, {});
  }

  public removerUsuario(userId: any): Observable<any> {
    return this.http.delete<any>(`${environment.urlApi}/usuario/${userId}`);
  }

  public listaMembrosGrupo(idGrupo: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/usuario/membros/${idGrupo}`);
  }

  public removerOtp(userId: any): Observable<any> {
    return this.http.delete<any>(`${environment.urlApi}/usuario/otp/${userId}`);
  }

  // -------------------------------------------------------------------------
  // API Keycloak Account (autenticada com account_token)
  // -------------------------------------------------------------------------

  private get accountHeaders(): { headers: Record<string, string>; withCredentials: true } {
    const token = sessionStorage.getItem('access_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      withCredentials: true
    };
  }

  public getPerfil(): Observable<any> {
    return this.http.get<any>(
      `${environment.authConfig.issuer}/account?userProfileMetadata=true`,
      this.accountHeaders
    );
  }

  public salvarPerfil(userData: any): Observable<any> {
    return this.http.post<any>(
      `${environment.authConfig.issuer}/account`,
      userData,
      this.accountHeaders
    );
  }

  public listaCredenciais(): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.authConfig.issuer}/account/credentials`,
      this.accountHeaders
    );
  }

  public listaGrupos(): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.authConfig.issuer}/account/groups`,
      this.accountHeaders
    );
  }

  public listaSessionsDevices(): Observable<any[]> {

    return this.http.get<any[]>(
      `${environment.authConfig.issuer}/account/sessions/devices`,
      this.accountHeaders
    );
  }

  public removerSessionsDevices(sessionId: string): Observable<any> {
    return this.http.delete<any>(
      `${environment.authConfig.issuer}/account/sessions/${sessionId}`,
      this.accountHeaders
    );
  }

  // -------------------------------------------------------------------------
  // PKCE / Token
  // -------------------------------------------------------------------------

  public getTokenAccount(code: string, redirect: string, codeVerifier: string): Observable<any> {
    const body = new HttpParams({
      fromObject: {
        grant_type: 'authorization_code',
        client_id: 'account-console',
        redirect_uri: `${window.location.origin}${redirect ?? '/painel/conta/auth'}`,
        code,
        code_verifier: codeVerifier
      }
    });

    return this.http.post<any>(
      `${environment.authConfig.issuer}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        withCredentials: true
      }
    );
  }
}

// ---------------------------------------------------------------------------
// Utilitários PKCE (funções puras, fora da classe)
// ---------------------------------------------------------------------------

export function generateCodeVerifier(length = 128): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function generateCodeChallenge(codeVerifier?: string): Promise<string> {
  const verifier = codeVerifier ?? sessionStorage.getItem('PKCE_verifier') ?? '';
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  return { verifier, challenge };
}
