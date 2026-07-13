import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { FriendPresence } from '@/shared/models/friends.model';
import { batteryInfo, BatteryInfo, topMotionActivity } from '@/shared/GeoUtil';

@Component({
  selector: 'app-monitored-card',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './monitored-card.component.html',
  styleUrls: ['./monitored-card.component.scss']
})
export class MonitoredCardComponent implements OnInit {
  protected monitoredCard: FriendPresence | null = null;
  protected battery: BatteryInfo | null = null;
  protected motionLabel = '';
  protected motionEmoji = '';

  constructor(private monitoredCardService: MonitoredCardService) {}

  ngOnInit(): void {
    this.monitoredCardService.monitoredCard$.subscribe((card) => {
      this.monitoredCard = card;
      this.updateComputedFields();
    });
  }

  clearMonitor(): void {
    this.monitoredCardService.clearMonitoredCard();
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
