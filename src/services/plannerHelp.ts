import type { PlannerPreferences } from '@/src/types/planner';

export function rechargeWarning(p: PlannerPreferences): string | null {
  if (p.applianceId !== 'electric-car') return null;
  if (!Number.isFinite(p.evBatteryCapacityKwh) || p.evBatteryCapacityKwh <= 0 || !Number.isFinite(p.evCurrentPercent) || !Number.isFinite(p.evTargetPercent) || p.evCurrentPercent < 0 || p.evCurrentPercent > 100 || p.evTargetPercent < 0 || p.evTargetPercent > 100) return 'Vérifiez la capacité de batterie et les niveaux actuel et cible (entre 0 et 100 %).';
  if (!Number.isFinite(p.powerKw) || p.powerKw <= 0) return 'Renseignez une puissance de recharge supérieure à zéro.';
  if (p.evTargetPercent <= p.evCurrentPercent) return 'La cible est déjà atteinte. Aucune recharge nécessaire : choisissez une cible supérieure au niveau actuel pour planifier une recharge.';
  const hours = p.evBatteryCapacityKwh * (p.evTargetPercent - p.evCurrentPercent) / 100 / 0.9 / p.powerKw;
  if (hours > 12) {
    const reachable = Math.min(100, p.evCurrentPercent + p.powerKw * 12 * 0.9 / p.evBatteryCapacityKwh * 100);
    return `La cible nécessite environ ${hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h, au-delà de la limite de 12 h. En 12 h, le niveau estimé serait de ${Math.floor(reachable)} %. Réduisez la cible ou adaptez la puissance aux capacités réelles de votre installation.`;
  }
  return null;
}
