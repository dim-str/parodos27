import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();

        const validPassword = process.env.ADMIN_PASSWORD;
        const secretKey = process.env.ADMIN_SECRET_KEY;

        const inputPass = body.password ? body.password.trim() : "";
        const envPass = validPassword ? validPassword.trim() : "ΚΕΝΟ_Η_UNDEFINED";

        if (inputPass === envPass && envPass !== "ΚΕΝΟ_Η_UNDEFINED") {

            // --- FIX ΓΙΑ NEXT.JS 16: Το cookies() θέλει await! ---
            const cookieStore = await cookies();
            cookieStore.set('admin_auth', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24
            });

            return NextResponse.json({ success: true, key: secretKey });
        }

        return NextResponse.json({ success: false, message: 'Λάθος κωδικός' }, { status: 401 });
    } catch (error) {
        console.error("Σφάλμα API:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}