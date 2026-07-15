import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

export interface Transition {
    id: number;
    usuario: string;
    dispositivo: string;
    evento: 'enter' | 'leave';
    descricaoRegiao: string;
    lat: number;
    lon: number;
    precisao: number;
    dataHoraCriacaoRegiao: string;
    dataHoraTransito: string;
}

@Component({
  selector: 'app-transition-timeline',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule,
    ButtonModule
  ],
  providers: [DatePipe],
  templateUrl: './transition-timeline.component.html'
})
export class TransitionTimelineComponent {

  @Input() transitions: Transition[] = [];
  @Output() onSelect = new EventEmitter();

  protected view = false;

  constructor(private datePipe: DatePipe) {}

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const hoje = new Date();

    // Se for hoje, mostra só o horário, senão mostra data e horário
    if (date.toDateString() === hoje.toDateString()) {
      return 'Hoje às ' + this.datePipe.transform(date, 'HH:mm')!;
    }
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm')!;
  }
}
