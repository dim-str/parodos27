import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // --- FIX ΓΙΑ NEXT.JS 16 ---
        const cookieStore = await cookies();
        const hasCookie = cookieStore.get('admin_auth');

        if (hasCookie) {
            return NextResponse.json({ authenticated: true, token: process.env.ADMIN_SECRET_KEY });
        }
        return NextResponse.json({ authenticated: false }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}