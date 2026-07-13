import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as Leaflet from 'leaflet';
import { LayoutService } from '@/shared/services/layout.service';
import { MqttAppModule } from '@/mqtt-app.module';
import { MqttConnectionState, MqttService } from 'ngx-mqtt';
import { Subscription } from 'rxjs';
import { MapUltilService } from '@/shared/services/mapa-util.service';
import { RecorderService } from '@/shared/services/recorder.service';
import { AuthService } from '@/core/auth/services/auth.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { DeviceService } from '@/shared/services/device.service';
import { Device } from '@/shared/models/device.model';
import { WaypointFormDialogComponent } from '../waypoint-form-dialog/waypoint-form-dialog.component';
import { WaypointService } from '@/shared/services/waypoint.service';
import { Waypoint } from '@/shared/models/waypoint.model';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';

@Component({
  selector: 'app-content-mapa',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    WaypointFormDialogComponent,
  ],
  templateUrl: './content-mapa.component.html',
  styleUrls: ['./content-mapa.component.scss']
})
export class ContentMapaComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() cordenadas = { lat: -23.548789385634088, lng: -46.63357944308231 };
  @Input() edicao = false;
  @Input() height = 'calc(100dvh - 5rem)';
  @Input() tag = false;
  @Output() load = new EventEmitter();

  // Controladores de estado do Leaflet
  private markers: Map<string, Leaflet.Marker> = new Map();
  private circles: Map<string, Leaflet.Circle> = new Map();
  private mapa: any;
  private mqttSubscription!: Subscription;
  protected desenhando = false;
  protected temDesenho = false;
  protected statusInstrucao = 'Toque no botão para iniciar';
  protected geoJSON?: any;
  private caminhosLayer!: L.Polyline;
  private transicoesClusterGroup: any;
  private posicoesClusterGroup: any;
  private googleLayer!: Leaflet.TileLayer;
  private esriLayer!: Leaflet.TileLayer;
  private isGoogleActive = false;
  protected devices: Device[] = [];
  protected mostrarDialogZona = false;
  protected coordenadasAlvoClicado: any;
  protected waypoints: Waypoint[] = [];
  private regioesLayer = Leaflet.layerGroup();

  constructor(
    private readonly route: Router,
    private readonly layoutService: LayoutService,
    private readonly mqttService: MqttService,
    public readonly mapUltilService: MapUltilService,
    private readonly recorderService: RecorderService,
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly activedRoute: ActivatedRoute,
    private readonly deviceService: DeviceService,
    private readonly waypointService: WaypointService,
    private readonly mqttConnectionService: MqttConnectionService
  ) {

  }


  ngOnInit(): void {
    if (this.layoutService.isMobile()) {
      this.height = '93.5vh';
    }

  }

  ngAfterViewInit(): void {

    this.activedRoute.queryParams.subscribe(param => {
      this.edicao = this.route.url == '/rotinas'
      this.inicializarMapa();
    })

  }


  private connectedSubscription?: Subscription;

  private conectarMqttComToken(): void {
    this.connectedSubscription = this.mqttConnectionService.connected$.subscribe(
      (isConnected: boolean) => {

        console.log('MQTT Connected:', isConnected);

        if (isConnected) {
          this.buscarTransicoes()
          if (this.edicao) {
            this.adicionarMarcadorEdicao();
          } else {
            this.iniciarRastreamentoMqtt();
            this.iniciarRastreamentoShared();
          }
        }

      }
    );
  }


  listarWaypoints() {
    this.waypointService.listaWaypoints().subscribe(response => {
      this.waypoints = response;
      this.renderizarRegioes(this.waypoints);
    });
  }


  public renderizarRegioes(listaRegioes: Waypoint[]): void {

    this.regioesLayer.clearLayers();

    if (!listaRegioes || listaRegioes.length === 0) return;

    listaRegioes.forEach(regiao => {
      const latLng = Leaflet.latLng(regiao.lat, regiao.lon);
      const totalDevices = regiao.deviceIds ? regiao.deviceIds.length : 0;


      const iconeCentral = Leaflet.icon({
        iconUrl: 'assets/drawable/alfinete.png',
        iconSize: [64, 64],
        iconAnchor: [30, 50]
      });

      const marcadorRepresentativo = Leaflet.marker(latLng, {
        icon: iconeCentral,
        interactive: false
      });

      marcadorRepresentativo.addTo(this.regioesLayer);

      const circulo = Leaflet.circle(latLng, {
        color: '#10b981',       // Verde Esmeralda (Tailwind)
        weight: 2,              // Espessura da borda
        dashArray: '6, 6',      // Linha tracejada (6px linha, 6px espaço)
        fillColor: '#10b981',
        fillOpacity: 0.15,      // Preenchimento bem leve para não ofuscar o mapa
        radius: regiao.rad      // Raio vindo do JSON em metros
      },);


      // HTML do popup que abre ao clicar na região
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 160px;">
          <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            📍 ${regiao.desc}
          </h4>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #475569;">
            <div style="display: flex; justify-content: space-between;">
              <span>Raio de cobertura:</span>
              <strong style="color: #0f172a;">${regiao.rad} metros</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #f1f5f9;">
              <span>Dispositivos:</span>
              <strong style="background: #10b981; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px;">
                ${totalDevices}
              </strong>
            </div>
          </div>
        </div>
      `;

      circulo.bindPopup(popupHtml, { className: 'zona-popup' });

      // Um tooltip rápido que aparece apenas ao passar o mouse por cima
      circulo.bindTooltip(`<span style="font-weight:bold;">${regiao.desc}</span> (${regiao.rad}m)`, {
        direction: 'top',
        opacity: 0.9
      });

      // Adiciona o círculo à camada específica de regiões
      circulo.addTo(this.regioesLayer);
    });

    this.regioesLayer.addTo(this.mapa);
  }

  private buscarTransicoes(): void {
    if (this.edicao) return;
    this.recorderService.listaTransicoes().subscribe({
      next: (geoJsonData: any) => {
        if (geoJsonData && geoJsonData.features) {
          geoJsonData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.type === 'Point') {

              const lng = feature.geometry.coordinates[0];
              const lat = feature.geometry.coordinates[1];

              const props = feature.properties;
              const isEnter = props.evento === 'enter';

              const corBackground = isEnter ? '#10b981' : '#ef4444';
              const iconeSimbolo = isEnter ? '📥' : '📤';
              const textoAcao = isEnter ? 'Entrou na região' : 'Saiu da região';

              const dataHoraFormatada = new Date(props.dataHoraTransito).toLocaleString();

              const htmlIcone = `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 32px;
                  height: 32px;
                  background-color: ${corBackground};
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0px 2px 6px rgba(0,0,0,0.3);
                  font-size: 14px;
                  cursor: pointer;
                  transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
                  ${iconeSimbolo}
                </div>
              `;

              const customIcon = Leaflet.divIcon({
                html: htmlIcone,
                className: 'transicao-marker-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -16]
              });

              const popupHtml = `
                <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 2px;">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="font-size: 16px;">${iconeSimbolo}</span>
                    <strong style="font-size: 13px; color: ${corBackground}; text-transform: uppercase;">
                      ${textoAcao}
                    </strong>
                  </div>

                  <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">
                    📍 ${props.descricaoRegiao}
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 6px;">
                    <div><b>Usuário:</b> ${props.usuario}</div>
                    <div><b>Dispositivo:</b> ${props.dispositivo}</div>
                    <div style="color: #94a3b8; margin-top: 4px; text-align: right;">${dataHoraFormatada}</div>
                  </div>
                </div>
              `;

              const marker = Leaflet.marker([lat, lng], { icon: customIcon })
                .bindPopup(popupHtml, { maxWidth: 250 });

              this.transicoesClusterGroup.addLayer(marker);
            }
          });
        }
      },
      error: (err) => {
        console.error('Erro ao buscar transições do Recorder:', err);
      }
    });
  }

  private buscarPosicoes(color?: string): void {
    this.recorderService.listaPosicoes().subscribe({
      next: (geoJsonData: any) => {

        if (this.caminhosLayer) {
          this.mapa.removeLayer(this.caminhosLayer);
        }

        const listaDeLatLgns: L.LatLngExpression[] = [];

        if (geoJsonData && geoJsonData.features) {
          geoJsonData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.type === 'Point') {

              const lng = feature.geometry.coordinates[0];
              const lat = feature.geometry.coordinates[1];

              listaDeLatLgns.push([lat, lng]);

              Leaflet.circleMarker([lat, lng], {
                radius: 4,
                fillColor: color ?? '#EF4444',
                color: '#FFF',
                weight: 2,
                fillOpacity: 0.8
              })
                .bindPopup(`<b>Data:</b> ${feature.properties.isotst}<br><b>Velocidade:</b> ${feature.properties.vel} km/h`)
                .addTo(this.mapa);
            }
          });
        }

        if (listaDeLatLgns.length > 1) {
          this.caminhosLayer = Leaflet.polyline(listaDeLatLgns, {
            color: color ?? '#3B82F6',   // Cor azul padrão do PrimeNG
            weight: 5,          // Espessura da linha
            opacity: 0.7,       // Opacidade da linha
            smoothFactor: 1.0   // Suavização de curvas
          }).addTo(this.mapa);

          const bounds = Leaflet.latLngBounds(listaDeLatLgns);
          //  this.mapa.fitBounds(bounds, { padding: [50, 50] });
        } else if (listaDeLatLgns.length === 1) {
          // Se só tiver um ponto isolado, apenas centraliza nele
          // this.mapa.setView(listaDeLatLgns[0], 16);
        }
      },
      error: (err) => {
        console.error('Erro ao processar posições do Recorder:', err);
      }
    });
  }


  private inicializarMapa(): void {
    this.mapa = Leaflet.map('map').setView(this.cordenadas, 13);

    this.googleLayer = Leaflet.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=pt-BR&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps'
    });

    this.esriLayer = Leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri'
    });

    this.esriLayer.addTo(this.mapa);

    this.addCenterButton();
    this.addLayerToggleButton();

    const L_any = (window as any).L || Leaflet;

    this.transicoesClusterGroup = L_any.markerClusterGroup({
      maxClusterRadius: 10,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    }).addTo(this.mapa);
    this.posicoesClusterGroup = L_any.markerClusterGroup({
      maxClusterRadius: 10,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate: true,
      iconCreateFunction: (cluster: any) => {
        const childCount = cluster.getChildCount(); // Quantidade de marcadores dentro

        const html = `
          <div style="
            background-color: #8b5cf6; /* Roxo Tailwind */
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-family: system-ui;
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3); /* Efeito de borda translúcida */
          ">
            ${childCount}
          </div>
        `;

        return Leaflet.divIcon({
          html: html,
          className: 'custom-cluster-transicao',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
      }
    }).addTo(this.mapa);

    this.conectarMqttComToken();

    if (this.edicao)
      this.iniciarCriacaoZonas();
    this.listarWaypoints();
  }

  private addLayerToggleButton(): void {

    const btn = new Leaflet.Control({ position: 'topright' });

    btn.onAdd = () => {
      const el = Leaflet.DomUtil.create('button', 'leaflet-bar leaflet-control');

      el.innerHTML = '🛰️';
      Object.assign(el.style, {
        background: '#000000b3',
        color: '#676c8a',
        padding: '6px 10px',
        fontSize: '16px',
        cursor: 'pointer',
        border: '1px solid #767676',
        borderRadius: '12px',
        fontWeight: 'bold',
        marginTop: '10px'
      });

      el.onclick = () => {
        if (this.isGoogleActive) {

          this.mapa.removeLayer(this.googleLayer);
          this.esriLayer.addTo(this.mapa);
          this.isGoogleActive = false;

          el.innerHTML = '🗺️';
        } else {
          this.mapa.removeLayer(this.esriLayer);
          this.googleLayer.addTo(this.mapa);
          this.isGoogleActive = true;

          el.innerHTML = '🛰️';
        }
      };

      return el;
    };

    btn.addTo(this.mapa);
  }

  private iniciarRastreamentoMqtt(): void {
    this.mqttSubscription = this.mqttConnectionService.observe(`owntracks/#`).subscribe((message: any) => {
      try {
        const jsonString = String.fromCharCode(...message.payload);
        const payload = JSON.parse(jsonString);
        const topic = message.topic;

        console.log(payload);


        if (payload._type === 'location') {
          this.processarEventoLocalizacao(topic, payload);
          if (payload.color)
            this.buscarPosicoes(payload.color);
        }
      } catch (error) {
        console.error('Erro ao processar payload MQTT do OwnTracks:', error);
      }
    });
  }

  private iniciarRastreamentoShared(): void {
    this.mqttSubscription = this.mqttConnectionService.observe(`shared/${this.authService.extrairIdUsuario()}`).subscribe((message: any) => {
      try {
        const jsonString = String.fromCharCode(...message.payload);
        const payload = JSON.parse(jsonString);
        const topic = message.topic;

        console.log('Shared', payload);


      } catch (error) {
        console.error('Erro ao processar payload MQTT do OwnTracks:', error);
      }
    });
  }

  private processarEventoLocalizacao(topic: string, payload: any): void {
    if (!this.mapa) return;

    const partesTopico = topic.split('/');
    const user = partesTopico[1] || 'Desconhecido';
    const deviceName = partesTopico[2] || 'Dispositivo';
    const uniqueId = `${user}-${deviceName}`;

    const latLng = { lat: payload.lat, lng: payload.lon };
    const precisao = payload.acc || 10;
    const tid = payload.tid || deviceName.substring(0, 2).toUpperCase();
    const iconName = payload.icon;

    if (this.markers.has(uniqueId)) {
      const marker = this.markers.get(uniqueId)!;
      const circle = this.circles.get(uniqueId)!;

      marker.setLatLng(latLng);
      circle.setLatLng(latLng);
      circle.setRadius(precisao);
      marker.setPopupContent(this.criarPopupOwnTracks(user, deviceName, payload));

      // Atualiza o ícone do mapa dinamicamente caso o usuário tenha trocado de figura
      marker.setIcon(this.obterIconeLeaflet(iconName, tid, payload.color));
    } else {
      this.criarMarcadorRastreamento(uniqueId, latLng, precisao, tid, iconName, user, deviceName, payload);

      if (this.markers.size === 1) {
        this.mapa.setView(latLng, 15, { animate: true });
      }
    }
  }

  private criarMarcadorRastreamento(id: string, latLng: any, precisao: number, tid: string, iconName: string, user: string, deviceName: string, payload: any): void {
    const circle = Leaflet.circle(latLng, {
      weight: 1,
      color: payload.color ?? '#3b82f6',
      opacity: 0.3,
      fillColor: payload.color ?? '#3b82f6',
      fillOpacity: 0.15,
      radius: precisao
    }).addTo(this.mapa);

    const icon = this.obterIconeLeaflet(iconName, tid, payload?.color);
    const popupHtml = this.criarPopupOwnTracks(user, deviceName, payload);

    const marker = Leaflet.marker(latLng, { icon })
      .bindPopup(popupHtml, { className: 'owntracks-popup', maxWidth: 250 });

    this.circles.set(id, circle);
    this.markers.set(id, marker);

    this.posicoesClusterGroup.addLayer(marker);
  }

  private obterIconeLeaflet(iconName: string | undefined, tid: string, color?: string): Leaflet.DivIcon {
    let conteudoCentro = '';

    if (iconName) {
      const arquivo = iconName.includes('.') ? iconName : `${iconName}.png`;
      conteudoCentro = `<img src="assets/drawable/${arquivo}" style="width: 100%; height: 100%; object-fit: cover;z-index: 9999999;background: white;" onerror="this.style.display='none'" />`;
    } else {
      conteudoCentro = `<span style="color: #1e293b; font-family: system-ui, sans-serif; font-size: 14px; font-weight: bold;z-index: 9999999;background: white;width: 100%;height: 100%;text-align: center;line-height: 2;">${tid}</span>`;
    }

    const htmlMarcador = `
      <div style="position: relative; width: 40px; height: 55px; display: flex; justify-content: center;">

        <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
          <path fill="${color ? color : '#3b82f6'}" d="M12 0C5.37 0 0 5.37 0 12c0 7.5 12 24 12 24s12-16.5 12-24C24 5.37 18.63 0 12 0z"/>
        </svg>

        <div style="position: absolute; top: 4px; width: 28px; height: 28px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0px 1px 3px rgba(0,0,0,0.2);">
          ${conteudoCentro}
        </div>

      </div>
    `;

    return Leaflet.divIcon({
      html: htmlMarcador,
      className: 'tracker-pin-icon', // Classe limpa sem fundo padrão do Leaflet
      iconSize: [40, 55],       // Tamanho total do HTML acima
      iconAnchor: [20, 55],     // A ponta do pino (meio do eixo X, final do eixo Y) aponta para a coordenada
      popupAnchor: [0, -55]     // O popup abre logo acima do topo do pino
    });
  }

  private criarPopupOwnTracks(user: string, device: string, payload: any): string {
    const dataHora = new Date(payload.tst * 1000).toLocaleString();
    const bateria = payload.batt ? `${payload.batt}%` : 'N/A';
    const conexao = payload.conn === 'w' ? 'Wi-Fi' : payload.conn === 'o' ? 'Offline' : payload.conn === 'm' ? 'Mobile' : 'Desconhecida';

    const corBateria = payload.batt > 20 ? '#22c55e' : '#ef4444';

    return `
      <div style="font-family: system-ui, sans-serif; min-width: 180px;">
        <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">${user}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 10px; text-transform: uppercase;">Dispositivo: ${device}</div>

        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #334155;">
          <div style="display: flex; justify-content: space-between;">
            <span>🔋 Bateria:</span>
            <strong style="color: ${corBateria}">${bateria}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>📡 Conexão:</span>
            <strong>${conexao}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>🎯 Precisão:</span>
            <strong>${payload.acc}m</strong>
          </div>
        </div>

        <div style="margin-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
          Atualizado: ${dataHora}
        </div>
      </div>`;
  }

  private adicionarMarcadorEdicao(): void {
    /*     const icon = Leaflet.icon({ iconUrl: 'assets/images/pin.png', iconSize: [60, 60], iconAnchor: [30, 60] });
        const marker = Leaflet.marker(this.cordenadas, { draggable: true, icon }).addTo(this.mapa);
        marker.bindTooltip('Arraste o pino', { permanent: false }).openTooltip();
        marker.on('drag', (event: any) => {
          this.cordenadas = event.target.getLatLng();
        });
        this.markers.set('edicao', marker); */
  }

  private addCenterButton(): void {
    const btn = new Leaflet.Control({ position: 'topright' });
    btn.onAdd = () => {
      const el = Leaflet.DomUtil.create('button', 'leaflet-bar leaflet-control');
      el.innerHTML = '⊕';
      Object.assign(el.style, { background: '#000000b3', color: '#676c8a', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', border: '1px solid #767676', borderRadius: '12px', fontWeight: 'bold' });

      el.onclick = () => {
        if (this.markers.size > 0 && !this.markers.has('edicao')) {
          const group = new Leaflet.FeatureGroup(Array.from(this.markers.values()));
          this.mapa.fitBounds(group.getBounds(), { padding: [30, 30] });
        } else {
          this.mapa.setView(this.cordenadas, 14);
        }
      };
      return el;
    };
    btn.addTo(this.mapa);
  }

  limpar(): void {
    this.mapUltilService?.limpar();
  }

  salvarArea() {

  }

  iniciarDesenhoPoligono(): void {
    this.iniciarCriacaoZonas();

  }

  private iniciarCriacaoZonas(): void {

    this.listarDevices();
    this.mapa.off('click');

    this.mapa.on('click', (event: Leaflet.LeafletMouseEvent) => {
      if (this.desenhando) return;

      this.coordenadasAlvoClicado = event.latlng;

      this.mostrarDialogZona = true;
    });
  }

  protected onSalvarNovaZona(payload: any): void {
    console.log('Payload completo recebido do componente:', payload);

    // Cria o círculo visual no mapa
    const latLng = Leaflet.latLng(payload.lat, payload.lon);
    this.desenharCirculoInterativo(latLng, payload.rad, payload.desc);

    // Opcional: Como agora pode ser mais de um device, você faria um loop:
    // payload.devices.forEach((deviceId: string) => {
    //    this.enviarWaypointParaDispositivo(..., deviceId, ...);
    // });
  }



  listarDevices() {

    this.deviceService.listDevices().subscribe(response => this.devices = response);


  }

  /**
   * Plota o círculo definitivo no mapa após a confirmação do popup.
   */
  private desenharCirculoInterativo(latLng: Leaflet.LatLng, raio: number, nome: string): void {
    const circle = Leaflet.circle(latLng, {
      weight: 2,
      color: '#10b981',
      opacity: 0.8,
      fillColor: '#10b981',
      fillOpacity: 0.2,
      radius: raio
    }).addTo(this.mapa);

    circle.bindTooltip(`Zona: ${raio}m`, { permanent: false, direction: 'top' });

    this.enviarWaypointParaDispositivo('AD', 'emu64xa16k', latLng.lat, latLng.lng, raio, nome)

  }


  enviarWaypointParaDispositivo(user: string, device: string, lat: number, lon: number, raio: number, nomeZona: string): void {
    // O tópico oficial do OwnTracks para receber comandos remotos
    const topic = `owntracks/device/emu64xa16k/cmd`;

    // Estrutura exata exigida pela documentação do OwnTracks para waypoints
    const payload = {
      _type: 'cmd',
      action: 'setWaypoints',
      waypoints: {
        _type: 'waypoints',
        waypoints: [
          {
            _type: 'waypoint',
            lat: lat,
            lon: lon,
            rad: raio,
            desc: nomeZona,
            tst: Math.floor(Date.now() / 1000)
          }
        ]
      }
    };

    try {
      // Publica com QoS 1 para garantir a entrega. Retain false para não prender a mensagem no broker.
      this.mqttConnectionService.unsafePublish(topic, JSON.stringify(payload), { qos: 1, retain: false });
      console.log(`📡 Waypoint '${nomeZona}' enviado com sucesso para ${user}/${device}`);
    } catch (error) {
      console.error('Erro ao enviar waypoint via MQTT:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.mqttSubscription) {
      this.mqttSubscription.unsubscribe();
    }
    if (this.connectedSubscription) {
      this.connectedSubscription.unsubscribe();
    }
    if (this.mapa) {
      this.mapa.remove();
    }
  }

}
