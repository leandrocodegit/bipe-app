import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface LinkRequest {
  payload: string
}

@Injectable({ providedIn: 'root' })
export class SharedService {

  constructor(
    private readonly http: HttpClient
  ) { }


  public listDevices(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.urlApi}/bipe/shares`);
  }

  public compartilhar(clientId: string, email: string): Observable<LinkRequest> {
    return this.http.get<LinkRequest>(`${environment.urlApi}/bipe/shares/generate-link?clientId=${clientId}&email=${email}`);
  }

  public aceiteCompartilhar(payload: LinkRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.urlApi}/bipe/shares/accept`, payload);
  }

}
