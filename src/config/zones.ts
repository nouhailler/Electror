export interface Zone {
  id: string;
  name: string;
  flag: string;
  note?: string;
}

export const ZONES = [
  { id: 'FR', name: 'France', flag: '🇫🇷' },
  { id: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { id: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { id: 'ES', name: 'Espagne', flag: '🇪🇸' },
  {
    id: 'IT-NO',
    name: 'Italie',
    flag: '🇮🇹',
    note: 'Zone Nord (IT-NO)',
  },
  { id: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
] as const satisfies readonly Zone[];

export type ZoneId = (typeof ZONES)[number]['id'];

export function getZone(zoneId: string): Zone {
  return ZONES.find((zone) => zone.id === zoneId) ?? ZONES[0];
}
