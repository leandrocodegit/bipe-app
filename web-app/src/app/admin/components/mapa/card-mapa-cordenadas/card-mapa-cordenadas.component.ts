import { Component, Inject } from '@angular/core';
import { ContentMapaComponent } from '../content-mapa/content-mapa.component';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DispositivoService } from '@/shared/sincroled/services/dispositivo.service';

@Component({
  selector: 'app-card-mapa-cordenadas',
  standalone: true,
  imports: [
    ContentMapaComponent,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './card-mapa-cordenadas.component.html',
  styleUrl: './card-mapa-cordenadas.component.scss'
})
export class CardMapaCordenadasComponent{

  protected cordenadas = {
    lat: -23.730476198758623,
    lng: -46.58610093766739
  }

  constructor(
    private dispositivoService: DispositivoService,
    private dialogRef: MatDialogRef<CardMapaCordenadasComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    if (data && data.lat && data.lng) {
      this.cordenadas = data;
    }
  }


  fechar(){
    this.dialogRef.close();
  }
  salvar(){
    this.dialogRef.close(this.cordenadas)
  }

}
