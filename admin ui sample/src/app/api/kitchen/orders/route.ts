import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';

// GET active kitchen orders
export async function GET() {
  try {
    // Select active orders from database
    const rows: any[] = await query(`
      SELECT o.Order_no, o.table_number, o.name_of_order, o.ITEM, o.order_status, o.date_and_time,
             m.P_image
      FROM Orders o
      LEFT JOIN masterlist m ON m.P_name = o.name_of_order
      ORDER BY o.date_and_time ASC
    `);

    const ordersGrouped: { [key: string]: any } = {};

    rows.forEach((row) => {
      const orderNo = row.Order_no;
      if (!ordersGrouped[orderNo]) {
        ordersGrouped[orderNo] = {
          order_no: orderNo,
          table_number: row.table_number,
          status: row.order_status ? row.order_status : 'Pending',
          date_and_time: row.date_and_time,
          items: []
        };
      }
      ordersGrouped[orderNo].items.push({
        name: row.name_of_order,
        qty: parseInt(row.ITEM) || 0,
        image: row.P_image || null
      });
    });

    return NextResponse.json(Object.values(ordersGrouped));
  } catch (error: any) {
    console.error('Fetch kitchen orders API error:', error);
    return NextResponse.json({ success: false, message: 'Database error: ' + error.message }, { status: 500 });
  }
}

// POST new orders from waiter app
export async function POST(request: Request) {
  let connection;
  try {
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ success: false, message: 'No data received' }, { status: 400 });
    }

    const { orderNo, items } = data;
    let tableNumber = data.tableNumber || '';

    if (!tableNumber) {
      const match = /^T(\d+)-/.exec(String(orderNo));
      if (match) {
        tableNumber = match[1];
      } else {
        tableNumber = 'N/A';
      }
    }

    if (!orderNo || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Missing orderNo or items' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const sql = `
      INSERT INTO Orders (Order_no, table_number, name_of_order, ITEM, price, subtotal, date_and_time, order_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;

    // Local time formatting for datetime column
    const now = new Date();
    // Format: YYYY-MM-DD HH:MM:SS (local Philippine time is UTC+8, mysql pool connection uses +08:00 timezone, but let's pass formatted string)
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    for (const item of items) {
      const qty = parseInt(item.qty) || 0;
      const price = parseFloat(item.price) || 0;
      const subtotal = qty * price;
      const pName = item.name;

      await connection.execute(sql, [
        String(orderNo),
        String(tableNumber),
        String(pName),
        qty,
        price,
        subtotal,
        dateTime
      ]);
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Insert waiter order API error:', error);
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
