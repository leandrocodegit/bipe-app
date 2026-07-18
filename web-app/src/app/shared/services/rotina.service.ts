import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Routine, StatusRoutine } from '../models/rotina.model';

@Injectable({ providedIn: 'root' })
export class RotinaService {

  constructor(
    private readonly http: HttpClient
  ) { }


  public listaRotinas(): Observable<Routine[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/rotinas`);
  }

  public criarWayPoint(request: any): Observable<any> {
    return this.http.post<any>(`${environment.urlApi}/bipe/rotinas`, request);
  }

  public ativarRotina(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/rotinas/${id}/toggle`, {});
  }

  public removeRotina(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.urlApi}/bipe/rotinas/${id}`);
  }

  public statusRotina(): Observable<StatusRoutine> {
    return this.http.get<StatusRoutine>(`${environment.urlApi}/bipe/rotinas/status`);
  }

  public marcarAtendidaComoLida(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/rotinas/status/atendidas/${id}/lida`, {});
  }

  public marcarNaoAtendidaComoLida(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/rotinas/status/nao-atendidas/${id}/lida`, {});
  }

  public marcarLidaAtendida(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/rotinas/nao-atendidas/${id}/lida`, {});
  }

  public marcarLidaNaoAtendida(id: string): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/rotinas/atendidas/${id}/lida`, {});
  }

}
