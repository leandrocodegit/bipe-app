import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { Waypoint, WaypointDeviceInfo } from '@/shared/models/waypoint.model';
import { WaypointService } from '@/shared/services/waypoint.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-waypoints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './waypoint-list.component.html'
})
export class WaypointListComponent implements OnInit {

  @Input() waypoints: Waypoint[] = [];
  @Input() devicesById: Record<string, WaypointDeviceInfo> = {};
  @Input() loading = false;
  @Input() select = false;
  @Output() create = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Waypoint>();
  @Output() onSelect = new EventEmitter<Waypoint>();
  @Output() delete = new EventEmitter<Waypoint>();
  @Output() waypointSelected = new EventEmitter<Waypoint>();

  protected searchTerm = '';
  protected selected: Waypoint | null = null;
  protected copied = false;
  protected viewWaipoints = false;

  private copiedTimeout?: ReturnType<typeof setTimeout>;
  private readonly palette = ['#6366F1', '#0EA5E9', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#EF4444'];

  constructor(private readonly waypointService: WaypointService,
              private readonly confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.listarWaypoints();
  }


  listarWaypoints() {
    this.waypointService.listaWaypoints().subscribe(response => this.waypoints = response);
  }

  get filteredWaypoints(): Waypoint[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.waypoints;
    }
    return this.waypoints.filter((w) => w.desc.toLowerCase().includes(term));
  }

  trackByWaypoint(_index: number, waypoint: Waypoint): string {
    return waypoint.id;
  }

  colorFor(waypoint: Waypoint): string {
    return this.palette[this.hash(waypoint.id) % this.palette.length];
  }

  radiusLabel(waypoint: Waypoint): string {
    return waypoint.rad >= 1000 ? `${(waypoint.rad / 1000).toFixed(1)} km` : `${waypoint.rad} m`;
  }

  devicesOf(waypoint: Waypoint): WaypointDeviceInfo[] {
    return waypoint.deviceIds.map((id) => this.devicesById[id] ?? { id, nome: this.shortId(id) });
  }

  shortId(id: string): string {
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
  }

  mapsUrl(waypoint: Waypoint): string {
    return `https://www.google.com/maps?q=${waypoint.lat},${waypoint.lon}`;
  }

  openDetails(waypoint: Waypoint): void {
    if (this.select) {
      this.onSelect.emit(waypoint)
    } else {
      this.selected = waypoint;
      this.waypointSelected.emit(waypoint);
    }

  }

  closeDetails(): void {
    this.selected = null;
  }

  onCreate(): void {
    this.create.emit();
  }

  onEdit(waypoint: Waypoint, event?: Event): void {
    event?.stopPropagation();
    this.edit.emit(waypoint);
  }

  onDelete(waypoint: Waypoint, event?: Event): void {
    event?.stopPropagation();
    this.confirmationService.confirm({
      message: `Deseja excluir a região "${waypoint.desc}"?`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { label: 'Excluir', severity: 'danger' },
      accept: () => {
        this.waypointService.deleteWayPoint(waypoint.id).subscribe({
          next: () => this.listarWaypoints(),
          error: (err) => console.error('Erro ao excluir waypoint:', err)
        });
      }
    });
  }

  async copyCoords(waypoint: Waypoint): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${waypoint.lat}, ${waypoint.lon}`);
      this.copied = true;
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Clipboard indisponível; falha silenciosamente.
    }
  }

  private hash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
}
