import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { ContentMapaComponent } from '../content-mapa/content-mapa.component';
import { NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PreloadComponent } from '@/shared/components/preload/preload.component';
import { MqttAppModule } from '@/mqtt-app.module';


@Component({
  selector: 'app-painel-mapa',
  standalone: true,
  imports: [
    MatTabsModule,
    ContentMapaComponent,
    MatProgressSpinnerModule,
    NgIf,
    ProgressSpinnerModule,
    PreloadComponent
  ],
  templateUrl: './painel-mapa.component.html',
  styleUrl: './painel-mapa.component.scss'
})
export class PainelMapaComponent implements OnInit {

  protected tabSelect = -1;
  protected load = true;



  ngOnInit(): void {

    if(this.tabSelect == -1)
    var intervalo = setInterval(() => {
      this.tabSelect = 0;
      this.load = false;
      clearInterval(intervalo);
    }, 1000);
  }

  onTabChange(event: MatTabChangeEvent) {
    this.load = true;
    var intervalo = setInterval(() => {
      clearInterval(intervalo);
      this.tabSelect = event.index;
    }, 300);

      var intervaloLoad = setInterval(() => {
        this.load = false;
        clearInterval(intervaloLoad);
      }, 500);


  }

  showLoad(value: boolean){



    this.load = value;
    console.log('showLoad', this.load);

  }
}
