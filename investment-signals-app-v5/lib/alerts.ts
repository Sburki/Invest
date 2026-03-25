import type { AlertItem, Opportunity } from '@/lib/types';

export type AlertEventInsert = {
  alert_id: string;
  user_id: string;
  symbol: string;
  alert_type: string;
  threshold: number | null;
  actual_value: number | null;
  message: string;
  triggered_at: string;
};

function buildMessage(alert: AlertItem, actualValue: number | null) {
  const actual = actualValue === null ? 'n/a' : String(actualValue);
  const threshold = alert.threshold === null ? 'n/a' : String(alert.threshold);
  if (alert.alert_type === 'price_above') {
    return `${alert.symbol} liegt bei ${actual} und damit über deiner Schwelle ${threshold}.`;
  }
  if (alert.alert_type === 'price_below') {
    return `${alert.symbol} liegt bei ${actual} und damit unter deiner Schwelle ${threshold}.`;
  }
  return `${alert.symbol} hat aktuell einen Score von ${actual} und damit deine Schwelle ${threshold} erreicht.`;
}

export function evaluateAlerts(alerts: AlertItem[], opportunities: Opportunity[]): AlertEventInsert[] {
  const now = new Date().toISOString();

  return alerts.flatMap((alert) => {
    if (!alert.is_active) return [];
    const opportunity = opportunities.find((item) => item.symbol === alert.symbol);
    if (!opportunity) return [];

    let actualValue: number | null = null;
    let isTriggered = false;

    if (alert.alert_type === 'price_above' && alert.threshold !== null) {
      actualValue = opportunity.price;
      isTriggered = actualValue !== null && actualValue >= alert.threshold;
    }

    if (alert.alert_type === 'price_below' && alert.threshold !== null) {
      actualValue = opportunity.price;
      isTriggered = actualValue !== null && actualValue <= alert.threshold;
    }

    if (alert.alert_type === 'score_above' && alert.threshold !== null) {
      actualValue = opportunity.total_score;
      isTriggered = actualValue >= alert.threshold;
    }

    if (!isTriggered) return [];

    return [{
      alert_id: alert.id,
      user_id: alert.user_id,
      symbol: alert.symbol,
      alert_type: alert.alert_type,
      threshold: alert.threshold,
      actual_value: actualValue,
      message: buildMessage(alert, actualValue),
      triggered_at: now,
    }];
  });
}
