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
}

export interface ShareRequest {
  device: Device;
  email: string;
}