import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BipeConfig } from '../models/bipe.model';

@Injectable({ providedIn: 'root' })
export class BipeConfigService {

  constructor(
    private readonly http: HttpClient
  ) { }

  public listaBipes(): Observable<BipeConfig[]> {
    return this.http.get<BipeConfig[]>(`${environment.urlApi}/bipe/config-bipes`);
  }

  public salvarBipe(request: any): Observable<BipeConfig> {
    if (request.id) {
      return this.http.put<BipeConfig>(`${environment.urlApi}/bipe/config-bipes/${request.id}`, request);
    } else {
      return this.http.post<BipeConfig>(`${environment.urlApi}/bipe/config-bipes`, request);
    }
  }

  public ativarBipe(id: string): Observable<BipeConfig> {
    return this.http.patch<BipeConfig>(`${environment.urlApi}/bipe/config-bipes/${id}/toggle`, {});
  }

  public removeBipe(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.urlApi}/bipe/config-bipes/${id}`);
  }

  public getBipeById(id: string): Observable<BipeConfig> {
    return this.http.get<BipeConfig>(`${environment.urlApi}/bipe/config-bipes/${id}`);
  }

  public getUltimas24hExecucoes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/config-bipes/execucoes/ultimas-24h`);
  }
}
