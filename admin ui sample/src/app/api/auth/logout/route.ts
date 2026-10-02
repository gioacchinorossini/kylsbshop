import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  response.cookies.set('user_id', '', { path: '/', maxAge: 0 });
  response.cookies.set('user_role', '', { path: '/', maxAge: 0 });
  response.cookies.set('user_name', '', { path: '/', maxAge: 0 });
  
  return response;
}
export async function GET() {
  return POST();
}
