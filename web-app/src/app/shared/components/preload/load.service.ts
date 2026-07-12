import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { __await } from 'tslib';


@Injectable({
  providedIn: 'root'
},
)
export class LoadService {


  private load = false;
  private loadUpdate = new Subject<boolean>();
  private recentes: Map<string, any> = new Map();
  private view = false;


  constructor(
    private readonly activeRoute: Router,
  ) {
    try {
      const data: any = sessionStorage.getItem('recents');
      if (data) {
        const json = JSON.parse(data);
        this.view = json?.view;
        const values = json.recente;
        this.recentes = new Map(values.map((v: any, i: number) => [v.id, v]));
      }
    } catch (error) {
      console.log(error);

    }

  }

  loadUpdate$ = this.loadUpdate.asObservable();

  show() {
    this.load = true;
    this.loadUpdate.next(true);
  }

  hide() {
    this.load = false;
    this.loadUpdate.next(false);
  }

  isView() {
    return this.view;
  }

  get isLoad(){
    return this.load;
  }

  invertView() {
    this.view = !this.view;
    sessionStorage.setItem('recents', JSON.stringify({ view: this.view, recents: Array.from(this.recentes.values()) }));
  }

  ultimoAcesso() {
    return sessionStorage.getItem('returnUrl') ?? environment.router
  }

  addRecent(value: any) {
    value.route = this.activeRoute.url
    this.recentes.delete(value.id);
    this.recentes.set(value.id, value);

    if (this.recentes.size > 20)
      this.recentes.delete(Array.from(this.recentes.values())[0].id);
    sessionStorage.setItem('recents', JSON.stringify({ view: true, recente: Array.from(this.recentes.values()) }));

  }

  removerRecent(key: any) {
    this.recentes.delete(key);
  }

  get listaRecentes(): any[] {
    return this.recentes.size > 0 ? Array.from(this.recentes.values()).reverse() : [];
  }

}
