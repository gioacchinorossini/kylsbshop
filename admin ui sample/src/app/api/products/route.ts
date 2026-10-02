import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

// GET all products
export async function GET() {
  try {
    const products = await query(`
      SELECT 
        P_code, 
        Product_code, 
        P_name, 
        P_Category, 
        P_S_P, 
        P_P_P, 
        P_image, 
        DATE_FORMAT(Date_time, '%M %d, %Y %h:%i %p') AS Date_time 
      FROM masterlist 
      ORDER BY Date_time DESC
    `);
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}

// POST add product
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pCode = formData.get('pCode') as string;
    const pName = formData.get('pName') as string;
    const pCategory = formData.get('pCategory') as string;
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string);
    const pImage = formData.get('pImage') as File | null;

    if (!pCode || !pName || !pCategory || isNaN(sellingPrice) || isNaN(purchasePrice)) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // Check if Product Code already exists
    const existing = await query('SELECT P_code FROM masterlist WHERE Product_code = ? LIMIT 1', [pCode]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Product code already exists.' }, { status: 400 });
    }

    let imageName: string | null = null;

    if (pImage && pImage.size > 0) {
      const extension = pImage.name.split('.').pop();
      const sanitizedBase = `${pCode}_${pName}`.replace(/[^A-Za-z0-9_\-]/g, '_');
      imageName = `${sanitizedBase}.${extension}`;
      
      const bytes = await pImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, imageName);
      await fs.writeFile(filePath, buffer);
    }

    // Insert into database
    await query(
      'INSERT INTO masterlist (Product_code, P_name, P_Category, P_S_P, P_P_P, P_image) VALUES (?, ?, ?, ?, ?, ?)',
      [pCode, pName, pCategory, sellingPrice, purchasePrice, imageName]
    );

    return NextResponse.json({ success: true, message: 'Product added successfully!' });
  } catch (error: any) {
    console.error('Save product error:', error);
    return NextResponse.json({ success: false, message: 'Database error: ' + error.message }, { status: 500 });
  }
}
