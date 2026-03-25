import Link from 'next/link';

const features = [
  {
    title: 'Echte Sessions',
    text: 'Supabase Auth per Magic Link statt Demo-Cookie.',
  },
  {
    title: 'Persistente Daten',
    text: 'Watchlist und Alerts werden in Supabase gespeichert.',
  },
  {
    title: 'Ausbaufähige Architektur',
    text: 'Bereit für Cron-Jobs, Live-Daten, Notifications und Backtesting.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
              Fullstack Starter v5
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900">
              Investment Signals mit E-Mail-Alerts und iPhone-tauglichem Web-App-Setup
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Next.js, Supabase Auth, persistente Watchlists und Alerts, E-Mail-Zustellung für Trigger und ein Setup, das sich sauber auf dem iPhone testen lässt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white">
                Zum Login
              </Link>
              <Link href="/dashboard" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900">
                Dashboard öffnen
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Auth</div>
                <div className="mt-2 text-3xl font-semibold">Magic Link</div>
                <div className="mt-2 text-sm text-slate-600">Supabase Session statt Demo-Login</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Persistenz</div>
                <div className="mt-2 text-3xl font-semibold">DB</div>
                <div className="mt-2 text-sm text-slate-600">Watchlist und Alerts werden gespeichert</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-600">
              Hinweis: Die Scoring-Logik und Seed-Daten sind enthalten. E-Mail-Alerts, mobiler Homescreen-Support und tägliche Refresh-Jobs sind vorbereitet.
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
