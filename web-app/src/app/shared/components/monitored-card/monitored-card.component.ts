import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { FriendPresence } from '@/shared/models/friends.model';
import { batteryInfo, BatteryInfo, topMotionActivity } from '@/shared/GeoUtil';
import { AudioCallService } from '@/shared/services/audio-call.service';
import { LayoutService } from '@/shared/services/layout.service';

@Component({
  selector: 'app-monitored-card',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './monitored-card.component.html',
  styleUrls: ['./monitored-card.component.scss']
})
export class MonitoredCardComponent implements OnInit, OnDestroy {
  protected monitoredCard: FriendPresence | null = null;
  protected battery: BatteryInfo | null = null;
  protected motionLabel = '';
  protected motionEmoji = '';
  protected isVisibleOnRoute = true;
  protected mapReady = false;

  private routerSub!: Subscription;
  private cardSub!: Subscription;
  private mapReadySub!: Subscription;

  constructor(
    private monitoredCardService: MonitoredCardService,
    private readonly audioCallService: AudioCallService,
    public readonly layoutService: LayoutService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Verifica a rota inicial
    this.checkRouteVisibility(this.router.url);

    // Atualiza a visibilidade quando a rota muda
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRouteVisibility(event.urlAfterRedirects);
    });

    this.cardSub = this.monitoredCardService.monitoredCard$.subscribe((card) => {
      this.monitoredCard = card;
      this.updateComputedFields();
    });
    this.mapReadySub = this.monitoredCardService.mapReady$.subscribe((ready) => {
      this.mapReady = !!ready;
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.cardSub) this.cardSub.unsubscribe();
    if (this.mapReadySub) this.mapReadySub.unsubscribe();
  }

  callFriend(): void {
 

    if(!this.monitoredCard) return;

    const parts = this.monitoredCard.id.split('/');
    if (parts.length >= 3) {
      const userName = parts[1];
      const deviceId = parts[2];
      this.audioCallService.startOutgoingCall(deviceId, userName);
    }
  }

  sendBipe(): void {
 
    console.log('Bipe enviado', this.monitoredCard);
    if(!this.monitoredCard) return;

    const parts = this.monitoredCard.id.split('/');
    if (parts.length >= 3) {
      const userName = parts[1];
      const deviceId = parts[2];
      this.audioCallService.sendBipe(deviceId, userName);
    }
  }

  private checkRouteVisibility(url: string): void {
    // Mostra apenas na rota do mapa, pois a tela de amigos já tem o detalhe embutido
    this.isVisibleOnRoute = url.includes('/mapa');
  }

  clearMonitor(): void {
    this.monitoredCardService.clearMonitoredCard();
  }

  closeMonitor(): void {
    this.monitoredCardService.closeMonitoredCard();
  }

  centerOnCard(): void {
    this.monitoredCardService.requestCenter();
  }

  private updateComputedFields(): void {
    if (!this.monitoredCard?.location) {
      this.battery = null;
      this.motionLabel = '';
      this.motionEmoji = '';
      return;
    }

    this.battery = batteryInfo(this.monitoredCard.location.batt, this.monitoredCard.location.bs);
    const motion = topMotionActivity(this.monitoredCard.location.motionactivities);
    this.motionLabel = motion?.label ?? '';
    this.motionEmoji = motion?.emoji ?? '';
  }

  get locationText(): string {
    if (!this.monitoredCard?.location) {
      return 'Sem localização';
    }
    return `${this.monitoredCard.location.lat.toFixed(5)}, ${this.monitoredCard.location.lon.toFixed(5)}`;
  }

  get connectionText(): string {
    const conn = this.monitoredCard?.location?.conn;
    if (!conn) {
      return 'Desconhecida';
    }
    return conn === 'w' ? 'Wi-Fi' : conn === 'm' ? 'Mobile' : conn === 'o' ? 'Offline' : conn;
  }
}
