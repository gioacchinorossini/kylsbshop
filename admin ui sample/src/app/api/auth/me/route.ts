import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const role = cookieStore.get('user_role')?.value;
  const name = cookieStore.get('user_name')?.value;

  if (!userId) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      userId,
      role,
      name
    }
  });
}
