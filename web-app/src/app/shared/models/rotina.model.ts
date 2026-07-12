import { Waypoint } from './waypoint.model';

export type RoutineEventType = 'ENTER' | 'EXIT' | 'ENTER_EXIT';

export interface TypeInfo {
  label: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

export const TYPE_INFO: Record<RoutineEventType, TypeInfo> = {
  ENTER: { label: 'Entrada', icon: 'pi pi-sign-in', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
  EXIT: { label: 'Saída', icon: 'pi pi-sign-out', colorClass: 'text-amber-600', bgClass: 'bg-amber-50' },
  ENTER_EXIT: { label: 'Ambos', icon: 'pi pi-sign-out', colorClass: 'text-purple-600', bgClass: 'bg-orange-50' },
};

export const DAY_ORDER = ['D', 'S', 'T', 'Q', 'Qi', 'Sx', 'Sb'];
export const DAY_LABELS: Record<string, string> = {
  D: 'Dom',
  S: 'Seg',
  T: 'Ter',
  Q: 'Qua',
  Qi: 'Qui',
  Sx: 'Sex',
  Sb: 'Sáb',
};
export const WEEKDAYS = ['S', 'T', 'Q', 'Qi', 'Sx'];

export interface Routine {
  id?: string;
  nome: string;
  /** Formato "HH:mm". */
  horaInicio: string;
  horaTermino: string;
  diasSemana: string[];
  /** IDs dos dispositivos aos quais esta rotina se aplica. */
  devices: string[];
  tipo: RoutineEventType;
  waypoint?: Waypoint;
  ativo: boolean;
}
