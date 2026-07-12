import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class RecorderService {
 
  constructor(
    private readonly http: HttpClient
  ) { }

 
  public listaPosicoes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/devices/locations?user=device&device=emu64xa16k&format=geojson&limit=10&noLoad=true`);
  }

    public listaTransicoes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/devices/transitions?user=device&device=emu64xa16k&format=geojson&group=false&size=10`);
  }
 
}
