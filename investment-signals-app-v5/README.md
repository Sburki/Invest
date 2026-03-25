# Investment Signals App v5

Diese Version ergänzt zwei große Bausteine:

- **E-Mail-Zustellung für Alerts** über Resend
- **iPhone-taugliches Web-App-Setup** mit Manifest, Apple Web App Meta und mobilem Dashboard

## Enthaltene Features

- Supabase Auth per Magic Link
- serverseitig geschütztes Dashboard
- persistente Watchlist und Alerts
- Opportunities in Supabase
- Refresh-Route mit Secret-Schutz
- täglicher Cron-Job für Refreshes
- Alert-Evaluierung mit Speicherung in `alert_events`
- optionale E-Mail-Zustellung für neue Trigger
- mobil besser nutzbares Dashboard
- PWA-/Homescreen-Basis für iPhone

## Schnellstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

Dann lokal im Browser öffnen:

```bash
http://localhost:3000
```

## Supabase Setup

1. Neues Supabase-Projekt anlegen
2. `supabase/schema.sql` im SQL Editor ausführen
3. `supabase/seed.sql` ausführen
4. `.env.local` mit den Supabase Keys befüllen
5. In Supabase Auth unter URL Configuration die Redirect URL setzen:
   - `http://localhost:3000/auth/callback`
   - später in Produktion `https://deine-domain.tld/auth/callback`

## Live-Daten aktivieren

Standardmäßig läuft die App mit Mock-Daten. Für Live-Daten:

```bash
MARKET_DATA_PROVIDER=alphavantage
ALPHA_VANTAGE_API_KEY=dein_key
MARKET_SYMBOLS=MSFT,ASML,NVDA,NESN,VWCE
```

Wenn der Live-Provider fehlschlägt, fällt die App automatisch auf das Demo-Universum zurück.

## E-Mail-Alerts aktivieren

Setze zusätzlich diese Variablen:

```bash
RESEND_API_KEY=dein_resend_key
ALERT_FROM_EMAIL=alerts@deine-domain.tld
```

Danach kannst du dich einloggen, im Dashboard eine Benachrichtigungs-E-Mail hinterlegen und **E-Mail-Alerts aktivieren**.

Falls `RESEND_API_KEY` oder `ALERT_FROM_EMAIL` fehlen, markiert die App Zustellungen nur als Log-Ausgabe und verschickt keine echte Mail.

## Refresh manuell auslösen

```bash
curl -X POST http://localhost:3000/api/opportunities/refresh \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Täglicher Cron-Job

In `vercel.json` ist ein Werktags-Job um 06:00 UTC definiert:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-refresh",
      "schedule": "0 6 * * 1-5"
    }
  ]
}
```

## Auf dem iPhone testen

Am einfachsten geht das über **Vercel**:

1. Projekt nach GitHub pushen
2. Bei Vercel importieren
3. alle Env-Variablen setzen
4. nach dem Deploy die URL in **Safari auf dem iPhone** öffnen
5. optional: **Teilen → Zum Home-Bildschirm**

Dann kannst du die App wie eine installierte Web-App starten.

### Lokales Testen im selben WLAN

Wenn du lokal testen willst, kannst du die App auch im Heimnetz öffnen:

```bash
npm run dev -- --hostname 0.0.0.0
```

Dann die lokale IP deines Rechners verwenden, z. B.:

```bash
http://192.168.1.23:3000
```

Wichtig: Magic Links und Auth-Redirects müssen dann zur passenden URL in Supabase eingetragen sein.

## Was noch fehlt bis zur echten Produktversion

- Push-Benachrichtigungen statt nur E-Mail
- robusterer deduplizierter Versand bei vielen Events
- Retry-Strategien und Error Logging
- Monitoring und Tests
- fundiertere Marktdaten-Provider für Produktion
- Compliance- und Risiko-Layer

## Wichtige Hinweise

- Das Projekt ist ein Starter und kein fertiges Trading-System.
- Die App liefert Screening- und Monitoring-Signale, keine garantierten Gewinne.
- Für echten Betrieb fehlen noch Zustell-Monitoring, Provider-Härtung und rechtliche Prüfung.
