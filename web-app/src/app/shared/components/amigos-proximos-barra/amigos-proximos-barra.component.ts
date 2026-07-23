import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { DeviceService } from '@/shared/services/device.service';
import { ProximidadeDevice } from '@/shared/models/device.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { FriendPresence } from '@/shared/models/friends.model';

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

  protected deviceUsername: string = '';
  protected deviceClientId: string = '';
  protected friends: ProximidadeDevice[] = [];
  protected maxDistance: number = 1000; // em metros
  protected loading = false;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly activedRoute: ActivatedRoute,
    private readonly monitoredCardService: MonitoredCardService,
    private readonly router: Router
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
    if (!this.deviceId) return;
    const centerFriend: ProximidadeDevice = {
      id: this.deviceId,
      username: this.deviceUsername || '',
      clientId: this.deviceClientId || '',
      desc: 'Dispositivo Referência',
      tid: '',
      icon: this.deviceIcon,
      color: this.deviceColor,
      lat: this.deviceLat,
      lon: this.deviceLon,
      rad: 0,
      distanciaMetros: 0
    };
    this.selecionarAmigo(centerFriend);
  }

  selecionarAmigo(friend: ProximidadeDevice) {
    const userName = friend.username || 'unknown';
    const deviceName = friend.clientId || friend.id;
    const presence: FriendPresence = {
      id: `owntracks/${userName}/${deviceName}`,
      deviceId: friend.id,
      topic: `owntracks/${userName}/${deviceName}`,
      card: {
        _type: 'card',
        qos: 1,
        retained: true,
        _id: friend.id,
        name: friend.desc,
        face: friend.icon,
        color: friend.color,
        tid: friend.tid,
        nickname: friend.desc
      },
      location: {
        _type: 'location',
        tid: friend.tid,
        lat: friend.lat,
        lon: friend.lon,
        tst: Math.floor(Date.now() / 1000),
        icon: friend.icon,
        color: friend.color,
        userName: userName,
        clienteId: friend.id
      }
    };

    console.log('Monitorando amigo pela barra:', presence);
    this.monitoredCardService.monitorCard(presence);
    this.router.navigate(['/mapa']);
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
            this.deviceUsername = center.username;
            this.deviceClientId = center.clientId || '';
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
