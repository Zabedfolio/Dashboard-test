-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12, 2) NOT NULL,
  shipping_charge NUMERIC(12, 2) DEFAULT 0,
  delivery_method TEXT CHECK (delivery_method IN ('Inside Dhaka', 'Outside Dhaka', 'Pickup')),
  payment_method TEXT CHECK (payment_method IN ('COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid')),
  payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
  order_status TEXT DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_changed_at ON public.order_status_history(changed_at DESC);

-- Create order_comments table
CREATE TABLE IF NOT EXISTS public.order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_comments_order_id ON public.order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_created_at ON public.order_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
-- Allow authenticated users to view orders
CREATE POLICY "Users can view orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert orders
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update orders
CREATE POLICY "Users can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow only admins to delete orders
CREATE POLICY "Only admins can delete orders" ON public.orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for order_status_history table
CREATE POLICY "Users can view status history" ON public.order_status_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create status history" ON public.order_status_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for order_comments table
CREATE POLICY "Users can view comments" ON public.order_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create comments" ON public.order_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create counter table for order ID sequence (helps with generating HB{DD}{MM}{YY}{sequence})
CREATE TABLE IF NOT EXISTS public.order_id_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key TEXT UNIQUE NOT NULL,
  counter INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_id_counter_date_key ON public.order_id_counter(date_key);

-- Enable RLS for counter table
ALTER TABLE public.order_id_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view counter" ON public.order_id_counter
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert counter" ON public.order_id_counter
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update counter" ON public.order_id_counter
  FOR UPDATE USING (auth.role() = 'authenticated');
