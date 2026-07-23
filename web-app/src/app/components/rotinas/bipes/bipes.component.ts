import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { DAY_LABELS, DAY_ORDER, WEEKDAYS } from '@/shared/models/rotina.model';
import { BipeConfig } from '@/shared/models/bipe.model';
import { BipeConfigService } from '@/shared/services/bipe-config.service';
import { BipeFormDialogComponent } from '../bipe-form-dialog/bipe-form-dialog.component';

@Component({
  selector: 'app-bipes',
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
    TooltipModule,
    BipeFormDialogComponent
  ],
  templateUrl: './bipes.component.html',
  styleUrls: ['./bipes.component.scss']
})
export class BipesComponent implements OnInit {
  bipes: BipeConfig[] = [];
  searchTerm = '';
  selected: BipeConfig | null = null;
  mostrarDialogBipe = false;
  formulario?: BipeConfig;

  constructor(
    private readonly bipeConfigService: BipeConfigService
  ) { }

  ngOnInit(): void {
    this.listaBipes();
  }

  listaBipes(): void {
    this.bipeConfigService.listaBipes().subscribe(response => this.bipes = response);
  }

  get filteredBipes(): BipeConfig[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.bipes;
    }
    return this.bipes.filter(
      (b) => b.nome.toLowerCase().includes(term)
    );
  }

  trackByBipe(index: number, bipe: BipeConfig): string {
    return bipe.id ?? `${bipe.nome}-${index}`;
  }

  sortedDayLabels(bipe: BipeConfig): string[] {
    const known = DAY_ORDER.filter((d) => bipe.diasSemana.includes(d));
    const unknown = bipe.diasSemana.filter((d) => !DAY_ORDER.includes(d));
    return [...known, ...unknown].map((d) => DAY_LABELS[d] ?? d);
  }

  daysCompactLabel(bipe: BipeConfig): string {
    const set = new Set(bipe.diasSemana);
    if (DAY_ORDER.every((d) => set.has(d)) && set.size === 7) {
      return 'Todos os dias';
    }
    if (WEEKDAYS.every((d) => set.has(d)) && set.size === WEEKDAYS.length) {
      return 'Dias úteis';
    }
    return this.sortedDayLabels(bipe).join(', ');
  }

  deviceCount(bipe: BipeConfig): number {
    return bipe.devices?.length ?? 0;
  }

  openDetails(bipe: BipeConfig): void {
    this.selected = bipe;
  }

  closeDetails(): void {
    this.selected = null;
  }

  onCreate(): void {
    this.mostrarDialogBipe = true;
    this.formulario = {
      nome: '',
      intervaloMinutos: 15,
      diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      devices: [],
      ativo: true
    };
  }

  onEdit(bipe: BipeConfig, event?: Event): void {
    event?.stopPropagation();
    this.mostrarDialogBipe = true;
    // Clone properties to edit safely
    this.formulario = {
      ...bipe,
      devices: [...(bipe.devices || [])]
    };
  }

  onDelete(bipe: BipeConfig, event?: Event): void {
    event?.stopPropagation();
    this.bipeConfigService.removeBipe(bipe.id!).subscribe({
      next: () => {
        this.bipes = this.bipes.filter(b => b.id !== bipe.id);
        if (this.selected?.id === bipe.id) {
          this.closeDetails();
        }
      }
    });
  }

  onToggleActive(bipe: BipeConfig): void {
    this.bipeConfigService.ativarBipe(bipe.id!).subscribe({
      error: () => bipe.ativo = !bipe.ativo
    });
  }
}
