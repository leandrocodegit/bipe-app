import { MotionActivity, Region } from "./models/friends.model";



const EARTH_RADIUS_M = 6371000;

/** Distância entre dois pontos em metros (fórmula de Haversine). */
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/** Regiões cadastradas (do seu backend) em que o ponto lat/lon está dentro do raio. */
export function matchRegisteredRegions(lat: number, lon: number, regions: Region[]): Region[] {
  return regions.filter((r) => haversineDistanceMeters(lat, lon, r.lat, r.lon) <= r.radius);
}

export interface BatteryInfo {
  percent: number;
  level: 'critical' | 'low' | 'medium' | 'high';
  colorClass: string;
  isCharging: boolean;
}

export function batteryInfo(batt?: number, bs?: number): BatteryInfo | null {
  if (batt === undefined || batt === null) {
    return null;
  }
  const isCharging = bs === 2 || bs === 3;

  let level: BatteryInfo['level'];
  let colorClass: string;
  if (batt <= 15) {
    level = 'critical';
    colorClass = 'text-red-500';
  } else if (batt <= 40) {
    level = 'low';
    colorClass = 'text-amber-500';
  } else if (batt <= 70) {
    level = 'medium';
    colorClass = 'text-amber-400';
  } else {
    level = 'high';
    colorClass = 'text-emerald-500';
  }

  return { percent: Math.round(batt), level, colorClass, isCharging };
}

export interface MotionInfo {
  emoji: string;
  label: string;
  confidence: number;
}

const MOTION_LABELS: Record<string, { emoji: string; label: string }> = {
  still: { emoji: '🧍', label: 'Parado' },
  stationary: { emoji: '🧍', label: 'Parado' },
  walking: { emoji: '🚶', label: 'Caminhando' },
  on_foot: { emoji: '🚶', label: 'Caminhando' },
  running: { emoji: '🏃', label: 'Correndo' },
  in_vehicle: { emoji: '🚗', label: 'No veículo' },
  automotive: { emoji: '🚗', label: 'No veículo' },
  on_bicycle: { emoji: '🚴', label: 'De bicicleta' },
  cycling: { emoji: '🚴', label: 'De bicicleta' },
  tilting: { emoji: '📱', label: 'Movimentando o aparelho' },
  unknown: { emoji: '❓', label: 'Desconhecido' },
};

/** Pega a atividade de maior confiança na lista e devolve emoji + rótulo em pt-BR. */
export function topMotionActivity(activities?: string[]): MotionInfo | null {
  if (!activities || !activities.length) {
    return null;
  }
  const top = [...activities][0];

  if(!top)
    return null;

  const info = MOTION_LABELS[top?.toLowerCase()] ?? MOTION_LABELS['unknown'];

  return { emoji: info.emoji, label: info.label, confidence: 0 };
}

/** Formata um timestamp (segundos desde epoch) como "há 2 min", "há 3 h", etc. */
export function relativeTime(tstSeconds?: number): string {
  if (!tstSeconds) {
    return '—';
  }
  const diffSec = Math.max(0, Math.floor((Date.now() - tstSeconds * 1000) / 1000));
  if (diffSec < 30) return 'agora mesmo';
  if (diffSec < 60) return `há ${diffSec} s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `há ${diffHour} h`;

  const diffDay = Math.floor(diffHour / 24);
  return `há ${diffDay} d`;
}
