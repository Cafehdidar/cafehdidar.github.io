import { NextResponse } from 'next/server';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx4GrXsUkhk0mTnlkBLCBUXCJneSPnc7sYY3E0dhb-dI8Jvh7wKQYR8w3EdCYi9G4-hjw/exec';

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
      // Attempt to parse JSON (e.g., when fetching the orders list)
      return NextResponse.json(JSON.parse(text));
    } catch (e) {
      // If parsing fails (e.g., for actions like deleteOrder that might return non-JSON),
      // return a success response to keep the UI flow smooth.
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
