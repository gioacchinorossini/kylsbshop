import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient } from '../supabase/client';
import { Order } from '@/types/database';

export interface CustomerOrderRealtimeHandlers {
  onOrderUpdated?: (updatedOrder: Partial<Order>) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

/**
 * Subscribes to real-time UPDATE events for a single order row,
 * filtered by order `id`. Safe for customer-facing use — only listens,
 * never reads other orders.
 */
export function subscribeToCustomerOrder(
  orderId: string,
  handlers: CustomerOrderRealtimeHandlers
): () => void {
  if (!orderId) return () => {};

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
