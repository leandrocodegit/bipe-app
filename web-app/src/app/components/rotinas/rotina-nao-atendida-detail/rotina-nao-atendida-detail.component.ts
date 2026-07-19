import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';

import { RotinaService } from '@/shared/services/rotina.service';
import { DeviceService } from '@/shared/services/device.service';
import { RecorderService } from '@/shared/services/recorder.service';
import { AudioCallService } from '@/shared/services/audio-call.service';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { WaypointService } from '@/shared/services/waypoint.service';
import { FriendPresence } from '@/shared/models/friends.model';

@Component({
  selector: 'app-rotina-nao-atendida-detail',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './rotina-nao-atendida-detail.component.html'
})
export class RotinaNaoAtendidaDetailComponent implements OnChanges {

  @Input() visible = false;
  @Input() alert: any = null; // RotinaNaoAtendidaResponseDto
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onMarkedAsRead = new EventEmitter<void>();

  protected loading = false;
  protected routineDetails: any = null;
  protected deviceDetails: any = null;
  protected lastTransition: any = null;
  protected latestLocation: any = null;
  protected closestWaypoints: any[] = [];

  constructor(
    private readonly rotinaService: RotinaService,
    private readonly deviceService: DeviceService,
    private readonly recorderService: RecorderService,
    private readonly audioCallService: AudioCallService,
    private readonly monitoredCardService: MonitoredCardService,
    private readonly waypointService: WaypointService,
    private readonly router: Router
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.alert) {
      this.carregarDados();
    }
  }

  protected close(): void {
    this.visibleChange.emit(false);
  }

  private carregarDados(): void {
    if (!this.alert) return;
    this.loading = true;

    // 1. Buscar a configuração completa da rotina
    this.rotinaService.getRotinaById(this.alert.rotinaId).subscribe({
      next: (data) => {
        this.routineDetails = data;
      },
      error: (err) => console.error('Erro ao buscar detalhes da rotina:', err)
    });

    // 2. Buscar o dispositivo pelo ID para obter status de conexão, cor, ícone, etc.
    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        const found = devices.find((d: any) => d.id === this.alert.deviceId);
        if (found) {
          this.deviceDetails = found;
          this.buscarUltimaLocalizacao(found);
          this.buscarUltimasTransicoes(found);
        }
      },
      error: (err) => console.error('Erro ao listar dispositivos:', err),
      complete: () => {
        this.loading = false;
      }
    });

    // 3. Buscar os 3 waypoints mais próximos do dispositivo
    this.waypointService.getProximidade(this.alert.deviceId).subscribe({
      next: (data) => {
        this.closestWaypoints = data ? data.slice(0, 3) : [];
      },
      error: (err) => {
        console.error('Erro ao buscar waypoints mais próximos:', err);
        this.closestWaypoints = [];
      }
    });
  }

  private buscarUltimaLocalizacao(device: any): void {
    this.recorderService.listaPosicoes(
      {
        user: device.username,
        device: device.id,
        limit: 1,
        noLoad: true
      }).subscribe({
        next: (geojson) => {
          if (geojson && geojson.features && geojson.features.length > 0) {
            const feature = geojson.features[0];
            this.latestLocation = {
              lat: feature.geometry.coordinates[1],
              lon: feature.geometry.coordinates[0],
              battery: feature.properties?.batt,
              timestamp: feature.properties?.tst ? new Date(feature.properties.tst * 1000) : null
            };
          } else {
            this.latestLocation = null;
          }
        },
        error: (err) => console.error('Erro ao obter última localização:', err)
      });
  }

  private buscarUltimasTransicoes(device: any): void {
    this.recorderService.listaTransicoes({ device: device.id, limit: 1 }).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.lastTransition = res[0];
        } else {
          this.lastTransition = null;
        }
      },
      error: (err) => console.error('Erro ao buscar transições:', err)
    });
  }

  protected marcarComoLida(): void {
    if (!this.alert) return;
    this.rotinaService.marcarNaoAtendidaComoLida(this.alert.id).subscribe({
      next: () => {
        this.onMarkedAsRead.emit();
        this.close();
      },
      error: (err) => console.error('Erro ao marcar como lida:', err)
    });
  }

  protected chamar(): void {
    if (this.deviceDetails) {
      this.audioCallService.startOutgoingCall(this.deviceDetails.id, this.deviceDetails.username);
    }
  }

  protected verNoMapa(): void {
    if (!this.deviceDetails) return;

    const presence: FriendPresence = {
      id: this.deviceDetails.id,
      topic: `owntracks/${this.deviceDetails.username}/${this.deviceDetails.clientId}`,
      card: {
        _type: 'card',
        qos: 0,
        retained: false,
        _id: this.deviceDetails.id,
        tid: this.deviceDetails.clientId,
        nickname: this.deviceDetails.apelido || this.deviceDetails.nome || this.deviceDetails.clientId,
        name: this.deviceDetails.nome || this.deviceDetails.apelido || this.deviceDetails.clientId,
        color: this.deviceDetails.color || '#6366F1',
        face: this.deviceDetails.icon || 'cat'
      }
    };

    if (this.latestLocation) {
      presence.location = {
        _type: 'location',
        tid: this.deviceDetails.clientId,
        lat: this.latestLocation.lat,
        lon: this.latestLocation.lon,
        tst: Math.floor(this.latestLocation.timestamp?.getTime() / 1000) || 0,
        batt: this.latestLocation?.battery || 100
      };
    }

    this.monitoredCardService.monitorCard(presence);
    this.close();
    this.router.navigate(['/mapa']);
  }

  protected mapsUrl(): string {
    if (this.routineDetails?.waypoint) {
      const lat = this.routineDetails.waypoint.lat;
      const lon = this.routineDetails.waypoint.lon;
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
    return '#';
  }

  protected translateDays(days: string[]): string {
    if (!days || days.length === 0) return '—';
    const dict: Record<string, string> = {
      'MONDAY': 'Seg',
      'TUESDAY': 'Ter',
      'WEDNESDAY': 'Qua',
      'THURSDAY': 'Qui',
      'FRIDAY': 'Sex',
      'SATURDAY': 'Sáb',
      'SUNDAY': 'Dom'
    };
    return days.map(d => dict[d.toUpperCase()] || d).join(', ');
  }

  protected translateEventType(type: string): string {
    if (type === 'ENTER') return 'Entrada';
    if (type === 'LEAVE') return 'Saída';
    return type;
  }
}
