import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx4GrXsUkhk0mTnlkBLCBUXCJneSPnc7sYY3E0dhb-dI8Jvh7wKQYR8w3EdCYi9G4-hjw/exec';

/**
 * Proxy route for fetching orders. This bypasses browser CORS for READ operations (JSON fetch).
 * For write operations, the frontend uses an iframe trick to avoid CORS preflight issues.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  const url = params ? GAS_URL + '?' + params : GAS_URL;

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });
    
    const text = await res.text();
    
    try {
      // Attempt to parse JSON (usually for the GET fetch to list orders)
      return NextResponse.json(JSON.parse(text));
    } catch (e) {
      // Fallback for non-JSON responses from the script
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
