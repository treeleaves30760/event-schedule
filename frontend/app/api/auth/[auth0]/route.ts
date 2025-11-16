// TODO: Fix Auth0 integration - handleAuth is not compatible with Next.js 16
// The @auth0/nextjs-auth0 package currently supports Next.js 14-15
// Until auth0 updates their package, this route is disabled
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Auth0 integration temporarily disabled due to Next.js 16 compatibility' }, { status: 501 });
}
