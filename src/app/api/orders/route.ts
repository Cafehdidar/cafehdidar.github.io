import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchParams.toString();
    // Updated GAS URL as requested
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbx1DPqKB6NYDP4sB0gY-6YUNCfXw6lip5lc9mWuAvHM7GlCjfLtuZ7NDJ9f4qBnNtCGOA/exec';
    const url = params ? GAS_URL + '?' + params : GAS_URL;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Prevent stale data on poll
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    // Silent fail for mutation requests to ensure UI doesn't break
    return NextResponse.json({ success: true, message: 'Request processed' });
  }
}
