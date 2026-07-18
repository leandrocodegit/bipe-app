import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DAY_LABELS, DAY_ORDER, Routine, RoutineEventType, TYPE_INFO, TypeInfo, WEEKDAYS } from '@/shared/models/rotina.model';
import { Waypoint } from '@/shared/models/waypoint.model';
import { Device } from '@/shared/models/device.model';
import { ZonaFormDialogComponent } from '../zona-form-dialog/zona-form-dialog.component';
import { RotinaService } from '@/shared/services/rotina.service';
import { WaypointListComponent } from '@/admin/components/mapa/waypoint-list/waypoint-list.component';
import { HistoricoRotinasComponent } from '../historico-rotinas/historico-rotinas.component';

@Component({
  selector: 'app-routines',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputSwitchModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ZonaFormDialogComponent,
    WaypointListComponent,
    HistoricoRotinasComponent
  ],
  templateUrl: './routines.component.html',
  styleUrls: ['./routines.component.scss'],
})
export class RoutinesComponent {
  @Input() routines: Routine[] = [];

  /** Mapa opcional id -> dados do dispositivo, para mostrar nomes no detalhe. */
  @Input() devicesById: Record<string, Device> = {};

  @Input() loading = false;

  @Output() create = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Routine>();
  @Output() delete = new EventEmitter<Routine>();
  @Output() routineSelected = new EventEmitter<Routine>();

  /** Emitido a cada troca do switch "Ativa" (a UI já atualiza otimisticamente). */
  @Output() toggleActive = new EventEmitter<{ routine: Routine; ativo: boolean }>();

  /** Emitido ao tocar em "Ver no mapa" no detalhe — plugue no seu componente de mapa. */
  @Output() viewOnMap = new EventEmitter<Routine>();

  searchTerm = '';
  selected: Routine | null = null;
  protected mostrarDialogZona = false;
  protected formulario?: Routine;
  protected viewWaipoints = false;

  constructor(
    private readonly rotinaService: RotinaService) { }


  ngOnInit(): void {
    this.listaRotinas()
  }

  listaRotinas() {
    this.rotinaService.listaRotinas().subscribe(response => this.routines = response)
  }

  get filteredRoutines(): Routine[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.routines;
    }
    return this.routines.filter(
      (r) => r.nome.toLowerCase().includes(term) || r.waypoint?.desc?.toLowerCase().includes(term)
    );
  }

  trackByRoutine(index: number, routine: Routine): string {
    return routine.id ?? `${routine.nome}-${index}`;
  }

  typeInfo(routine: Routine): TypeInfo {
    return TYPE_INFO[routine.tipo] ?? TYPE_INFO['ENTER'];
  }

  scheduleLabel(routine: Routine): string {
    return `${routine.horaInicio} – ${routine.horaTermino}`;
  }

  /** Dias na ordem da semana (não na ordem em que vieram no array), com fallback pra códigos desconhecidos. */
  sortedDayLabels(routine: Routine): string[] {
    const known = DAY_ORDER.filter((d) => routine.diasSemana.includes(d));
    const unknown = routine.diasSemana.filter((d) => !DAY_ORDER.includes(d));
    return [...known, ...unknown].map((d) => DAY_LABELS[d] ?? d);
  }

  /** Atalho amigável para os dois casos mais comuns; nos demais, lista os dias. */
  daysCompactLabel(routine: Routine): string {
    const set = new Set(routine.diasSemana);
    if (DAY_ORDER.every((d) => set.has(d)) && set.size === 7) {
      return 'Todos os dias';
    }
    if (WEEKDAYS.every((d) => set.has(d)) && set.size === WEEKDAYS.length) {
      return 'Dias úteis';
    }
    return this.sortedDayLabels(routine).join(', ');
  }

  deviceCount(routine: Routine): number {
    return routine.devices?.length ?? 0;
  }

  onSelectWaypoint(waypoint: Waypoint) {
    if (this.selected)
      this.selected.waypoint = waypoint;
    this.selected.devices = this.selected.devices.map(device => device.id)
    this.rotinaService.criarWayPoint(this.selected).subscribe(() => this.viewWaipoints = false);

  }

  shortId(id: string): string {
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
  }

  openDetails(routine: Routine): void {
    this.selected = routine;
    this.routineSelected.emit(routine);
  }

  closeDetails(): void {
    this.selected = null;
  }

  onCreate(): void {
    this.mostrarDialogZona = true;
    this.formulario = {
    nome: '',
    horaInicio: '08:00',
    horaTermino: '18:00',
    diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    devices: [],
    tipo: 'ENTER',
    ativo: true
  };

    this.create.emit();
  }

  onEdit(routine: Routine, event?: Event): void {
    event?.stopPropagation();
    this.mostrarDialogZona = true
    this.edit.emit(routine);
    this.formulario = routine;
  }

  onDelete(routine: Routine, event?: Event): void {
    event?.stopPropagation();


    this.rotinaService.removeRotina(routine.id!).subscribe({
      next: () => this.routines = this.routines.filter(rou => rou.id != routine.id)
    })
  }

  onViewOnMap(routine: Routine): void {
    this.viewOnMap.emit(routine);
  }

  onToggleActive(routine: Routine): void {
    this.rotinaService.ativarRotina(routine.id!).subscribe({
      error: () => routine.ativo = !routine.ativo
    })
  }
}
