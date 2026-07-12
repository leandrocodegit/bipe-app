import { NgModule } from '@angular/core'; 
import { ContentMapaComponent } from '../content-mapa/content-mapa.component';
import { LeafletRoutingModule } from './LeafletRoutingModule';
import { IconsModule } from 'src/app/IconsModule';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations:[
   ],
  imports: [
    LeafletRoutingModule,
    IconsModule,
    MatButtonModule,
    RouterModule
   ],
  exports: [
  ]
})
export class MapaModule { }
