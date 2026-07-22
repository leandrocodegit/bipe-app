import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProximidadeDevice } from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class DeviceService {

  constructor(
    private readonly http: HttpClient
  ) { }

  
  public listDevices(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/devices`);
  }

  public salvarApelido(request: { id: string, apelido: string }): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/devices/apelido`, request);
  }

  public updateOpMode(id: string, opMode: number): Observable<any> {
    return this.http.patch<any>(`${environment.urlApi}/bipe/devices/${id}/op-mode`, { opMode });
  }

  public meusAmigosProximos(deviceId?: string): Observable<ProximidadeDevice[]> {
    const url = deviceId 
      ? `${environment.urlApi}/bipe/devices/proximidade/${deviceId}?noLoad=true`
      : `${environment.urlApi}/bipe/devices/proximidade?noLoad=true`;
    return this.http.get<ProximidadeDevice[]>(url);
  }

}
