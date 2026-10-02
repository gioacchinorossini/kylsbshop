import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // Query user
    const users = await query(
      'SELECT Pass_Word, Role, Acc_Name FROM account WHERE User_ID = ? LIMIT 1',
      [username]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = bcrypt.compareSync(password, user.Pass_Word);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Set cookie response
    const response = NextResponse.json({
      success: true,
      user: {
        userId: username,
        name: user.Acc_Name,
        role: user.Role,
      }
    });

    // Simple session cookies
    response.cookies.set('user_id', username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    response.cookies.set('user_role', user.Role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    response.cookies.set('user_name', user.Acc_Name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
