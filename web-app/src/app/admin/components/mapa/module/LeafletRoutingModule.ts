// src/app/nome-do-modulo/nome-do-modulo-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContentMapaComponent } from '../content-mapa/content-mapa.component';
import { CardMapaCordenadasComponent } from '../card-mapa-cordenadas/card-mapa-cordenadas.component';
 
const routes: Routes = [
  { path: '', component: ContentMapaComponent } ,
  { path: 'edicao/:latitude/:longitude', component: ContentMapaComponent } 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeafletRoutingModule { }
