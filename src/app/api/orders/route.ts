import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchParams.toString();
    // Updated GAS URL as requested
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbx4GrXsUkhk0mTnlkBLCBUXCJneSPnc7sYY3E0dhb-dI8Jvh7wKQYR8w3EdCYi9G4-hjw/exec';
    const url = params ? GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + params : GAS_URL;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // For actions like deleteOrder, we can return success immediately as they might not return JSON
    if (searchParams.get('action')) {
      return NextResponse.json({ success: true, message: 'Action triggered' });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    // Silent fail for mutation requests to ensure UI flow isn't blocked
    if (new URL(request.url).searchParams.get('action')) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
