'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Category, MenuItem } from '@/types/database';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches all categories ordered by display position.
 * Returns empty array (never throws) if DB is not ready.
 */
export async function getCategoriesAction(): Promise<ActionResponse<Category[]>> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('[getCategoriesAction]', error.message);
      return { success: true, data: [] };
    }

    return { success: true, data: (data as Category[]) || [] };
  } catch {
    return { success: true, data: [] };
  }
}

/**
 * Fetches available menu items, optionally filtered by category.
 * Returns empty array (never throws) if DB is not ready.
 */
export async function getMenuItemsAction(
  categoryId?: string
): Promise<ActionResponse<MenuItem[]>> {
  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.warn('[getMenuItemsAction]', error.message);
      return { success: true, data: [] };
    }

    return { success: true, data: (data as MenuItem[]) || [] };
  } catch {
    return { success: true, data: [] };
  }
}
