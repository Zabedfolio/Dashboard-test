-- ============================================================
-- Business Command Center — Products & Inventory Schema
-- ============================================================

-- ── profiles & RBAC ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RBAC Helpers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;
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

-- ── Security (RLS) ──────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Categories Policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Moderators manage categories" ON public.categories;
CREATE POLICY "Moderators manage categories" ON public.categories FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Products Policies
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Moderators manage products" ON public.products;
CREATE POLICY "Moderators manage products" ON public.products FOR INSERT 
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Moderators update products" ON public.products;
CREATE POLICY "Moderators update products" ON public.products FOR UPDATE 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins delete products" ON public.products;
CREATE POLICY "Only admins delete products" ON public.products FOR DELETE 
  USING (public.is_admin());

-- ── Triggers ────────────────────────────────────────────────
-- Update updated_at on product changes
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
