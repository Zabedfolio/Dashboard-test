-- ============================================================
-- Business Command Center — Notifications Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'general' CHECK (type IN ('order_created', 'order_updated', 'order_status_changed', 'product_created', 'product_updated', 'general')),
  title       text NOT NULL,
  message     text NOT NULL,
  payload     jsonb DEFAULT '{}'::jsonb,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;
CREATE POLICY "Service role can manage notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Moderators can create notifications" ON public.notifications;
CREATE POLICY "Moderators can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_moderator());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications (is_read);

-- Function to notify admins and moderators of moderator changes
CREATE OR REPLACE FUNCTION public.notify_admins_and_moderators(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_current_user_id uuid;
  v_admin_moderator RECORD;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Only create notifications if triggered by a moderator
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = v_current_user_id AND role IN ('admin', 'moderator')
  ) THEN
    RETURN;
  END IF;

  -- Notify all admins and moderators except the one making the change
  FOR v_admin_moderator IN
    SELECT id FROM public.profiles 
    WHERE role IN ('admin', 'moderator') AND id != v_current_user_id
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      payload,
      created_by
    ) VALUES (
      v_admin_moderator.id,
      CASE 
        WHEN p_action = 'create' AND p_entity_type = 'order' THEN 'order_created'
        WHEN p_action = 'update' AND p_entity_type = 'order' THEN 'order_updated'
        WHEN p_action = 'status_change' AND p_entity_type = 'order' THEN 'order_status_changed'
        WHEN p_action = 'create' AND p_entity_type = 'product' THEN 'product_created'
        WHEN p_action = 'update' AND p_entity_type = 'product' THEN 'product_updated'
        ELSE 'general'
      END,
      CASE 
        WHEN p_entity_type = 'order' THEN 'Order ' || p_action || 'd'
        WHEN p_entity_type = 'product' THEN 'Product ' || p_action || 'd'
        ELSE 'Notification'
      END,
      CASE
        WHEN p_action = 'create' AND p_entity_type = 'order' THEN 'A new order has been created'
        WHEN p_action = 'update' AND p_entity_type = 'order' THEN 'An order has been updated'
        WHEN p_action = 'status_change' AND p_entity_type = 'order' THEN 'An order status has been changed'
        WHEN p_action = 'create' AND p_entity_type = 'product' THEN 'A new product has been created'
        WHEN p_action = 'update' AND p_entity_type = 'product' THEN 'A product has been updated'
        ELSE 'A change has been made in the system'
      END,
      jsonb_build_object(
        'action', p_action,
        'entity_type', p_entity_type,
        'entity_id', p_entity_id,
        'details', p_details,
        'created_by_id', v_current_user_id
      ),
      v_current_user_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
