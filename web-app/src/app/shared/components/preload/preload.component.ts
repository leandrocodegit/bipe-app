import { Component, Input } from '@angular/core';
import { LoadComponent } from '../load/load.component';

@Component({
  selector: 'app-preload',
  imports: [
    LoadComponent
  ],
  templateUrl: './preload.component.html',
  styleUrl: './preload.component.scss'
})
export class PreloadComponent {

  @Input() text = 'Carregando...'


}
