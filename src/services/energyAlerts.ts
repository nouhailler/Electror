import type { AlertPreferences, EnergyAlert } from '@/src/types/alerts';
import type { EnergyData } from '@/src/types/electricity';

export function evaluateEnergyAlerts(
  data: EnergyData,
  preferences: AlertPreferences,
  now = Date.now(),
): EnergyAlert[] {
  const alerts: EnergyAlert[] = [];
  const price = data.forecast.points.find(
    (point) => Date.parse(point.datetime) >= now && point.price <= preferences.priceBelow,
  );
  if (price) {
    alerts.push({
      kind: 'price',
      datetime: price.datetime,
      title: 'Prix avantageux',
      message: `Le prix descend à ${price.price.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${price.unit}.`,
      value: price.price,
      unit: price.unit,
    });
  }

  const carbon = data.carbon?.points.find(
    (point) => Date.parse(point.datetime) >= now && point.value <= preferences.carbonBelow,
  );
  if (carbon) {
    alerts.push({
      kind: 'carbon',
      datetime: carbon.datetime,
      title: 'Électricité bas carbone',
      message: `L’intensité descend à ${carbon.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${carbon.unit}.`,
      value: carbon.value,
      unit: carbon.unit,
    });
  }

  const renewable = data.renewable?.points.find(
    (point) => Date.parse(point.datetime) >= now && point.value >= preferences.renewableAbove,
  );
  if (renewable) {
    alerts.push({
      kind: 'renewable',
      datetime: renewable.datetime,
      title: 'Pic renouvelable',
      message: `La part renouvelable atteint ${renewable.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} %.`,
      value: renewable.value,
      unit: renewable.unit,
    });
  }

  return alerts.sort((left, right) => Date.parse(left.datetime) - Date.parse(right.datetime));
}
