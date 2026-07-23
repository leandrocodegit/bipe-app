import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { RoutinesComponent } from '../routines/routines.component';
import { BipesComponent } from '../bipes/bipes.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-painel-rotinas',
  imports: [
    CommonModule,
    TabsModule,
    RoutinesComponent,
    BipesComponent
  ],
  templateUrl: './painel-rotinas.component.html',
  styleUrl: './painel-rotinas.component.scss'
})
export class PainelRotinasComponent {

  protected tab = 'rotina';


  constructor(
    private readonly activedRoute: ActivatedRoute,
    private readonly location: Location
  ) { }

  ngOnInit(): void {
    this.activedRoute.queryParams.subscribe(param => {
      this.tab = param['tab'] ?? 'rotina';
    });
  }

  selectTab(event: any) {
    this.tab = event;
    this.location.go(`/rotinas?tab=${event}`);
  }

}
