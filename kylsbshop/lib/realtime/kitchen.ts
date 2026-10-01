import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseClient } from '../supabase/client';
import { Order, OrderItem } from '@/types/database';

export interface KitchenRealtimeHandlers {
  onNewOrder?: (newOrder: Order) => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
  onOrderDeleted?: (orderId: string) => void;
  onOrderItemUpdated?: (updatedItem: OrderItem) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

/**
 * Subscribes the Kitchen Display to real-time updates on `orders` and `order_items` tables.
 *
 * @param handlers Callback functions triggered on real-time events.
 * @returns Clean-up function to unsubscribe from the real-time channel.
 */
export function subscribeToKitchenRealtime(handlers: KitchenRealtimeHandlers): () => void {
  const channel: RealtimeChannel = supabaseClient
    .channel('kitchen-display-realtime')
    // Listen for all changes on orders table
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
    )
    // Listen for changes on order_items table
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_items',
      },
      (payload) => {
        if (handlers.onOrderItemUpdated && payload.new) {
          handlers.onOrderItemUpdated(payload.new as OrderItem);
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
