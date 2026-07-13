import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { __await } from 'tslib';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatorState } from 'primeng/paginator';
import { OAuthService } from 'angular-oauth2-oidc';
import { Usuario } from '@/admin/modulos/usuarios/models/usuario.model';


@Injectable({
  providedIn: 'root'
},
)
export class UsuarioService {

  private menoriaUsuarios: Usuario[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly oauthService: OAuthService) { }

  get getMemoriaUsuarios(){
    return this.menoriaUsuarios;
  }

  set getMemoriaUsuarios(usuarios: Usuario []){
    this.menoriaUsuarios = usuarios;
  }

  public criarUsuario(usuario: Usuario): Observable<any> {
    return this.http.post<any>(`${environment.urlApi}/usuario`, usuario);
  }

  public atualizarUsuario(request: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario`, request);
  }

  public listaUsuarios(page: PaginatorState): Observable<any[]> {
    return this.http.get<any>(`${environment.urlApi}/usuario?page=${page?.page}&size=${page.rows}`);
  }

    public listaUsuariosCliente(page: PaginatorState): Observable<any[]> {
    return this.http.get<any>(`${environment.urlApi}/cliente?page=${page?.page}&size=${page.rows}`);
  }

  public listaTodosUsuarios(): Observable<any[]> {
    return this.http.get<any>(`${environment.urlApi}/usuario?all=true`);
  }

  public listaGruposAcesso(): Observable<any[]> {
    return this.http.get<any>(`${environment.urlApi}/usuario/grupos`);
  }

  public joinGruposAcesso(idUsuario: any, idGrupo: any): Observable<any[]> {
    return this.http.put<any>(`${environment.urlApi}/usuario/grupos/${idUsuario}/${idGrupo}`, {});
  }

  public deleteGruposAcesso(idUsuario: any, idGrupo: any): Observable<any[]> {
    return this.http.delete<any>(`${environment.urlApi}/usuario/grupos/${idUsuario}/${idGrupo}`);
  }

  public buscarUsuario(id: any): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/usuario/${id}`);
  }

  public infoUsuario(id: any): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/usuario/info/${id}`);
  }

  public listaSessoesUsuarios(userId: any): Observable<any[]> {
    return this.http.get<any>(`${environment.urlApi}/usuario/sessions/${userId}`);
  }

  public logoutUsuario(user: any): Observable<any[]> {
    return this.http.post<any>(`${environment.urlApi}/usuario/logout`, user);
  }

  public ativarUsuario(userId: any): Observable<any> {
    return this.http.put<any>(`${environment.urlApi}/usuario/ativar/${userId}`, {});
  }

  public removerUsuario(userId: any): Observable<any> {
    return this.http.delete<any>(`${environment.urlApi}/usuario/${userId}`);
  }

  public listaMembrosGrupo(idGrupo: string): Observable<any[]> {
    return this.http.get<any>(`${environment.urlApi}/usuario/membros/${idGrupo}`);
  }

  public removerOtp(userId: any): Observable<any[]> {
    return this.http.delete<any>(`${environment.urlApi}/usuario/otp/${userId}`);
  }
}
