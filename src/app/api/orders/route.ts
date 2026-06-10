import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx4GrXsUkhk0mTnF8eY_9X5z0p5OszkC6U6A_pUfHInN6ZscU_fW52r08g3UizM10wT/exec';

// متد GET اصلاح شده بدون استفاده از request.url برای سازگاری با گیت‌هاب پیجز
export async function GET() {
  try {
    const res = await fetch(GAS_URL, {
      method: 'GET',
      cache: 'no-store',
    });

    const text = await res.text();

    try {
      return NextResponse.json(JSON.parse(text));
    } catch (e) {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
