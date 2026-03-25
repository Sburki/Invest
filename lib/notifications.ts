import type { AlertEvent } from '@/lib/types';

type DeliveryResult = {
  ok: boolean;
  provider: 'resend' | 'log';
  providerMessageId?: string | null;
  error?: string | null;
};

export async function sendAlertEmail(params: {
  to: string;
  subject: string;
  events: AlertEvent[];
}) : Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;

  const intro = `Es wurden ${params.events.length} neue Alert-Ereignisse erkannt.`;
  const lines = params.events
    .map((event) => `• ${event.symbol} · ${event.alert_type} · ${event.message} · ${new Date(event.triggered_at).toLocaleString('de-CH')}`)
    .join('\n');

  const text = `${intro}\n\n${lines}\n\nHinweis: Dies sind Research- und Monitoring-Signale, keine persönliche Finanzberatung.`;

  if (!apiKey || !from) {
    console.log('[alert-email disabled]', { to: params.to, subject: params.subject, text });
    return { ok: true, provider: 'log', providerMessageId: null };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text,
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      provider: 'resend',
      providerMessageId: null,
      error: typeof payload?.message === 'string' ? payload.message : 'Unbekannter E-Mail-Fehler',
    };
  }

  return {
    ok: true,
    provider: 'resend',
    providerMessageId: typeof payload?.id === 'string' ? payload.id : null,
  };
}
