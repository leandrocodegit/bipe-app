import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { DeviceService } from '@/shared/services/device.service';
import { ProximidadeDevice } from '@/shared/models/device.model';
import { ActivatedRoute } from '@angular/router';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';

@Component({
  selector: 'app-amigos-proximos-barra',
  standalone: true,
  imports: [
    CommonModule,
    TooltipModule
  ],
  templateUrl: './amigos-proximos-barra.component.html',
  styleUrl: './amigos-proximos-barra.component.scss'
})
export class AmigosProximosBarraComponent implements OnInit, OnChanges {
  @Input() deviceId!: string;
  @Input() deviceLat: number = -23.7242367;
  @Input() deviceLon: number = -46.5744417;
  @Input() deviceIcon: string = 'localizacao';
  @Input() deviceColor: string = '#6366f1';

  protected friends: ProximidadeDevice[] = [];
  protected maxDistance: number = 1000; // em metros
  protected loading = false;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly activedRoute: ActivatedRoute,
    private readonly monitoredCardService: MonitoredCardService
  ) { }

  ngOnInit(): void {
    this.activedRoute.queryParams.subscribe(params => {
      this.deviceId = this.deviceId ?? params['deviceId'];

      // Se deviceId for nulo, tenta obter do Android Bridge
      if (!this.deviceId && typeof (window as any).Android !== 'undefined') {
        try {
          const androidId = (window as any).Android.getDeviceId();
          if (androidId) {
            this.deviceId = androidId;

            // Pré-inicializa o mascote e a cor do centro se disponíveis
            const androidFace = (window as any).Android.getFace();
            if (androidFace) {
              this.deviceIcon = androidFace;
            }
            const androidColor = (window as any).Android.getColor();
            if (androidColor) {
              this.deviceColor = androidColor;
            }
          }
        } catch (e) {
          console.warn('Erro ao obter dados do Android Bridge no componente barra:', e);
        }
      }
      this.carregarAmigosProximos();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deviceId'] || changes['deviceLat'] || changes['deviceLon']) {
      this.carregarAmigosProximos();
    }
  }

  opcoes() {
    const friend: any = {
      id: `owntracks/${'user'}/${'deviceName'}`,
      card: {
        tid: 'tid',
        name: 'deviceName',
        face: 'default',
        color: '#3b82f6',
        nickname: 'payload.nickname'
      },
      location: {
        "_type": "location",
        "qos": 1,
        "retained": true,
        "created_at": 1784765465,
        "_id": "36847a58",
        "source": "fused",
        "batt": 100,
        "bs": 3,
        "acc": 20,
        "vac": 1,
        "lat": -23.7312763,
        "lon": -46.5892953,
        "alt": 811,
        "tst": 1784765464,
        "m": 2,
        "conn": "w",
        "inregions": [],
        "BSSID": "d8:c6:78:e4:33:68",
        "SSID": "VIVO",
        "tid": "nt",
        "icon": "leao",
        "color": "#F03ACA",
        "userName": "user_d980a0e7",
        "clienteId": "b0fd1e1d-f11d-47ca-8b02-188e7c077240",
        "nickname": "",
        "opMode": 0
      }
    };

    console.log(friend);


    this.monitoredCardService.monitorCard(friend);
  }

  protected carregarAmigosProximos(): void {
    this.loading = true;
    this.deviceService.meusAmigosProximos(this.deviceId).subscribe({
      next: (data) => {
        const friendsList = [...(data || [])];
        if (friendsList.length > 0 && (friendsList[0].distanciaMetros === 0 || !this.deviceId)) {
          const center = friendsList.shift();
          if (center) {
            this.deviceId = center.id;
            this.deviceLat = center.lat;
            this.deviceLon = center.lon;
            this.deviceIcon = center.icon;
            this.deviceColor = center.color;
          }
        }
        this.friends = friendsList;
        if (this.friends.length > 0) {
          // Define a maior distância com limite mínimo de 500m
          this.maxDistance = Math.max(...this.friends.map(f => f.distanciaMetros), 500);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar amigos na barra de proximidade:', err);
        this.friends = [];
        this.loading = false;
      }
    });
  }

  protected getFriendStyles(friend: ProximidadeDevice, index: number) {
    if (this.maxDistance <= 0) return { bottom: '0%' };

    // Proporção linear da distância (deixa margem de 10% a 90% da altura da barra)
    const ratio = Math.min(1, friend.distanciaMetros / this.maxDistance);
    const bottomPercentage = 10 + ratio * 80;

    return {
      bottom: `${bottomPercentage}%`
    };
  }

  protected formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
