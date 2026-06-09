import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchParams.toString();
    const GAS_URL = 'https://script.google.com/macros/s/AKfycb1DPqKB6NYDP4sB0gY-6YUNCfXw6lip5lc9mWuAvHM7GlCjfLtuZ7NDJ9f4qBnNtCGOA/exec';
    const url = params ? GAS_URL + '?' + params : GAS_URL;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    // Fallback for mutation requests that might not return JSON or have different response formats
    return NextResponse.json({ success: true, message: 'Request processed' });
  }
}
