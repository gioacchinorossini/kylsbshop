'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Order } from '@/types/database';
import { subscribeToCashierRealtime } from '@/lib/realtime/cashier';
import {
  getActiveOrdersAction,
  updateOrderStatusAction,
  archiveOrderAction,
  archiveTableOrdersAction,
  unarchiveOrderAction,
  getArchivedOrdersAction,
} from '@/app/actions/orders';
import { playOrderChime } from '@/lib/audio/chime';

export type CashierTab = 'pending' | 'active' | 'archived';

export function useCashierOrders() {
  const [tab, setTab] = useState<CashierTab>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING');
  const isInitialLoad = useRef(true);

  // Fetch pending and active orders, plus archived orders
  const fetchAllOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        getActiveOrdersAction(true),
        getArchivedOrdersAction(),
      ]);

      if (activeRes.success && Array.isArray(activeRes.data)) {
        // Exclude archived from active orders list
        const nonArchived = activeRes.data.filter(
          (o) => o.status !== 'Archived' && o.status !== 'archived'
        );
        setOrders(nonArchived);
      } else {
        setOrders([]);
      }

      if (archivedRes.success && Array.isArray(archivedRes.data)) {
        setArchivedOrders(archivedRes.data);
      } else {
        setArchivedOrders([]);
      }
    } catch {
      setOrders([]);
      setArchivedOrders([]);
    } finally {
      if (!isBackground) setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();

    // Subscribe to real-time events on orders
    const unsubscribe = subscribeToCashierRealtime({
      onNewOrder: () => {
        // Play notification chime for newly arrived table orders
        playOrderChime();
        // Fetch full order with relation (items & table)
        fetchAllOrders(true);
      },
      onOrderUpdated: () => {
        fetchAllOrders(true);
      },
      onOrderDeleted: (orderId) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setArchivedOrders((prev) => prev.filter((o) => o.id !== orderId));
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [fetchAllOrders]);

  // "Accept & Mark Paid" -> status = 'completed'
  const acceptAndMarkPaid = async (orderId: string) => {
    // Optimistically update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
    );

    const result = await updateOrderStatusAction(orderId, 'completed');
    if (!result.success) {
      fetchAllOrders(true);
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  // "Cancel Order" -> status = 'cancelled'
  const cancelOrder = async (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    const result = await updateOrderStatusAction(orderId, 'cancelled');
    if (!result.success) {
      fetchAllOrders(true);
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  // "Archive Single Order" -> status = 'Archived' (clears it from table orders)
  const archiveOrder = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    // Optimistic removal from active and addition to archived
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (target) {
      setArchivedOrders((prev) => [{ ...target, status: 'Archived' as any }, ...prev]);
    }

    const result = await archiveOrderAction(orderId);
    if (!result.success) {
      fetchAllOrders(true);
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  // "Archive All Orders for Table" -> clears table so new customer can sit and order fresh
  const archiveTableOrders = async (tableIdentifier: string) => {
    setOrders((prev) => {
      const clean = tableIdentifier.replace(/^table\s*/i, '').trim();
      return prev.filter((o) => {
        const tableNum = o.dining_table?.table_number ? String(o.dining_table.table_number) : '';
        const notes = o.customer_notes || '';
        const name = o.customer_name || '';
        return (
          tableNum !== clean &&
          !notes.toLowerCase().includes(`table ${clean.toLowerCase()}`) &&
          !name.toLowerCase().includes(`table ${clean.toLowerCase()}`)
        );
      });
    });

    const result = await archiveTableOrdersAction(tableIdentifier);
    fetchAllOrders(true);
    return result;
  };

  // "Unarchive Order" -> restores to completed
  const unarchiveOrder = async (orderId: string) => {
    const target = archivedOrders.find((o) => o.id === orderId);
    setArchivedOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (target) {
      setOrders((prev) => [{ ...target, status: 'completed' }, ...prev]);
    }

    const result = await unarchiveOrderAction(orderId);
    if (!result.success) {
      fetchAllOrders(true);
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  // Filtered lists
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeTableOrders = orders.filter((o) =>
    ['pending', 'preparing', 'ready', 'completed'].includes(o.status)
  );

  const displayedOrders =
    tab === 'pending'
      ? pendingOrders
      : tab === 'active'
      ? activeTableOrders
      : archivedOrders;

  return {
    tab,
    setTab,
    orders: displayedOrders,
    allActiveOrders: orders,
    archivedOrders,
    pendingOrdersCount: pendingOrders.length,
    activeTableOrdersCount: activeTableOrders.length,
    archivedOrdersCount: archivedOrders.length,
    loading,
    connectionStatus,
    refreshOrders: () => fetchAllOrders(false),
    acceptAndMarkPaid,
    cancelOrder,
    archiveOrder,
    archiveTableOrders,
    unarchiveOrder,
  };
}
