import { Device } from './device.model';

export interface BipeConfig {
  id?: string;
  nome: string;
  diasSemana: string[];
  intervaloMinutos: number;
  devices: any[]; // devices mapped as Device or ID arrays depending on request/response
  ativo: boolean;
}
