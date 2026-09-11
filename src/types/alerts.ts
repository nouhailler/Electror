export interface AlertPreferences {
  enabled: boolean;
  priceBelow: number;
  carbonBelow: number;
  renewableAbove: number;
  leadMinutes: number;
}

export type EnergyAlertKind = 'price' | 'carbon' | 'renewable';

export interface EnergyAlert {
  kind: EnergyAlertKind;
  datetime: string;
  title: string;
  message: string;
  value: number;
  unit: string;
}
