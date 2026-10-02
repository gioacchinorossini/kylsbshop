import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pCode = parseInt(id);

    if (isNaN(pCode)) {
      return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
    }

    // Get product to find its image
    const products = await query('SELECT P_image FROM masterlist WHERE P_code = ? LIMIT 1', [pCode]);
    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const image = products[0].P_image;
    if (image) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', image);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Image might not exist on disk, continue deletion from DB
        console.warn(`Could not delete image file ${filePath}:`, err);
      }
    }

    // Delete product
    await query('DELETE FROM masterlist WHERE P_code = ?', [pCode]);

    return NextResponse.json({ success: true, message: 'Product deleted successfully!' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
