export interface Waypoint {
  id: string;
  desc: string;
  lat: number;
  lon: number;
  rad: number;
  deviceIds: string[];
}

export interface WaypointDeviceInfo {
  id: string;
  nome: string;
  conectado?: boolean;
}