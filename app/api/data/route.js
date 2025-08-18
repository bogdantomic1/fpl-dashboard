// app/api/fixtures/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // don’t statically cache this route
export const revalidate = 0; // disable ISR for this route
export const fetchCache = 'force-no-store'; // Next 14+: opt this route out of data cache

export async function GET() {
  try {
    const response = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      {
        // Important: opt OUT of Next’s fetch cache
        cache: 'no-store',
        // (optional) also tell Next’s per-request cache layer:
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) throw new Error('Upstream failed');

    const data = await response.json();

    // Also prevent CDN/browser caching of *this API response*
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        // On Vercel, these help ensure the edge/CDN doesn’t cache it either:
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Error fetching FPL fixtures:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
