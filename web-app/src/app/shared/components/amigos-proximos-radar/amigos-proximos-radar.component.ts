import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { DeviceService } from '@/shared/services/device.service';
import { ProximidadeDevice } from '@/shared/models/device.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-amigos-proximos-radar',
  standalone: true,
  imports: [
    CommonModule,
    TooltipModule
  ],
  templateUrl: './amigos-proximos-radar.component.html',
  styleUrl: './amigos-proximos-radar.component.scss'
})
export class AmigosProximosRadarComponent implements OnInit, OnChanges {
  @Input() deviceId!: string;
  @Input() deviceLat: number = -23.7242367;
  @Input() deviceLon: number = -46.5744417
  @Input() deviceIcon: string = 'localizacao';
  @Input() deviceColor: string = '#6366f1';

  protected friends: ProximidadeDevice[] = [];
  protected maxDistance: number = 1000; // in meters
  protected loading = false;
  protected viewMode: 'radar' | 'list' = 'radar';

  constructor(
    private readonly deviceService: DeviceService,
    private readonly activedRoute: ActivatedRoute,
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

            // Pré-inicializa o mascote e a cor do centro do radar se disponíveis
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
          console.warn('Erro ao obter dados do Android Bridge:', e);
        }
      }

      this.viewMode = params['viewMode'] ?? 'radar';
      this.carregarAmigosProximos();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deviceId'] || changes['deviceLat'] || changes['deviceLon']) {
      this.carregarAmigosProximos();
    }
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
          // A maior distância define o limite do radar (mínimo 500m)
          this.maxDistance = Math.max(...this.friends.map(f => f.distanciaMetros), 500);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar amigos próximos:', err);
        this.friends = [];
        this.loading = false;
      }
    });
  }

  protected toggleViewMode(): void {
    this.viewMode = this.viewMode === 'radar' ? 'list' : 'radar';
  }

  protected getPositionStyles(friend: ProximidadeDevice) {
    if (!this.deviceLat || !this.deviceLon || !friend.lat || !friend.lon) {
      return { display: 'none' };
    }

    const bearing = this.calculateBearing(this.deviceLat, this.deviceLon, friend.lat, friend.lon);

    // Escala linear para manter consistência exata com os círculos concêntricos de distância do radar
    const ratio = this.maxDistance > 0 ? friend.distanciaMetros / this.maxDistance : 0;

    // Distribui o raio em porcentagem (entre 10% e 45% do tamanho total)
    // O círculo interno de 25% do diâmetro corresponde a um raio de 12.5%.
    // Um dispositivo a 9m com maxDistance de 500m terá raio de ~10.6%, caindo perfeitamente dentro do círculo interno.
    const radius = 10 + Math.min(35, ratio * 35);

    // Converter ângulo polar para coordenadas cartesianas (Norte = 0 graus)
    const angleRad = (bearing - 90) * Math.PI / 180;
    const x = 50 + radius * Math.cos(angleRad);
    const y = 50 + radius * Math.sin(angleRad);

    return {
      left: `${x}%`,
      top: `${y}%`
    };
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  }

  protected formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  protected mathMax(a: number, b: number): number {
    return Math.max(a, b);
  }
}
