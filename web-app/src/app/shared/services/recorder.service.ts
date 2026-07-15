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


  public listaPosicoes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/devices/locations?user=device&device=emu64xa16k&format=geojson&limit=10&noLoad=true`);
  }

  public listaTransicoes(filtro: FiltroTransicao): Observable<any> {
    let url = `${environment.urlApi}/bipe/devices/transitions?${trasnformParams(filtro)}`;
    return this.http.get<any>(url);
  }

}
