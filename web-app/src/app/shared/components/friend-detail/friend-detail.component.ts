import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';

import { FriendPresence } from '@/shared/models/friends.model';
import { BatteryInfo, batteryInfo, MotionInfo, topMotionActivity, relativeTime } from '@/shared/GeoUtil';
import { AudioCallService } from '@/shared/services/audio-call.service';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { RecorderService } from '@/shared/services/recorder.service';
import { WaypointService } from '@/shared/services/waypoint.service';
import { Transition, TransitionTimelineComponent } from '../transition-timeline/transition-timeline.component';
import { log } from 'console';
import { AmigosProximosRadarComponent } from '../amigos-proximos-radar/amigos-proximos-radar.component';

@Component({
  selector: 'app-friend-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    TransitionTimelineComponent,
    AmigosProximosRadarComponent
  ],
  templateUrl: './friend-detail.component.html'
})
export class FriendDetailComponent implements OnChanges {

  @Input({ required: true }) friend!: FriendPresence;
  @Input() isModal = false;
  @Input() maxHeight = '110px'
  @Output() onClose = new EventEmitter<void>();

  protected minhaListaDeTransicoes: Transition[] = [];
  protected proximityWaypoints: any[] = [];
  protected addressText: string | null = null;
  protected loadingProximity = false;

  constructor(
    private readonly audioCallService: AudioCallService,
    private readonly monitoredCardService: MonitoredCardService,
    private readonly recorderService: RecorderService,
    private readonly waypointService: WaypointService,
    private readonly router: Router
  ) { }

  ngOnChanges(changes: SimpleChanges): void {

    console.log(this.friend);

    if (changes['friend'] && this.friend) {
      this.addressText = this.friend.address ?? null;
      this.minhaListaDeTransicoes = [];
      this.listaTransicoes();
      this.carregarProximidades();
      if (!this.friend.location && this.friend.card?.name) {
        this.buscarUltimaLocalizacao();
      }
    }
  }

  protected listaTransicoes(): void {
    if (!this.friend?.card?.name) return;
    this.recorderService.listaTransicoes({
      device: this.friend.card.name,
      lastDay: true,
      limit: 20,
      noLoad: true
    }).subscribe({
      next: (res) => this.minhaListaDeTransicoes = res,
      error: (err) => console.error('Erro ao buscar transições:', err)
    });
  }

  protected carregarProximidades(): void {

    if (!this.friend?.deviceId) {
      const parts = this.friend.topic.split('/');       
      if (parts.length < 3) return;
      this.friend.deviceId = parts[2];
    };

    this.loadingProximity = true;
    this.waypointService.getProximidade(this.friend.deviceId).subscribe({
      next: (data) => {
        this.proximityWaypoints = data || [];
        this.loadingProximity = false;
      },
      error: (err) => {
        console.error('Erro ao buscar proximidades:', err);
        this.proximityWaypoints = [];
        this.loadingProximity = false;
      }
    });
  }

  private buscarUltimaLocalizacao(): void {

    console.log(this.friend);

    const clientId = this.friend.card.tid;
    if (!clientId) return;

    const parts = this.friend.topic.split('/');
    if (parts.length < 3) return;

    const userName = parts[1];
    const deviceId = parts[2];

    this.recorderService.listaPosicoes({
      user: userName,
      device: this.friend.id,
      format: 'geojson',
      limit: 1
    }).subscribe({
      next: (geojson) => {
        if (geojson && geojson.features && geojson.features.length > 0) {
          const feature = geojson.features[0];
          this.friend.location = {
            _type: 'location',
            tid: clientId,
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0],
            tst: feature.properties?.tst || Math.floor(Date.now() / 1000),
            batt: feature.properties?.batt || 100
          };
          this.carregarProximidades();
        }
      },
      error: (err) => console.error('Erro ao buscar última localização:', err)
    });
  }

  protected callFriend(): void {
    const parts = this.friend.topic?.split('/');
    if (parts && parts.length >= 3) {
      const userName = parts[1];
      const deviceId = parts[2];
      this.audioCallService.startOutgoingCall(deviceId, userName);
    } else {
      this.audioCallService.startOutgoingCall(this.friend.id, this.friend.card.name);
    }
  }

  sendBipe(vibrate?: boolean): void {
    const parts = this.friend.topic?.split('/');
    if (parts && parts.length >= 3) {
      const userName = parts[1];
      const deviceId = parts[2];
      this.audioCallService.sendBipe(deviceId, userName, this.friend.card, vibrate);
    }
  }

  protected monitorFriend(): void {
    this.monitoredCardService.monitorCard(this.friend);
    this.monitoredCardService.requestCenter();
    this.onClose.emit();
    this.router.navigate(['/mapa']);
  }

  protected close(): void {
    this.onClose.emit();
  }

  protected battery(): BatteryInfo | null {
    return batteryInfo(this.friend.location?.batt, this.friend.location?.bs);
  }

  protected motion(): MotionInfo | null {
    return topMotionActivity(this.friend.location?.motionactivities);
  }

  protected lastUpdate(): string {
    if (!this.friend.location?.tst) return '—';
    return relativeTime(this.friend.location.tst);
  }

  protected hasAddress(): boolean {
    return !!this.addressText;
  }

  protected requestAddress(): void {
    const loc = this.friend.location;
    if (!loc) return;
    this.addressText = `${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)}`;
  }
}
