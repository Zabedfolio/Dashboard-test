-- ============================================================
-- Business Command Center — Products & Inventory Schema
-- ============================================================

-- ── categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text UNIQUE NOT NULL,
  slug      text UNIQUE NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ── products ────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.product_sku_seq START 1;

CREATE TABLE IF NOT EXISTS public.products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  created_at          timestamptz DEFAULT now()
);

-- Ensure all columns exist (in case table was created partially before)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text UNIQUE DEFAULT 'PRD-' || lpad(nextval('public.product_sku_seq')::text, 4, '0');
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_price numeric(12,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount numeric(12,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add constraints and FKs explicitly
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('Active','Inactive','Out of Stock'));

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_unit_check;
ALTER TABLE public.products ADD CONSTRAINT products_unit_check 
  CHECK (unit IN ('pcs','kg','litre','box','dozen'));

-- ── stock_movements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid REFERENCES public.products(id) ON DELETE CASCADE,
  type         text CHECK (type IN ('IN','OUT','ADJUSTMENT')) NOT NULL,
  quantity     integer NOT NULL,
  reason       text CHECK (reason IN ('Purchase','Sale','Return','Damage','Manual Adjustment')),
  reference_id text,
  note         text,
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz DEFAULT now()
);

-- ── Security (RLS) ──────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Categories Policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Moderators manage categories" ON public.categories;
CREATE POLICY "Moderators manage categories" ON public.categories FOR ALL 
  USING (public.is_moderator());

-- Products Policies
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Moderators manage products" ON public.products;
CREATE POLICY "Moderators manage products" ON public.products FOR INSERT 
  WITH CHECK (public.is_moderator());

DROP POLICY IF EXISTS "Moderators update products" ON public.products;
CREATE POLICY "Moderators update products" ON public.products FOR UPDATE 
  USING (public.is_moderator());

DROP POLICY IF EXISTS "Only admins delete products" ON public.products;
CREATE POLICY "Only admins delete products" ON public.products FOR DELETE 
  USING (public.is_admin());

-- Stock Movements Policies
DROP POLICY IF EXISTS "Moderators read stock" ON public.stock_movements;
CREATE POLICY "Moderators read stock" ON public.stock_movements FOR SELECT 
  USING (public.is_moderator());

DROP POLICY IF EXISTS "Moderators insert stock" ON public.stock_movements;
CREATE POLICY "Moderators insert stock" ON public.stock_movements FOR INSERT 
  WITH CHECK (public.is_moderator());

-- ── Triggers ────────────────────────────────────────────────
-- Update updated_at on product changes
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
