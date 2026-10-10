import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient, isSupabaseConfigured } from '../supabase/client';
import { Order } from '@/types/database';

export interface CustomerOrderRealtimeHandlers {
  onOrderUpdated?: (updatedOrder: Partial<Order>) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

/**
 * Subscribes to real-time UPDATE events for a single order row,
 * filtered by order `id`. Also listens to order_items changes to keep
 * the customer receipt perfectly in sync.
 */
export function subscribeToCustomerOrder(
  orderId: string,
  handlers: CustomerOrderRealtimeHandlers
): () => void {
  if (!orderId || !isSupabaseConfigured) {
    if (handlers.onStatusChange && !isSupabaseConfigured) {
      handlers.onStatusChange('CLOSED');
    }
    return () => {};
  }

  const channel: RealtimeChannel = supabaseClient
    .channel(`customer-order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        if (handlers.onOrderUpdated && payload.new) {
          handlers.onOrderUpdated(payload.new as Partial<Order>);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
        filter: `order_id=eq.${orderId}`,
      },
      () => {
        if (handlers.onOrderUpdated) {
          handlers.onOrderUpdated({});
        }
      }
    );

  channel.subscribe((status) => {
    handlers.onStatusChange?.(
      status as 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'
    );
  });

  return () => {
    supabaseClient.removeChannel(channel);
  };
}

export interface CustomerTableOrdersRealtimeHandlers {
  onOrderUpdated?: (updatedOrder: Partial<Order>) => void;
  onNewOrder?: () => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

/**
 * Subscribes to real-time events for orders matching a table ID.
 */
export function subscribeToTableOrders(
  tableId: string,
  handlers: CustomerTableOrdersRealtimeHandlers
): () => void {
  if (!tableId || !isSupabaseConfigured) {
    if (handlers.onStatusChange && !isSupabaseConfigured) {
      handlers.onStatusChange('CLOSED');
    }
    return () => {};
  }

  const channel: RealtimeChannel = supabaseClient
    .channel(`customer-table-${tableId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `table_id=eq.${tableId}`,
      },
      (payload) => {
        if (handlers.onOrderUpdated && payload.new) {
          handlers.onOrderUpdated(payload.new as Partial<Order>);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `table_id=eq.${tableId}`,
      },
      () => {
        handlers.onNewOrder?.();
      }
    );

  channel.subscribe((status) => {
    handlers.onStatusChange?.(
      status as 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'
    );
  });

  return () => {
    supabaseClient.removeChannel(channel);
  };
}


