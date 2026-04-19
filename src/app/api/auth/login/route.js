import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { password } = await request.json();
        const backendApiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!backendApiUrl) {
            return NextResponse.json({ success: false, message: 'Missing backend URL' }, { status: 500 });
        }

        const backendResponse = await fetch(`${backendApiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!backendResponse.ok) {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        const payload = await backendResponse.json();
        if (!payload?.token) {
            return NextResponse.json({ success: false, message: 'Invalid token response' }, { status: 500 });
        }

        const cookieStore = await cookies();
        cookieStore.set('admin_jwt', payload.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: Math.floor((payload.expiresInMs || 86400000) / 1000)
        });

        return NextResponse.json({
            success: true,
            token: payload.token,
            tokenType: payload.tokenType || 'Bearer',
            expiresInMs: payload.expiresInMs || 86400000
        });
    } catch (error) {
        console.error('Auth login error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
