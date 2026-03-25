import { NextRequest, NextResponse } from 'next/server';

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const bearer = request.headers.get('authorization');
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : request.headers.get('x-cron-secret');
  return token === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/opportunities/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
    },
    cache: 'no-store',
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
