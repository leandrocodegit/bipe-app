import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Waypoint } from '../models/waypoint.model';

@Injectable({ providedIn: 'root' })
export class WaypointService {

  constructor(
    private readonly http: HttpClient
  ) { }


  public listaWaypoints(): Observable<Waypoint[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/waypoints`);
  }

  public criarWayPoint(request: any): Observable<any> {
    return this.http.post<any>(`${environment.urlApi}/bipe/waypoints`, request);
  }

}
