export interface Device {
  id: string;
  clientId: string;
  username: string;
  nome: string;
  conectado: boolean;
  sharedUsername: string
  os: string
}

export interface ShareRequest {
  device: Device;
  email: string;
}