import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { username, password } = await request.json();
        const backendApiUrl = process.env.NEXT_PUBLIC_API_URL;

        // ΝΕΟ: Τυπώνουμε στο τερματικό του Next.js τι πάει να κάνει!
        console.log(`[Next.js] Trying to login user: ${username} to URL: ${backendApiUrl}/auth/login`);

        if (!backendApiUrl) {
            return NextResponse.json({ success: false, message: 'Missing backend URL' }, { status: 500 });
        }

        const backendResponse = await fetch(`${backendApiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error('[Next.js] Spring Boot rejected the login:', backendResponse.status, errorText);
            
            let message = 'Λάθος στοιχεία σύνδεσης';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) message = errorJson.message;
            } catch (e) {}

            return NextResponse.json({ success: false, message }, { status: backendResponse.status });
        }

        const payload = await backendResponse.json();
        if (!payload?.token) {
            return NextResponse.json({ success: false, message: 'Invalid token response' }, { status: 500 });
        }

        const cookieStore = await cookies();
        cookieStore.set('jwt', payload.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: Math.floor((payload.expiresInMs || 86400000) / 1000)
        });

        return NextResponse.json({
            success: true,
            token: payload.token, // Επιστροφή του token για το localStorage του frontend
            username: payload.username,
            role: payload.role
        });
    } catch (error) {
        console.error('[Next.js] Auth login error:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}