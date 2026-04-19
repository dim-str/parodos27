import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const jwtCookie = cookieStore.get('admin_jwt');

        if (!jwtCookie?.value) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({ authenticated: true, token: jwtCookie.value });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
