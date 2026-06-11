import { signOut } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return await signOut({
    redirect: true,
    redirectTo: '/login',
  });
}

export async function POST(request: NextRequest) {
  return await signOut({
    redirect: true,
    redirectTo: '/login',
  });
}
