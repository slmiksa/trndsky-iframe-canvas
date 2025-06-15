
CREATE OR REPLACE FUNCTION public.get_active_slideshows_for_account(p_account_id uuid)
RETURNS SETOF public.account_slideshows
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.account_slideshows
  WHERE account_id = p_account_id AND is_active = true
  ORDER BY created_at ASC;
END;
$$;
