export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'Archived' | 'archived';
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  spiciness_level: number;
  created_at: string;
  updated_at: string;
}

export interface DiningTable {
  id: string;
  table_number: number;
  qr_code_token: string;
  seating_capacity: number;
  status: TableStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions: string | null;
  item_status: OrderItemStatus;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  total_amount: number;
  customer_name: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  // Included nested relations
  dining_table?: DiningTable | null;
  order_items?: OrderItem[];
}

export interface CreateOrderItemInput {
  menu_item_id: string;
  quantity: number;
  special_instructions?: string;
}

export interface CreateOrderInput {
  table_id?: string;
  order_type?: OrderType;
  customer_name?: string;
  customer_notes?: string;
  items: CreateOrderItemInput[];
}
