-- ============================================================
-- Business Command Center — Orders Module Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable pg_trgm for fuzzy search (required for gin_trgm_ops indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Clean start (optional: comment these out if you want to keep existing data)
DROP TABLE IF EXISTS public.order_comments CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.order_id_counter CASCADE;
-- NOTE: We don't drop 'profiles' by default to preserve your admin role
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── profiles (extends auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     text,
  name      text,
  avatar    text,
  role      text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Function to check if current user is an admin (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if current user is a moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
CREATE POLICY "Service role full access to profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ── customers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL DEFAULT '',
  phone        text UNIQUE NOT NULL,
  email        text DEFAULT '',
  division     text DEFAULT '',
  district     text DEFAULT '',
  thana        text DEFAULT '',
  village      text DEFAULT '',
  full_address text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;
CREATE POLICY "Authenticated users can read customers"
  ON public.customers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS customers_phone_idx ON public.customers (phone);
CREATE INDEX IF NOT EXISTS customers_name_idx  ON public.customers USING gin (name gin_trgm_ops);

-- ── products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  sku        text UNIQUE,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  stock      integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_moderator());

CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_sku_idx  ON public.products (sku);

-- ── orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        text UNIQUE NOT NULL,
  customer_id     uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  items           jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount    numeric(12,2) NOT NULL DEFAULT 0,
  shipping_charge numeric(12,2) NOT NULL DEFAULT 0,
  delivery_method text NOT NULL
    CHECK (delivery_method IN ('Inside Dhaka', 'Outside Dhaka', 'Pickup')),
  payment_method  text NOT NULL
    CHECK (payment_method IN ('COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid')),
  payment_status  text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
  order_status    text NOT NULL DEFAULT 'Pending'
    CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  is_flagged      boolean NOT NULL DEFAULT false,
  flag_reason     text DEFAULT '',
  notes           text DEFAULT '',
  created_by      uuid NOT NULL CONSTRAINT orders_created_by_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators and admins can read orders" ON public.orders;
CREATE POLICY "Moderators and admins can read orders"
  ON public.orders FOR SELECT
  USING (public.is_moderator());

DROP POLICY IF EXISTS "Moderators and admins can insert orders" ON public.orders;
CREATE POLICY "Moderators and admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_moderator());

DROP POLICY IF EXISTS "Moderators and admins can update orders" ON public.orders;
CREATE POLICY "Moderators and admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_moderator());

DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
CREATE POLICY "Only admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS orders_customer_idx    ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx      ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx  ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_order_id_idx    ON public.orders (order_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── order_status_history ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     text NOT NULL,
  changed_by uuid NOT NULL CONSTRAINT order_status_history_changed_by_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  changed_at timestamptz DEFAULT now(),
  note       text DEFAULT ''
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can read status history" ON public.order_status_history;
CREATE POLICY "Moderators can read status history"
  ON public.order_status_history FOR SELECT
  USING (public.is_moderator());

DROP POLICY IF EXISTS "Moderators can insert status history" ON public.order_status_history;
CREATE POLICY "Moderators can insert status history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (public.is_moderator());

CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON public.order_status_history (order_id);

-- ── order_comments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  comment    text NOT NULL,
  created_by uuid NOT NULL CONSTRAINT order_comments_created_by_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moderators can read comments" ON public.order_comments;
CREATE POLICY "Moderators can read comments"
  ON public.order_comments FOR SELECT
  USING (public.is_moderator());

DROP POLICY IF EXISTS "Moderators can insert comments" ON public.order_comments;
CREATE POLICY "Moderators can insert comments"
  ON public.order_comments FOR INSERT
  WITH CHECK (public.is_moderator());

CREATE INDEX IF NOT EXISTS order_comments_order_idx ON public.order_comments (order_id);

-- ── order_id_counter ─────────────────────────────────────────
-- Tracks daily order sequence per date key (DDMMYY)
CREATE TABLE IF NOT EXISTS public.order_id_counter (
  date_key  text PRIMARY KEY,  -- e.g. "070526"
  counter   integer NOT NULL DEFAULT 0
);

ALTER TABLE public.order_id_counter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for order_id_counter" ON public.order_id_counter;
CREATE POLICY "Service role only for order_id_counter"
  ON public.order_id_counter FOR ALL
  USING (auth.role() = 'service_role');

-- (Extension enabled at the top of this script)

-- Migration complete
