import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET details of specific order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params;

    const items = await query('SELECT * FROM ortb WHERE Order_No = ?', [orderNo]);
    
    const formatted = items.map((item: any) => ({
      OR_ID: item.OR_ID,
      Order_No: item.Order_No,
      P_Code: item.P_Code,
      Product_Name: item.Product_Name,
      Quantity: parseInt(item.Quantity) || 0,
      Price: parseFloat(item.Price) || 0,
      SubTotal: parseFloat(item.SubTotal) || 0,
      Order_Type: item.Order_Type,
      Payment_Method: item.Payment_Method,
      Ref_Code: item.Ref_Code,
      Cash: parseFloat(item.Cash) || 0,
      Change: parseFloat(item.Change) || 0,
      Date_Time: item.Date_Time
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch order details error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// PUT update order metadata
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params;
    const body = await request.json();
    const { orderType, paymentMethod } = body;

    if (!orderType || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    await query(
      'UPDATE ortb SET Order_Type = ?, Payment_Method = ? WHERE Order_No = ?',
      [orderType, paymentMethod, orderNo]
    );

    return NextResponse.json({ success: true, message: 'Order metadata updated successfully!' });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// DELETE entire order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  try {
    const { orderNo } = await params;

    await query('DELETE FROM ortb WHERE Order_No = ?', [orderNo]);

    return NextResponse.json({ success: true, message: 'Order deleted successfully!' });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
