export interface FriendCard {
  _type: 'card';
  qos: number;
  retained: boolean;
  _id: string;
  name: string;
  face: string;
  color: string;
  tid: string;
  nickname?: string;
  opMode?: number;
}

export interface OwnTracksLocation {
  _type: 'location';
  tid: string;
  lat: number;
  lon: number;
  acc?: number;
  alt?: number;
  /** Percentual de bateria (0-100). */
  batt?: number;
  /** Status da bateria: 0=desconhecido, 1=descarregando, 2=carregando, 3=cheia. */
  bs?: number;
  conn?: string;
  vel?: number;
  /** Timestamp da localização, em segundos desde epoch. */
  tst: number;
  t?: string;
  /** Nomes das regiões (waypoints) do OwnTracks em que o dispositivo está, calculado no próprio device. */
  inregions?: string[];
  /** IDs das regiões do OwnTracks em que o dispositivo está. */
  inrids?: string[];
  apelido?: string;
  icon?: string;
  color?: string;
  uniqueId?: string;
  /**
   * ⚠️ Suposição: `motionactivities` NÃO é um campo padrão do payload de localização do OwnTracks.
   * Assumimos esse formato (lista de atividades com confiança de 0-100, no padrão da
   * Activity Recognition API do Android) porque foi o que você descreveu. Se o formato
   * real publicado pelo seu app for diferente, ajuste esta interface e `topMotionActivity` em `geo.util.ts`.
   */
  motionactivities?: string[];
  topic?: string;
  userName?: string;
  clienteId?: string;
  opMode?: number;
}

export interface MotionActivity {
  /** ex: "still", "walking", "running", "in_vehicle", "on_bicycle" */
  type: string;
  /** Confiança de 0 a 100. */
  confidence: number;
}

/** Região cadastrada no seu backend (geofence circular), independente das regiões do próprio OwnTracks. */
export interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Raio em metros. */
  radius: number;
  color?: string;
}

export interface FriendPresence {
  id: string;
  deviceId?: string;
  topic: string;
  card: FriendCard;
  location?: OwnTracksLocation;
  address?: string | null;
}
