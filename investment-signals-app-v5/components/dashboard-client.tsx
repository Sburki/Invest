'use client';

import { useMemo, useState } from 'react';
import type { AlertEvent, AlertItem, Opportunity, WatchlistItem } from '@/lib/types';
import { createClient } from '@/lib/supabase/browser';

type NotificationSettings = {
  email: string | null;
  notify_email: string | null;
  email_alerts_enabled: boolean;
};

type Props = {
  email: string;
  initialOpportunities: Opportunity[];
  initialWatchlist: WatchlistItem[];
  initialAlerts: AlertItem[];
  initialAlertEvents: AlertEvent[];
  notificationSettings: NotificationSettings;
  lastUpdatedLabel: string;
};

export default function DashboardClient({
  email,
  initialOpportunities,
  initialWatchlist,
  initialAlerts,
  initialAlertEvents,
  notificationSettings,
  lastUpdatedLabel,
}: Props) {
  const [opportunities] = useState<Opportunity[]>(initialOpportunities);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [events, setEvents] = useState<AlertEvent[]>(initialAlertEvents);
  const [query, setQuery] = useState('');
  const [minScore, setMinScore] = useState(70);
  const [selectedSymbol, setSelectedSymbol] = useState(initialOpportunities[0]?.symbol ?? 'MSFT');
  const [alertType, setAlertType] = useState('price_above');
  const [threshold, setThreshold] = useState('450');
  const [notifyEmail, setNotifyEmail] = useState(notificationSettings.notify_email ?? notificationSettings.email ?? email);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(notificationSettings.email_alerts_enabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return opportunities.filter((item) => {
      return (
        item.total_score >= minScore &&
        (item.symbol.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.sector.toLowerCase().includes(q))
      );
    });
  }, [opportunities, query, minScore]);

  async function addToWatchlist(symbol: string) {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const json = await response.json();
    setSaving(false);
    if (response.ok) {
      setWatchlist(json.items ?? []);
      setMessage(`${symbol} wurde zur Watchlist hinzugefügt.`);
    } else {
      setMessage(json.error ?? 'Watchlist konnte nicht gespeichert werden.');
    }
  }

  async function removeFromWatchlist(symbol: string) {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const json = await response.json();
    setSaving(false);
    if (response.ok) {
      setWatchlist(json.items ?? []);
      setMessage(`${symbol} wurde aus der Watchlist entfernt.`);
    } else {
      setMessage(json.error ?? 'Watchlist konnte nicht aktualisiert werden.');
    }
  }

  async function createAlert() {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: selectedSymbol,
        alert_type: alertType,
        threshold: threshold.trim() === '' ? null : Number(threshold),
      }),
    });
    const json = await response.json();
    setSaving(false);
    if (response.ok) {
      setAlerts(json.items ?? []);
      setMessage(`Alert für ${selectedSymbol} wurde erstellt.`);
    } else {
      setMessage(json.error ?? 'Alert konnte nicht erstellt werden.');
    }
  }

  async function saveNotificationSettings() {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notify_email: notifyEmail,
        email_alerts_enabled: emailAlertsEnabled,
      }),
    });
    const json = await response.json();
    setSaving(false);
    if (response.ok) {
      setMessage(`Benachrichtigungseinstellungen gespeichert${json.item?.email_alerts_enabled ? '' : ' (E-Mail-Versand ist deaktiviert)'}.`);
    } else {
      setMessage(json.error ?? 'Benachrichtigungseinstellungen konnten nicht gespeichert werden.');
    }
  }

  async function refreshAlertEvents() {
    const response = await fetch('/api/alert-events', { cache: 'no-store' });
    const json = await response.json();
    if (response.ok) {
      setEvents(json.items ?? []);
      setMessage('Alert-Ereignisse aktualisiert.');
    } else {
      setMessage(json.error ?? 'Alert-Ereignisse konnten nicht geladen werden.');
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-slate-500">Angemeldet als</div>
            <div className="mt-1 break-all text-lg font-semibold sm:text-xl">{email}</div>
            <p className="mt-2 text-slate-600">Research- und Screening-Dashboard mit Supabase, Live-Refresh und E-Mail-Alerts.</p>
            <p className="mt-2 text-sm text-slate-500">Letzte Datenaktualisierung: {lastUpdatedLabel}</p>
          </div>
          <button onClick={signOut} className="rounded-2xl border border-slate-300 px-4 py-3 font-medium text-slate-900">
            Ausloggen
          </button>
        </div>

        {message ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div> : null}

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                placeholder="Suche nach Symbol, Name, Sektor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <input
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">Min. Score: {minScore}</div>
            </div>

            <div className="grid gap-4">
              {filtered.map((item) => {
                const onWatchlist = watchlist.some((entry) => entry.symbol === item.symbol);
                return (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold">{item.symbol}</h2>
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-sm">{item.name}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">Score {item.total_score}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">Risiko: {item.risk_level}</span>
                        </div>
                        <p className="mt-3 text-slate-600">{item.thesis}</p>
                        <div className="mt-3 text-sm text-slate-500">
                          Qualität {item.quality_score} · Momentum {item.momentum_score} · Bewertung {item.valuation_score} · Stabilität {item.stability_score} · Wachstum {item.growth_score}
                        </div>
                      </div>
                      <div className="min-w-0 md:min-w-52 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-4 text-right">
                          <div className="text-sm text-slate-500">Preis</div>
                          <div className="mt-1 text-2xl font-semibold">{item.price ?? '-'}</div>
                          <div className="mt-1 text-sm text-slate-500">Tagesänderung: {item.day_change ?? '-'}%</div>
                          <div className="mt-1 text-xs text-slate-400">Aktualisiert: {new Date(item.updated_at).toLocaleString('de-CH')}</div>
                        </div>
                        {onWatchlist ? (
                          <button
                            disabled={saving}
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 disabled:opacity-60"
                          >
                            Aus Watchlist entfernen
                          </button>
                        ) : (
                          <button
                            disabled={saving}
                            onClick={() => addToWatchlist(item.symbol)}
                            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                          >
                            Zur Watchlist hinzufügen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Watchlist</h3>
              <div className="mt-4 space-y-3">
                {watchlist.length === 0 ? (
                  <p className="text-sm text-slate-500">Noch keine Einträge vorhanden.</p>
                ) : (
                  watchlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="font-medium">{item.symbol}</span>
                      <button onClick={() => removeFromWatchlist(item.symbol)} className="text-sm text-slate-600">
                        Entfernen
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Neuen Alert anlegen</h3>
              <div className="mt-4 space-y-3">
                <select className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
                  {opportunities.map((item) => (
                    <option key={item.symbol} value={item.symbol}>
                      {item.symbol} — {item.name}
                    </option>
                  ))}
                </select>
                <select className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                  <option value="price_above">Preis über Schwelle</option>
                  <option value="price_below">Preis unter Schwelle</option>
                  <option value="score_above">Score über Schwelle</option>
                </select>
                <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="Schwellenwert" inputMode="decimal" />
                <button disabled={saving} onClick={createAlert} className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-60">
                  Alert speichern
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">E-Mail-Benachrichtigungen</h3>
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-slate-600">Benachrichtigungs-E-Mail</label>
                <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="du@example.com" />
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={emailAlertsEnabled} onChange={(e) => setEmailAlertsEnabled(e.target.checked)} />
                  E-Mail-Alerts aktivieren
                </label>
                <p className="text-xs leading-5 text-slate-500">Bei jedem Refresh werden neue Treffer gesammelt und als Sammelmail verschickt, sofern RESEND_API_KEY und ALERT_FROM_EMAIL gesetzt sind.</p>
                <button disabled={saving} onClick={saveNotificationSettings} className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-medium text-slate-900 disabled:opacity-60">
                  Einstellungen speichern
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Letzte Alert-Ereignisse</h3>
                <button onClick={refreshAlertEvents} className="rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-700">Neu laden</button>
              </div>
              <div className="mt-4 space-y-3">
                {events.length === 0 ? (
                  <p className="text-sm text-slate-500">Noch keine Trigger vorhanden.</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{event.symbol}</span>
                        <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">{event.alert_type}</span>
                        {event.delivered_at ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Mail gesendet</span> : <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">noch nicht zugestellt</span>}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{event.message}</p>
                      <div className="mt-2 text-xs text-slate-500">{new Date(event.triggered_at).toLocaleString('de-CH')}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Aktive Alerts</h3>
              <div className="mt-4 space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-sm text-slate-500">Noch keine Alerts angelegt.</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-medium">{alert.symbol}</div>
                      <div className="mt-1 text-sm text-slate-600">{alert.alert_type} · Schwelle {alert.threshold ?? '-'}</div>
                      <div className="mt-1 text-xs text-slate-500">Letzter Trigger: {alert.last_triggered_at ? new Date(alert.last_triggered_at).toLocaleString('de-CH') : 'noch nie'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
