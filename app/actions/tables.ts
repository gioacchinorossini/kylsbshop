'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DiningTable, TableStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';

interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches all dining tables.
 * Returns empty array (never throws) if DB is not ready.
 */
export async function getTablesAction(): Promise<ActionResponse<DiningTable[]>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('dining_tables')
      .select('*')
      .order('table_number', { ascending: true });

    if (error) {
      console.warn('[getTablesAction]', error.message);
      return { success: true, data: [] };
    }

    return { success: true, data: (data as DiningTable[]) || [] };
  } catch {
    return { success: true, data: [] };
  }
}

/**
 * Updates table status (e.g. available, occupied, cleaning).
 */
export async function updateTableStatusAction(
  tableId: string,
  status: TableStatus
): Promise<ActionResponse<DiningTable>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('dining_tables')
      .update({ status })
      .eq('id', tableId)
      .select('*')
      .single();

    if (error || !data) {
      console.warn('[updateTableStatusAction]', error?.message);
      return { success: false, error: 'Failed to update table status.' };
    }

    revalidatePath('/kitchen');
    return { success: true, data: data as DiningTable };
  } catch {
    return { success: false, error: 'Unexpected server error.' };
  }
}
