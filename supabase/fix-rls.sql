
-- Add RLS bypass for super admin users
CREATE OR REPLACE POLICY "Super admins can do everything with notifications"
ON public.notifications
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') IS NOT NULL
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') IS NOT NULL
);
