import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SelectButtonModule } from 'primeng/selectbutton';
import { LayoutService } from '../../services/layout.service';


@Component({
  selector: 'app-modulos-bar',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    SelectButtonModule
  ],
  templateUrl: './modulos-bar.component.html',
  styleUrl: './modulos-bar.component.scss'
})
export class ModulosBarComponent {

  protected modulos: any =  [{ name: 'Agendamentos', link:'agendamentos' }, { name: 'Estoque', link:'estoque' }, { name: 'Oficina', link:'oficina' }];
  protected modulo?: {name: any, link: any};

  constructor(private layoutService: LayoutService){
  }

  onModuloStateChange(){
    this.layoutService.onModuloStateChange({key: this.modulo?.link});

  }

}
