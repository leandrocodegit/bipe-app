import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
}
