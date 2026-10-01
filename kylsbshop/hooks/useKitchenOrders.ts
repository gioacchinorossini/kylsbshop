'use client';

import { useEffect, useState, useCallback } from 'react';
import { Order, OrderStatus, OrderItemStatus } from '@/types/database';
import { subscribeToKitchenRealtime } from '@/lib/realtime/kitchen';
import { getActiveOrdersAction, updateOrderStatusAction, updateOrderItemStatusAction } from '@/app/actions/orders';

export function useKitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('DISCONNECTED');

  // Fetch initial active kitchen orders from Server Action
  const fetchActiveOrders = useCallback(async () => {
    setLoading(true);
    const result = await getActiveOrdersAction();
    if (result.success && Array.isArray(result.data)) {
      setOrders(result.data);
      setError(null);
    } else {
      setOrders([]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActiveOrders();

    // Subscribe to real-time events
    const unsubscribe = subscribeToKitchenRealtime({
      onNewOrder: (newOrder) => {
        // Refetch full order with relational items when a new order arrives
        fetchActiveOrders();
      },
      onOrderUpdated: (updatedOrder) => {
        setOrders((prev) => {
          // If completed or cancelled, remove from active display list
          if (['completed', 'cancelled'].includes(updatedOrder.status)) {
            return prev.filter((o) => o.id !== updatedOrder.id);
          }
          return prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
        });
      },
      onOrderDeleted: (orderId) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      },
      onOrderItemUpdated: (updatedItem) => {
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== updatedItem.order_id) return order;
            const updatedItems = order.order_items?.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            );
            return { ...order, order_items: updatedItems };
          })
        );
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchActiveOrders]);

  // Handler to update order status via Server Action
  const changeOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status } : o))
        .filter((o) => !['completed', 'cancelled'].includes(o.status))
    );

    const result = await updateOrderStatusAction(orderId, status);
    if (!result.success) {
      fetchActiveOrders();
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  // Handler to update individual order item status
  const changeOrderItemStatus = async (orderItemId: string, status: OrderItemStatus) => {
    const result = await updateOrderItemStatusAction(orderItemId, status);
    if (!result.success) {
      fetchActiveOrders();
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  return {
    orders,
    loading,
    error,
    connectionStatus,
    refreshOrders: fetchActiveOrders,
    changeOrderStatus,
    changeOrderItemStatus,
  };
}
