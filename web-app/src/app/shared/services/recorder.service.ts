import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { trasnformParams } from '../models/OpcoesFiltro';


export interface FiltroGps {
  user?: string;
  device: string;
  format?: 'json' | 'geojson';
  group?: boolean;
  lastDay?: boolean;
  limit?: number;
  repeat?: boolean;
  noLoad?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RecorderService {

  constructor(
    private readonly http: HttpClient
  ) { }


  public listaPosicoes(filtro: FiltroGps): Observable<any> {
    return this.http.get<any>(`${environment.urlApi}/bipe/devices/locations?${trasnformParams(filtro)}`);
  }

  public listaTransicoes(filtro: FiltroGps): Observable<any> {
    let url = `${environment.urlApi}/bipe/devices/transitions?${trasnformParams(filtro)}`;
    return this.http.get<any>(url);
  }

}
