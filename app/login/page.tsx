'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

const errorMap: Record<string, string> = {
  missing_code: 'Der Login-Link war unvollständig.',
  auth_callback_failed: 'Die Supabase-Anmeldung konnte nicht abgeschlossen werden.',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorText = useMemo(() => {
    const code = searchParams.get('error');
    return code ? errorMap[code] ?? 'Beim Login ist ein Fehler aufgetreten.' : '';
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);
    if (!error) {
      setSent(true);
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Supabase Login</h1>
        <p className="mt-3 text-slate-600">
          Melde dich per Magic Link an. Nach Klick auf den Link landest du direkt im geschützten Dashboard.
        </p>

        {errorText ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorText}
          </div>
        ) : null}

        {sent ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Login-Link wurde versendet. Prüfe dein Postfach und öffne den Link im selben Browser.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">E-Mail</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@example.com"
              required
            />
          </div>
          <button
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sende Login-Link ...' : 'Magic Link senden'}
          </button>
        </form>
      </div>
    </main>
  );
}
