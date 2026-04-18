import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    // --- FIX ΓΙΑ NEXT.JS 16 ---
    const cookieStore = await cookies();
    cookieStore.delete('admin_auth');

    return NextResponse.json({ success: true });
}