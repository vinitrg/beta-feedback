import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    const accessCode = process.env.ACCESS_CODE;
    const adminCode = process.env.ADMIN_CODE;

    if (!accessCode) {
      console.error('ACCESS_CODE environment variable is not set');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Check if it's a valid access code or admin code
    if (code === accessCode) {
      return NextResponse.json({ success: true, role: 'tester' });
    }

    if (adminCode && code === adminCode) {
      return NextResponse.json({ success: true, role: 'admin' });
    }

    return NextResponse.json({ success: false, error: 'Invalid access code' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
