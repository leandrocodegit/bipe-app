import { Injectable } from '@angular/core';
import { __await } from 'tslib';

declare const L: any;
@Injectable({
  providedIn: 'root'
},
)
export class MapUltilService {

  private drawnItems: L.FeatureGroup = new L.FeatureGroup();
  private geoJSON: any[] = [];
  private map: any;
  private init = false;

  constructor() {
  }


  setMap(map: any, drawnItems: L.FeatureGroup) {
    this.map = map;
    this.drawnItems = drawnItems;
  }

  getJson() {
    const data: any = this.drawnItems.toGeoJSON();
    return data?.features
  }

  setJson(geoJson: any[]) {
    return this.geoJSON = geoJson;
  }

  public createCircleMarker() {
    const draw = new L.Draw.CircleMarker(this.map, {
      repeatMode: false,
      zIndexOffset: 2000,
    });

    draw.enable();

    if (!this.init)
      this.map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        this.drawnItems.addLayer(layer);
        L.circle(layer._latlng, layer.options).addTo(this.map);
        this.init = true;
      });
  }


  public createCircle() {
    const draw = new L.Draw.Circle(this.map, {
      repeatMode: false,
      shapeOptions: {
        stroke: true,
        color: '#9c27b0',
        weight: 4,
        opacity: 0.5,
        fill: false
      },
      showRadius: true,
      metric: true,
      feet: true,
      nautic: false
    });

    draw.enable();

    if (!this.init)
      this.map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;

        this.drawnItems.addLayer(layer);
        L.circle(layer._latlng, layer.options).addTo(this.map);
        this.init = true;
      });
  }


  limpar() {

    this.init = false;
    this.drawnItems.clearLayers();
    this.geoJSON = [];

    this.drawnItems.clearLayers();

    this.map?.eachLayer((layer: L.FeatureGroup) => {
      if (layer instanceof L.Marker || layer instanceof L.Path) {
        if (layer !== this.drawnItems) {
          this.map.removeLayer(layer);
        }
      }
    });
  }
}
