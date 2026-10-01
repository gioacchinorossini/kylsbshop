import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient } from '../supabase/client';
import { Order } from '@/types/database';

export interface OrdersRealtimeHandlers {
  onNewOrder?: (newOrder: Order) => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
  onOrderDeleted?: (orderId: string) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

/**
 * Subscribes to real-time order updates on the `orders` table for the Orders Tracker page.
 */
export function subscribeToOrdersRealtime(handlers: OrdersRealtimeHandlers): () => void {
  const channel: RealtimeChannel = supabaseClient
    .channel('orders-tracker-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        if (handlers.onNewOrder && payload.new) {
          handlers.onNewOrder(payload.new as Order);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        if (handlers.onOrderUpdated && payload.new) {
          handlers.onOrderUpdated(payload.new as Order);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        if (handlers.onOrderDeleted && payload.old) {
          handlers.onOrderDeleted((payload.old as { id: string }).id);
        }
      }
    );

  channel.subscribe((status) => {
    if (handlers.onStatusChange) {
      handlers.onStatusChange(status as 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR');
    }
  });

  return () => {
    supabaseClient.removeChannel(channel);
  };
}
