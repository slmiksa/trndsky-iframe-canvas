
-- This migration enables Row Level Security on the account_slideshows table
-- and adds policies to allow users to manage their own slideshows.

-- 1. Enable RLS on the table
ALTER TABLE public.account_slideshows ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for SELECT
-- Allows super_admins and account_users to view slideshows they have access to.
CREATE POLICY "Allow users to view their own slideshows"
ON public.account_slideshows
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR
  user_owns_account(auth.uid(), account_id)
);

-- 3. Create policy for INSERT
-- Allows super_admins and account_users to create slideshows for their accounts.
CREATE POLICY "Allow users to create slideshows for their account"
ON public.account_slideshows
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) OR
  user_owns_account(auth.uid(), account_id)
);

-- 4. Create policy for UPDATE
-- Allows super_admins and account_users to update their own slideshows.
CREATE POLICY "Allow users to update their own slideshows"
ON public.account_slideshows
FOR UPDATE
USING (
  is_super_admin(auth.uid()) OR
  user_owns_account(auth.uid(), account_id)
)
WITH CHECK (
  is_super_admin(auth.uid()) OR
  user_owns_account(auth.uid(), account_id)
);

-- 5. Create policy for DELETE
-- Allows super_admins and account_users to delete their own slideshows.
CREATE POLICY "Allow users to delete their own slideshows"
ON public.account_slideshows
FOR DELETE
USING (
  is_super_admin(auth.uid()) OR
  user_owns_account(auth.uid(), account_id)
);
