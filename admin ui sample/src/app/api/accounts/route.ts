import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET all accounts
export async function GET() {
  try {
    const accounts = await query(`
      SELECT ACC_ID, Acc_Name, User_ID, Role, Date_Time 
      FROM account 
      ORDER BY Date_Time DESC
    `);
    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Fetch accounts error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// POST create or update account
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const action = data.action || 'insert';
    const accName = data.accountName || '';
    const userId = data.userName || '';
    const role = data.role || '';
    const passWord = data.password || '';

    if (!accName || !userId || !role) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    if (action === 'insert') {
      if (!passWord) {
        return NextResponse.json({ success: false, message: 'Password cannot be empty for new accounts.' }, { status: 400 });
      }

      const hashedPassword = bcrypt.hashSync(passWord, 10);
      
      try {
        await query(
          'INSERT INTO account (Acc_Name, User_ID, Pass_Word, Role) VALUES (?, ?, ?, ?)',
          [accName, userId, hashedPassword, role]
        );
        return NextResponse.json({ success: true, message: 'Account created successfully!' });
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
          return NextResponse.json({ success: false, message: 'Error: User ID already exists.' }, { status: 400 });
        }
        throw err;
      }
    } 
    
    if (action === 'update') {
      const accId = data.accId;
      if (!accId) {
        return NextResponse.json({ success: false, message: 'Account ID is required for updating.' }, { status: 400 });
      }

      const queryParts = ['Acc_Name = ?', 'User_ID = ?', 'Role = ?'];
      const params = [accName, userId, role];

      if (passWord) {
        const hashedPassword = bcrypt.hashSync(passWord, 10);
        queryParts.push('Pass_Word = ?');
        params.push(hashedPassword);
      }

      params.push(accId);

      const sql = `UPDATE account SET ${queryParts.join(', ')} WHERE ACC_ID = ?`;
      
      try {
        await query(sql, params);
        return NextResponse.json({ success: true, message: 'Account updated successfully!' });
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
          return NextResponse.json({ success: false, message: 'Error: User ID already exists.' }, { status: 400 });
        }
        throw err;
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Account save error:', error);
    return NextResponse.json({ success: false, message: 'Database error: ' + error.message }, { status: 500 });
  }
}

// DELETE account
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const accId = parseInt(id);
    if (isNaN(accId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    await query('DELETE FROM account WHERE ACC_ID = ?', [accId]);
    return NextResponse.json({ success: true, message: 'Account deleted successfully!' });
  } catch (error: any) {
    console.error('Account delete error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
