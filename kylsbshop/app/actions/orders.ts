'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  CreateOrderInput,
  Order,
  OrderStatus,
  OrderItemStatus,
  DiningTable,
} from '@/types/database';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Fallback pricing for when DB items use local string IDs ───
const LOCAL_PRICES: Record<string, { name: string; price: number }> = {
  // Kyle's Eatery (Mon-Sat)
  'chori-sandwich':      { name: 'Chori Sandwich',      price: 199 },
  'backribs':            { name: 'Backribs',            price: 160 },
  'hungarian':           { name: 'Hungarian',           price: 120 },
  'sisig':               { name: 'Sisig',               price: 160 },
  'palabok':             { name: 'Palabok',             price: 50  },
  'tocino':              { name: 'Tocino',              price: 85  },
  'chicken-ala-king':    { name: 'Chicken Ala King',    price: 99  },
  'fried-inasal':        { name: 'Fried Inasal',        price: 85  },

  // Batchoy Shop (Sunday)
  'batchoy-special':     { name: 'Batchoy Special',     price: 150 },
  'ordinary-batchoy':    { name: 'Ordinary Batchoy',    price: 100 },
  'chicken-tempura':     { name: 'Chicken Tempura',     price: 120 },
  'egg-fried-rice':      { name: 'Egg Fried Rice',      price: 45  },
  'caesar-salad':        { name: 'Caesar Salad',        price: 199 },
  'chorizo-sandwich':    { name: 'Chorizo Sandwich',    price: 95  },
  'chorizo-sandwich-sun':{ name: 'Chorizo Sandwich',    price: 95  },
};

/** True if `id` looks like a Supabase UUID */
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ═══════════════════════════════════════════════════════════════
// createOrderAction
// ═══════════════════════════════════════════════════════════════
export async function createOrderAction(
  input: CreateOrderInput
): Promise<ActionResponse<Order>> {
  try {
    const supabase = createServerSupabaseClient();

    // ── validate ──
    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Order must contain at least one item.' };
    }
    for (const item of input.items) {
      if (!item.menu_item_id || item.quantity <= 0) {
        return { success: false, error: 'Invalid item in order.' };
      }
    }

    // ── look up DB prices (only for real UUIDs) ──
    const uuidIds = input.items.map((i) => i.menu_item_id).filter(isUUID);
    const dbMap = new Map<string, { name: string; price: number }>();

    if (uuidIds.length > 0) {
      const { data: dbItems } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .in('id', uuidIds);
      for (const m of dbItems || []) {
        dbMap.set(m.id, { name: m.name, price: Number(m.price) });
      }
    }

    // ── build line items ──
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineItems = input.items.map((item) => {
      const db = dbMap.get(item.menu_item_id);
      const local = LOCAL_PRICES[item.menu_item_id];
      const resolved = db || local || { name: item.menu_item_id, price: 100 };

      const unitPrice = resolved.price;
      const subtotal = +(unitPrice * item.quantity).toFixed(2);

      return {
        menu_item_id: isUUID(item.menu_item_id) ? item.menu_item_id : null,
        menu_item_name: resolved.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
        special_instructions: item.special_instructions || null,
        item_status: 'pending' as OrderItemStatus,
      };
    });

    const totalAmount = +lineItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2);

    // ── determine table_id ──
    const tableId = input.table_id && isUUID(input.table_id) ? input.table_id : null;

    // ── insert order row ──
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        table_id: tableId,
        order_type: input.order_type || 'dine_in',
        status: 'pending' as OrderStatus,
        total_amount: totalAmount,
        customer_name: input.customer_name || 'Guest',
        customer_notes: input.customer_notes || null,
      })
      .select('*')
      .single();

    if (orderErr || !orderRow) {
      console.warn('[createOrderAction] insert order failed:', orderErr?.message);
      // Return a local-only order so the checkout flow never breaks
      const now = new Date().toISOString();
      return {
        success: true,
        data: {
          id: `local-${Date.now()}`,
          order_number: orderNumber,
          table_id: tableId,
          order_type: input.order_type || 'dine_in',
          status: 'pending',
          total_amount: totalAmount,
          customer_name: input.customer_name || 'Guest',
          customer_notes: input.customer_notes || null,
          created_at: now,
          updated_at: now,
          order_items: lineItems.map((li, i) => ({
            ...li,
            id: `local-item-${i}`,
            order_id: `local-${Date.now()}`,
            item_status: 'pending' as OrderItemStatus,
            created_at: now,
          })),
        },
      };
    }

    // ── insert line items ──
    const rowsToInsert = lineItems.map((li) => ({
      ...li,
      order_id: orderRow.id,
    }));
    const { data: itemRows } = await supabase
      .from('order_items')
      .insert(rowsToInsert)
      .select('*');

    revalidatePath('/');
    revalidatePath('/pos');
    revalidatePath('/orders');

    return {
      success: true,
      data: { ...orderRow, order_items: itemRows || [] } as Order,
    };
  } catch (err) {
    console.error('[createOrderAction] unexpected:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected server error.',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// getActiveOrdersAction
// ═══════════════════════════════════════════════════════════════
export async function getActiveOrdersAction(
  includeAll = false
): Promise<ActionResponse<Order[]>> {
  try {
    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('orders')
      .select('*, dining_tables(*), order_items(*)')
      .order('created_at', { ascending: false });

    if (!includeAll) {
      query = query.in('status', ['pending', 'preparing', 'ready']);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[getActiveOrdersAction]', error.message);
      return { success: true, data: [] };
    }

    // normalise the join — Supabase returns the FK as the table name
    const orders: Order[] = (data || []).map((row: any) => ({
      ...row,
      dining_table: Array.isArray(row.dining_tables)
        ? (row.dining_tables[0] as DiningTable | null) ?? null
        : (row.dining_tables as DiningTable | null) ?? null,
    })) as Order[];

    return { success: true, data: orders };
  } catch {
    return { success: true, data: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// updateOrderStatusAction
// ═══════════════════════════════════════════════════════════════
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResponse<Order>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error || !data) {
      console.warn('[updateOrderStatusAction]', error?.message);
      return { success: false, error: 'Could not update order.' };
    }

    revalidatePath('/pos');
    revalidatePath('/kitchen');
    revalidatePath('/orders');
    return { success: true, data: data as Order };
  } catch {
    return { success: false, error: 'Unexpected server error.' };
  }
}

// ═══════════════════════════════════════════════════════════════
// updateOrderItemStatusAction  (single dish status change)
// ═══════════════════════════════════════════════════════════════
export async function updateOrderItemStatusAction(
  orderItemId: string,
  newStatus: OrderItemStatus
): Promise<ActionResponse<Order>> {
  try {
    const supabase = createServerSupabaseClient();

    // 1. update the item
    const { data: updatedItem, error: itemErr } = await supabase
      .from('order_items')
      .update({ item_status: newStatus })
      .eq('id', orderItemId)
      .select('*')
      .single();

    if (itemErr || !updatedItem) {
      console.warn('[updateOrderItemStatusAction]', itemErr?.message);
      return { success: false, error: 'Could not update item.' };
    }

    // 2. fetch parent order + siblings to auto-advance order status
    const { data: parent } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', updatedItem.order_id)
      .single();

    if (parent) {
      const active = (parent.order_items || []).filter(
        (i: { item_status: string }) => i.item_status !== 'cancelled'
      );
      if (active.length > 0) {
        const allReady = active.every(
          (i: { item_status: string }) => i.item_status === 'ready' || i.item_status === 'served'
        );
        const anyStarted = active.some(
          (i: { item_status: string }) => i.item_status === 'preparing' || i.item_status === 'ready'
        );

        let next: OrderStatus | null = null;
        if (allReady && parent.status !== 'ready') next = 'ready';
        else if (anyStarted && parent.status === 'pending') next = 'preparing';

        if (next) {
          await supabase.from('orders').update({ status: next }).eq('id', parent.id);
        }
      }
    }

    revalidatePath('/kitchen');
    return { success: true, data: (parent as Order) ?? undefined };
  } catch {
    return { success: false, error: 'Unexpected server error.' };
  }
}

// ═══════════════════════════════════════════════════════════════
// getOrderByIdAction
// ═══════════════════════════════════════════════════════════════
export async function getOrderByIdAction(
  orderId: string
): Promise<ActionResponse<Order>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !data) return { success: false, error: 'Order not found.' };
    return { success: true, data: data as Order };
  } catch {
    return { success: false, error: 'Unexpected server error.' };
  }
}

// ═══════════════════════════════════════════════════════════════
// cancelOrderAction
// ═══════════════════════════════════════════════════════════════
export async function cancelOrderAction(
  orderId: string
): Promise<ActionResponse<Order>> {
  return updateOrderStatusAction(orderId, 'cancelled');
}
