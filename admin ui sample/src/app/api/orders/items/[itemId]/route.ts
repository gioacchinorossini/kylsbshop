import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const orId = parseInt(itemId);

    if (isNaN(orId)) {
      return NextResponse.json({ success: false, message: 'Invalid item ID' }, { status: 400 });
    }

    await query('DELETE FROM ortb WHERE OR_ID = ?', [orId]);

    return NextResponse.json({ success: true, message: 'Item removed from order successfully!' });
  } catch (error: any) {
    console.error('Delete order item error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
