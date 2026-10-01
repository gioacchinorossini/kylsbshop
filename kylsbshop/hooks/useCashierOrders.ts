'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Order } from '@/types/database';
import { subscribeToCashierRealtime } from '@/lib/realtime/cashier';
import {
  getActiveOrdersAction,
  updateOrderStatusAction,
} from '@/app/actions/orders';
import { playOrderChime } from '@/lib/audio/chime';

export function useCashierOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING');
  const isInitialLoad = useRef(true);

  // Fetch pending table orders
  const fetchPendingOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const result = await getActiveOrdersAction();
      if (result.success && Array.isArray(result.data)) {
        // Cashier terminal focuses on pending incoming orders
        const pending = result.data.filter((o) => o.status === 'pending');
        setOrders(pending);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      if (!isBackground) setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPendingOrders();

    // Subscribe to real-time events on orders
    const unsubscribe = subscribeToCashierRealtime({
      onNewOrder: (newOrder) => {
        // Play notification chime for newly arrived table orders
        playOrderChime();
        // Fetch full order with relation (items & table)
        fetchPendingOrders(true);
      },
      onOrderUpdated: (updatedOrder) => {
        setOrders((prev) => {
          // If marked completed or cancelled, remove from pending incoming queue
          if (['completed', 'cancelled'].includes(updatedOrder.status)) {
            return prev.filter((o) => o.id !== updatedOrder.id);
          }
          return prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
        });
      },
      onOrderDeleted: (orderId) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchPendingOrders]);

  // "Accept & Mark Paid" -> status = 'completed'
  const acceptAndMarkPaid = async (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    const result = await updateOrderStatusAction(orderId, 'completed');
    if (!result.success) {
      // Revert/refresh on failure
      fetchPendingOrders(true);
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  // "Cancel Order" -> status = 'cancelled'
  const cancelOrder = async (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    const result = await updateOrderStatusAction(orderId, 'cancelled');
    if (!result.success) {
      fetchPendingOrders(true);
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  return {
    orders,
    loading,
    connectionStatus,
    refreshOrders: () => fetchPendingOrders(false),
    acceptAndMarkPaid,
    cancelOrder,
  };
}
