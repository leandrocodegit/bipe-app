import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { trasnformParams } from '../models/OpcoesFiltro';


export interface FiltroTransicao {
  user?: string;
  device: string;
  format?: 'json' | 'geojson';
  group?: boolean;
  lastDay?: boolean;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class RecorderService {

  constructor(
    private readonly http: HttpClient
  ) { }


  public listaPosicoes(user: string, device: string, limit: number = 20): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/bipe/devices/locations?user=${user}&device=${device}&format=geojson&limit=${limit}&noLoad=true`);
  }

  public listaTransicoes(filtro: FiltroTransicao): Observable<any> {
    let url = `${environment.urlApi}/bipe/devices/transitions?${trasnformParams(filtro)}`;
    return this.http.get<any>(url);
  }

}
