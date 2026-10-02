import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  status: string;
  stock: number;
  image: string | null;
  emoji: string;
}

interface CategoryGroup {
  label: string;
  icon: string;
  sections: {
    [sectionName: string]: MenuItem[];
  };
}

function getCategoryIcon(cat: string): string {
  switch (cat.toLowerCase()) {
    case 'coffee': return '☕';
    case 'others': return '❓';
    case 'bread': return '🥐';
    case 'pastries': return '🍰';
    case 'sandwich': return '🥪';
    case 'inasal': return '🍗';
    case 'drinks': return '🥤';
    case 'sizzling': return '🍳';
    case 'seafood': return '🐟';
    case 'shakes': return '🍹';
    case 'liquor': return '🍺';
    case 'appetizers': return '🍟';
    default: return '🍽️';
  }
}

export async function GET() {
  try {
    const rows: any[] = await query(`
      SELECT 
        m.Product_code, 
        m.P_name, 
        m.P_Category, 
        m.P_S_P, 
        m.P_image,
        (IFNULL((SELECT SUM(s.Quantity) FROM stockin s WHERE s.Product_code = m.Product_code), 0) - 
         IFNULL((SELECT SUM(o.Quantity) FROM ortb o WHERE o.P_Code = m.Product_code), 0)) AS current_stock
      FROM masterlist m
    `);

    const products: { [category: string]: CategoryGroup } = {};

    rows.forEach((row) => {
      const categoryRaw = row.P_Category || 'others';
      const category = categoryRaw.toLowerCase();
      const label = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);
      const icon = getCategoryIcon(category);
      const sectionName = `All ${label}`;

      if (!products[category]) {
        products[category] = {
          label,
          icon,
          sections: {
            [sectionName]: []
          }
        };
      }

      // If the section doesn't exist (should not happen with default), initialize it
      if (!products[category].sections[sectionName]) {
        products[category].sections[sectionName] = [];
      }

      const stock = parseInt(row.current_stock) || 0;

      products[category].sections[sectionName].push({
        id: row.Product_code,
        name: row.P_name,
        price: parseFloat(row.P_S_P) || 0,
        status: stock > 0 ? 'available' : 'unavailable',
        stock: stock,
        image: row.P_image ? `uploads/${row.P_image}` : null,
        emoji: icon
      });
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Menu API error:', error);
    return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
  }
}
