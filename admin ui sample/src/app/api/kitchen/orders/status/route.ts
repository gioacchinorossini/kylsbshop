import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';

export async function POST(request: Request) {
  let connection;
  try {
    const data = await request.json();
    const { order_no: orderNo, status } = data;

    if (!orderNo || !status) {
      return NextResponse.json({ success: false, message: 'Missing order_no or status' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (String(status).toLowerCase() === 'archive') {
      // Check if already in complitorder
      const checkRows: any = await connection.execute(
        'SELECT COUNT(*) as count FROM complitorder WHERE Order_no = ?',
        [String(orderNo)]
      );
      const count = checkRows[0][0]?.count || 0;

      if (count === 0) {
        // Insert into complitorder select from Orders
        await connection.execute(
          `INSERT INTO complitorder (Order_no, table_number, name_of_order, ITEM) 
           SELECT Order_no, table_number, name_of_order, ITEM 
           FROM Orders WHERE Order_no = ?`,
          [String(orderNo)]
        );
      }

      // Delete from active Orders
      await connection.execute(
        'DELETE FROM Orders WHERE Order_no = ?',
        [String(orderNo)]
      );
    } else {
      // Update order_status in Orders
      await connection.execute(
        'UPDATE Orders SET order_status = ? WHERE Order_no = ?',
        [String(status), String(orderNo)]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update kitchen status API error:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.error('Rollback error:', rbErr);
      }
    }
    return NextResponse.json({ success: false, message: 'Database error: ' + error.message }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
