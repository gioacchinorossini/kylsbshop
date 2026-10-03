-- ==============================================================================
-- DUAL-BRAND KIOSK SYSTEM — FULL RESET & SETUP
-- ==============================================================================
-- Paste and run this ENTIRE script in Supabase SQL Editor (one shot).
-- It is safe to run repeatedly — it drops and recreates everything cleanly.
-- ==============================================================================

-- ═══════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — drop old tables & types if they exist
-- ═══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.dining_tables CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

DROP TYPE IF EXISTS order_status_enum CASCADE;
DROP TYPE IF EXISTS item_status_enum CASCADE;
DROP TYPE IF EXISTS order_type_enum CASCADE;
DROP TYPE IF EXISTS table_status_enum CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 2. ENUM TYPES
-- ═══════════════════════════════════════════════════════════════
CREATE TYPE order_status_enum AS ENUM (
  'pending', 'preparing', 'ready', 'completed', 'cancelled', 'Archived'
);
CREATE TYPE item_status_enum AS ENUM (
  'pending', 'preparing', 'ready', 'served', 'cancelled'
);
CREATE TYPE order_type_enum AS ENUM (
  'dine_in', 'takeaway', 'delivery'
);
CREATE TYPE table_status_enum AS ENUM (
  'available', 'occupied', 'reserved', 'cleaning'
);

-- ═══════════════════════════════════════════════════════════════
-- 3. TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  description  TEXT,
  display_order INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url       TEXT,
  is_available    BOOLEAN DEFAULT true NOT NULL,
  is_vegetarian   BOOLEAN DEFAULT false NOT NULL,
  spiciness_level INT DEFAULT 0 CHECK (spiciness_level BETWEEN 0 AND 3),
  brand_schedule  TEXT DEFAULT 'all' NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.dining_tables (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number     INT UNIQUE NOT NULL,
  qr_code_token    TEXT UNIQUE DEFAULT gen_random_uuid()::text NOT NULL,
  seating_capacity INT DEFAULT 4 NOT NULL,
  status           table_status_enum DEFAULT 'available' NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   TEXT UNIQUE NOT NULL,
  table_id       UUID REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  order_type     order_type_enum DEFAULT 'dine_in' NOT NULL,
  status         order_status_enum DEFAULT 'pending' NOT NULL,
  total_amount   NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (total_amount >= 0),
  customer_name  TEXT,
  customer_notes TEXT,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id         UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  menu_item_name       TEXT NOT NULL,
  quantity             INT NOT NULL CHECK (quantity > 0),
  unit_price           NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal             NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  special_instructions TEXT,
  item_status          item_status_enum DEFAULT 'pending' NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- 4. INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_menu_items_category  ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_orders_status        ON public.orders(status);
CREATE INDEX idx_orders_created_at    ON public.orders(created_at DESC);
CREATE INDEX idx_orders_table         ON public.orders(table_id);
CREATE INDEX idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX idx_order_items_status   ON public.order_items(item_status);

-- ═══════════════════════════════════════════════════════════════
-- 5. TRIGGERS — auto-update timestamps & recalculate totals
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  target_order_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_order_id := OLD.order_id;
  ELSE
    target_order_id := NEW.order_id;
  END IF;

  UPDATE public.orders
  SET total_amount = COALESCE(
    (SELECT SUM(subtotal)
     FROM   public.order_items
     WHERE  order_id = target_order_id
       AND  item_status != 'cancelled'),
    0.00
  )
  WHERE id = target_order_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_order_total
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_order_total();

-- ═══════════════════════════════════════════════════════════════
-- 6. REALTIME — publish tables for WebSocket streaming
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.orders       REPLICA IDENTITY FULL;
ALTER TABLE public.order_items  REPLICA IDENTITY FULL;
ALTER TABLE public.dining_tables REPLICA IDENTITY FULL;

-- Remove first (safe if not present), then add
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;       EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.order_items;  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.dining_tables; EXCEPTION WHEN OTHERS THEN NULL; END;

  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dining_tables;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY — open access for kiosk app
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items   ENABLE ROW LEVEL SECURITY;

-- categories: public read
CREATE POLICY "categories_select" ON public.categories  FOR SELECT USING (true);

-- menu_items: public read
CREATE POLICY "menu_items_select" ON public.menu_items   FOR SELECT USING (true);

-- dining_tables: public read
CREATE POLICY "dining_tables_select" ON public.dining_tables FOR SELECT USING (true);

-- orders: public read + insert + update
CREATE POLICY "orders_select" ON public.orders FOR SELECT                USING (true);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK    (true);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE                USING (true);

-- order_items: public read + insert + update
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT             USING (true);
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE             USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 8. SEED DATA — Dual-Brand (Kyle's Eatery + Batchoy Shop)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Kyle''s Eatery',  'kyles-eatery',  'Monday – Saturday Specialties', 1),
  ('Batchoy Shop',    'batchoy-shop',  'Sunday Specialties',            2);

INSERT INTO public.dining_tables (table_number, seating_capacity) VALUES
  (1, 2), (2, 4), (3, 4), (4, 6), (5, 2), (6, 8);

DO $$
DECLARE
  v_kyles   UUID;
  v_batchoy UUID;
BEGIN
  SELECT id INTO v_kyles   FROM public.categories WHERE slug = 'kyles-eatery';
  SELECT id INTO v_batchoy FROM public.categories WHERE slug = 'batchoy-shop';

  -- Kyle's Eatery items (Mon - Sat)
  INSERT INTO public.menu_items
    (category_id, name, description, price, is_available, is_vegetarian, spiciness_level, brand_schedule) VALUES
    (v_kyles, 'Chori Sandwich',     'Grilled savory chorizo patty in soft toasted bun with special sauce',             199, true, false, 0, 'kyles-eatery'),
    (v_kyles, 'Backribs',           'Tender slow-cooked pork backribs in savory barbecue glaze served with rice',      160, true, false, 0, 'kyles-eatery'),
    (v_kyles, 'Hungarian',          'Juicy grilled Hungarian sausage served with garlic rice and egg',                 120, true, false, 1, 'kyles-eatery'),
    (v_kyles, 'Sisig',              'Sizzling crispy seasoned pork sisig topped with chili and calamansi',             160, true, false, 1, 'kyles-eatery'),
    (v_kyles, 'Palabok',           'Traditional rice noodles with rich savory sauce, chicharon, and egg toppings',     50, true, false, 0, 'kyles-eatery'),
    (v_kyles, 'Tocino',             'Sweet cured caramelized pork tocino served with garlic rice',                      85, true, false, 0, 'kyles-eatery'),
    (v_kyles, 'Chicken Ala King',   'Creamy chicken ala king with bell peppers and mushrooms over rice',                99, true, false, 0, 'kyles-eatery'),
    (v_kyles, 'Fried Inasal',       'Crispy fried chicken inasal marinated in calamansi and lemongrass',                85, true, false, 0, 'kyles-eatery');

  -- Batchoy Shop items (Sunday)
  INSERT INTO public.menu_items
    (category_id, name, description, price, is_available, is_vegetarian, spiciness_level, brand_schedule) VALUES
    (v_batchoy, 'Batchoy Special',   'Authentic Iloilo noodle soup with pork cracklings, liver, egg, bone marrow broth', 150, true, false, 0, 'batchoy-shop'),
    (v_batchoy, 'Ordinary Batchoy',  'Classic comforting Iloilo miki noodle soup with savory broth and chicharon',       100, true, false, 0, 'batchoy-shop'),
    (v_batchoy, 'Chicken Tempura',   'Crispy golden Japanese-style battered chicken strips with dip',                    120, true, false, 0, 'batchoy-shop'),
    (v_batchoy, 'Egg Fried Rice',    'Fragrant wok-fried rice with fluffy eggs and green onions',                          45, true, false, 0, 'batchoy-shop'),
    (v_batchoy, 'Caesar Salad',      'Fresh crisp romaine lettuce, parmesan shavings, croutons, classic dressing',       199, true, true,  0, 'batchoy-shop'),
    (v_batchoy, 'Chorizo Sandwich',  'Grilled savory garlic chorizo patty in soft toasted bun',                            95, true, false, 0, 'batchoy-shop');
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ DONE — Your database is fully configured.
-- ═══════════════════════════════════════════════════════════════
