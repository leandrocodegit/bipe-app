import { StatusRoutine } from '@/shared/models/rotina.model';
import { RotinaService } from '@/shared/services/rotina.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import { CommonModule } from '@angular/common';
import { RotinaNaoAtendidaDetailComponent } from '../rotina-nao-atendida-detail/rotina-nao-atendida-detail.component';

@Component({
  selector: 'app-historico-rotinas',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    DrawerModule,
    ButtonModule,
    RotinaNaoAtendidaDetailComponent
  ],
  templateUrl: './historico-rotinas.component.html',
  styleUrl: './historico-rotinas.component.scss'
})
export class HistoricoRotinasComponent implements OnInit {

  protected tab = 'atendida';
  protected view = false;
  protected statusRotina?: StatusRoutine;
  protected mostrarAlertaDetalhe = false;
  protected alertaSelecionado: any = null;

  constructor(
    private readonly rotinaService: RotinaService,
    private readonly activedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.activedRoute.queryParams.subscribe(param => {
      this.tab = param['tab'] ?? 'atendida';
    });
    this.buscarHistorico();
  }

  selectTab(event: any) {
    this.tab = event;
  }

  buscarHistorico(){
    this.rotinaService.statusRotina().subscribe(response => {
      this.statusRotina = response;
    });
  }

  marcarAtendida(id: string, event?: Event): void {
    event?.stopPropagation();
    this.rotinaService.marcarAtendidaComoLida(id).subscribe({
      next: () => this.buscarHistorico(),
      error: (err) => console.error('Erro ao marcar atendida como lida:', err)
    });
  }

  marcarNaoAtendida(id: string, event?: Event): void {
    event?.stopPropagation();
    this.rotinaService.marcarNaoAtendidaComoLida(id).subscribe({
      next: () => this.buscarHistorico(),
      error: (err) => console.error('Erro ao marcar não atendida como lida:', err)
    });
  }

  abrirAlerta(alerta: any): void {
    this.alertaSelecionado = alerta;
    this.mostrarAlertaDetalhe = true;
  }

}
