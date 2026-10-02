import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET stock information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';

    if (action === 'get_categories') {
      const categories = await query('SELECT DISTINCT P_Category FROM masterlist ORDER BY P_Category ASC');
      return NextResponse.json(categories.map((c: any) => c.P_Category));
    } 
    
    if (action === 'get_products') {
      const category = searchParams.get('category');
      if (!category) {
        return NextResponse.json({ success: false, message: 'Category is required' }, { status: 400 });
      }
      const products = await query(
        'SELECT Product_code, P_name, P_S_P FROM masterlist WHERE P_Category = ? ORDER BY P_name ASC',
        [category]
      );
      return NextResponse.json(products);
    }

    if (action === 'get_history') {
      const history = await query(`
        SELECT 
          Sin_ID, 
          DATE_FORMAT(Date_time, '%M %d, %Y %h:%i %p') AS Date_time, 
          Product_code, 
          P_name, 
          Quantity 
        FROM stockin 
        ORDER BY Sin_ID DESC
      `);
      return NextResponse.json(history);
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Stock GET error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// POST stock-in entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pCode, pName, pCategory, pSP, quantity } = body;

    if (!pCode || !pName || !pCategory || pSP === undefined || !quantity) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    await query(
      'INSERT INTO stockin (Product_code, P_name, P_Category, P_S_P, Quantity) VALUES (?, ?, ?, ?, ?)',
      [pCode, pName, pCategory, parseFloat(pSP), parseInt(quantity)]
    );

    return NextResponse.json({ success: true, message: 'Stock entry saved successfully!' });
  } catch (error: any) {
    console.error('Stock POST error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// DELETE stock-in entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const sinId = parseInt(id);
    if (isNaN(sinId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    await query('DELETE FROM stockin WHERE Sin_ID = ?', [sinId]);
    return NextResponse.json({ success: true, message: 'Stock entry deleted successfully!' });
  } catch (error: any) {
    console.error('Stock DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
