import { NextRequest, NextResponse } from 'next/server';

// Proxy admin login to backend real endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiBase = process.env.BACKEND_URL || 'http://localhost:5000';

    const resp = await fetch(`${apiBase}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    // Normalize backend response to { success, token, user, message }
    if (resp.ok && data?.success) {
      const token = data?.data?.token || data?.token;
      const user = data?.data?.user || data?.user;
      return NextResponse.json({ success: true, token, user, message: data?.message }, { status: 200 });
    }
    return NextResponse.json({ success: false, message: data?.message || 'Login failed' }, { status: resp.status || 500 });
  } catch (error) {
    console.error('Admin login proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reach backend' },
      { status: 502 }
    );
  }
}
