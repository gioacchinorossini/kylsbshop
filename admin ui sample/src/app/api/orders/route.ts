import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';

// GET orders list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    let sql = `
      SELECT 
        Order_No, 
        DATE_FORMAT(Date_Time, '%Y-%m-%d %H:%i:%s') as Date_Time, 
        SUM(Quantity) as Total_Qty, 
        SUM(SubTotal) as Total_Amount, 
        Order_Type, 
        Payment_Method 
      FROM ortb
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      conditions.push('Date_Time >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      conditions.push('Date_Time <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      sql = `
        SELECT o.*, 
        ( (SELECT IFNULL(SUM(Quantity), 0) FROM stockin WHERE Product_code = o.P_Code) - 
          (SELECT IFNULL(SUM(Quantity), 0) FROM ortb WHERE P_Code = o.P_Code) ) as LiveStock
        FROM ortb o
      `;
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY o.Date_Time DESC';
    } else {
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' GROUP BY Order_No ORDER BY Date_Time DESC';
    }

    const orders = await query(sql, params);
    
    if (detailed) {
      const formatted = orders.map((o: any) => ({
        OR_ID: o.OR_ID,
        Order_No: o.Order_No,
        P_Code: o.P_Code,
        Product_Name: o.Product_Name,
        Quantity: parseInt(o.Quantity) || 0,
        Price: parseFloat(o.Price) || 0,
        SubTotal: parseFloat(o.SubTotal) || 0,
        Order_Type: o.Order_Type,
        Payment_Method: o.Payment_Method,
        Ref_Code: o.Ref_Code,
        Cash: parseFloat(o.Cash) || 0,
        Change: parseFloat(o.Change) || 0,
        Date_Time: o.Date_Time,
        LiveStock: parseInt(o.LiveStock) || 0
      }));
      return NextResponse.json(formatted);
    }

    // Format numbers for summary view
    const formatted = orders.map((o: any) => ({
      Order_No: o.Order_No,
      Date_Time: o.Date_Time,
      Total_Qty: parseInt(o.Total_Qty) || 0,
      Total_Amount: parseFloat(o.Total_Amount) || 0,
      Order_Type: o.Order_Type,
      Payment_Method: o.Payment_Method
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// DELETE all transactions
export async function DELETE(request: Request) {
  try {
    await query('DELETE FROM ortb');
    return NextResponse.json({ success: true, message: 'All transactions cleared successfully!' });
  } catch (error: any) {
    console.error('Clear transactions error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// POST create order
export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json();
    const { orderNo, orderType, paymentMethod, refCode, cash, change, items } = body;

    if (!orderNo || !orderType || !paymentMethod || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // Get connection from pool for transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const sql = `
      INSERT INTO ortb (
        Order_No, P_Code, Product_Name, Quantity, Price, SubTotal, Order_Type, Payment_Method, Ref_Code, Cash, \`Change\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      const pCode = item.id;
      const pName = item.name;
      const qty = parseInt(item.qty) || 0;
      const price = parseFloat(item.price) || 0;
      const subtotal = qty * price;
      const itemCash = paymentMethod === 'cash' ? parseFloat(cash) : price * qty;
      const itemChange = paymentMethod === 'cash' ? parseFloat(change) : 0;

      await connection.execute(sql, [
        String(orderNo),
        String(pCode),
        String(pName),
        qty,
        price,
        subtotal,
        String(orderType),
        String(paymentMethod),
        refCode ? String(refCode) : null,
        itemCash,
        itemChange
      ]);
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Create order error:', error);
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
