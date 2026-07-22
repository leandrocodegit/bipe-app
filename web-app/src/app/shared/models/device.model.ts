export interface Device {
  id: string;
  clientId: string;
  apelido?: string;
  username: string;
  nome: string;
  conectado: boolean;
  sharedUsername: string
  os: string;
  icon: string;
  color: string;
  opMode?: number;
  tid: string;
}

export interface ShareRequest {
  device: Device;
  email: string;
}


export interface ProximidadeDevice {
  id: string;
  desc: string;
  tid: string;
  icon: string;
  color: string;
  lat: number;
  lon: number;
  rad: number;
  distanciaMetros: number;
}
