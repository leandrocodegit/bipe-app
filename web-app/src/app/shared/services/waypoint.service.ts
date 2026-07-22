import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProximidadeWaypoint, Waypoint } from '../models/waypoint.model';

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

  public deleteWayPoint(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.urlApi}/bipe/waypoints/${id}`);
  }

  public getProximidade(deviceId: string): Observable<ProximidadeWaypoint[]> {
    return this.http.get<ProximidadeWaypoint[]>(`${environment.urlApi}/bipe/waypoints/proximidade/${deviceId}?noLoad=true`);
  }

}
