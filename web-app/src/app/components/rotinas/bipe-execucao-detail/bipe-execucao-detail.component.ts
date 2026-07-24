import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router } from '@angular/router';

import { BipeConfigService } from '@/shared/services/bipe-config.service';
import { DeviceService } from '@/shared/services/device.service';
import { RecorderService } from '@/shared/services/recorder.service';
import { AudioCallService } from '@/shared/services/audio-call.service';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { FriendPresence } from '@/shared/models/friends.model';

@Component({
  selector: 'app-bipe-execucao-detail',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './bipe-execucao-detail.component.html'
})
export class BipeExecucaoDetailComponent implements OnInit, OnChanges {

  @Input() visible = false;
  @Input() execution: any = null; // BipeExecucaoResponseDto
  @Output() visibleChange = new EventEmitter<boolean>();

  protected container = false;
  protected loading = false;
  protected bipeConfigDetails: any = null;
  protected deviceDetails: any = null;
  protected latestLocation: any = null;

  constructor(
    private readonly bipeConfigService: BipeConfigService,
    private readonly deviceService: DeviceService,
    private readonly recorderService: RecorderService,
    private readonly audioCallService: AudioCallService,
    private readonly monitoredCardService: MonitoredCardService,
    private readonly activedRoute: ActivatedRoute,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.activedRoute.params.subscribe(param => {
      if (param['bipeId'] && param['deviceId']) {
        this.execution = { bipeId: param['bipeId'], deviceId: param['deviceId'] };
        this.carregarDados();
        this.container = true;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.execution) {
      this.carregarDados();
    }
  }

  protected close(): void {
    this.visibleChange.emit(false);
  }

  private carregarDados(): void {
    if (!this.execution) return;
    this.loading = true;

    // 1. Buscar a configuração completa do bipe
    if (this.execution.bipeId) {
      this.bipeConfigService.getBipeById(this.execution.bipeId).subscribe({
        next: (data) => {
          this.bipeConfigDetails = data;
        },
        error: (err) => console.error('Erro ao buscar detalhes da configuração de bipe:', err)
      });
    }

    // 2. Buscar o dispositivo pelo ID
    this.deviceService.listDevices().subscribe({
      next: (devices) => {
        const found = devices.find((d: any) => d.id === this.execution.deviceId);
        if (found) {
          this.deviceDetails = found;
          this.buscarUltimaLocalizacao(found);
        }
      },
      error: (err) => console.error('Erro ao listar dispositivos:', err),
      complete: () => {
        this.loading = false;
      }
    });
  }

  private buscarUltimaLocalizacao(device: any): void {
    this.recorderService.listaPosicoes(
      {
        user: device.username,
        device: device.id,
        format: 'geojson',
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

  protected biparNovamente(vibrate?: boolean): void {
    if (this.deviceDetails) {
      this.audioCallService.sendBipe(
        this.deviceDetails.id,
        this.deviceDetails.username,
        {
          _type: 'card',
          qos: 0,
          retained: false,
          _id: this.deviceDetails.id,
          tid: this.deviceDetails.clientId,
          nickname: this.deviceDetails.apelido || this.deviceDetails.nome || this.deviceDetails.clientId,
          name: this.deviceDetails.nome || this.deviceDetails.apelido || this.deviceDetails.clientId,
          color: this.deviceDetails.color || '#6366F1',
          face: this.deviceDetails.icon || 'cat'
        },
        vibrate
      );
      this.close();
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

  protected translateDays(days: string[]): string {
    if (!days || days.length === 0) return '—';
    const dict: Record<string, string> = {
      'MONDAY': 'Seg',
      'TUESDAY': 'Ter',
      'WEDNESDAY': 'Qua',
      'THURSDAY': 'Qui',
      'FRIDAY': 'Sex',
      'SATURDAY': 'Sáb',
      'SUNDAY': 'Dom',
      'SEG': 'Seg',
      'TER': 'Ter',
      'QUA': 'Qua',
      'QUI': 'Qui',
      'SEX': 'Sex',
      'SAB': 'Sáb',
      'DOM': 'Dom'
    };
    return days.map(d => dict[d.toUpperCase()] || d).join(', ');
  }

  public getButtonLabel(button: string): any {
    if (button) {
      switch (button.toUpperCase()) {
        case 'VOL_UP':
          return { text: 'Aumentar Volume (VOL_UP)', icon: 'pi pi-volume-up' };
        case 'VOL_DOWN':
          return { text: 'Diminuir Volume (VOL_DOWN)', icon: 'pi pi-volume-down' };
        case 'VOL_TICK':
          return { text: 'Toque Único (VOL_TICK)', icon: 'pi pi-check-circle' };
        case 'HEADSET':
          return { text: 'Botão Fone de Ouvido', icon: 'pi pi-headphones' };
        case 'REMOTE':
          return { text: 'Vibração Remota', icon: 'pi pi-mobile' };
        case 'PLAY':
          return { text: 'Botão Play', icon: 'pi pi-play' };
        case 'PAUSE':
          return { text: 'Botão Pause', icon: 'pi pi-pause' };
        case 'STOP':
          return { text: 'Botão Stop', icon: 'pi pi-stop' };
        default:
          return { text: `Botão ${button}`, icon: 'pi pi-info-circle' };
      }
    }
    return { text: 'Sem resposta física', icon: 'pi pi-question' };
  }
}
