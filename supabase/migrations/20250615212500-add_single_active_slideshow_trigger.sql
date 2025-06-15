
-- This function is triggered when a slideshow is activated.
-- It deactivates all other slideshows for the same account.
CREATE OR REPLACE FUNCTION public.deactivate_other_slideshows()
RETURNS TRIGGER AS $$
BEGIN
  -- The trigger's WHEN clause ensures this only runs for NEW.is_active = true.
  -- This query sets is_active to false for all other slideshows of the same account.
  UPDATE public.account_slideshows
  SET is_active = false
  WHERE account_id = NEW.account_id
    AND id <> NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger fires before a slideshow is inserted or updated.
-- It only runs the function if the slideshow is being set to active.
CREATE TRIGGER trigger_enforce_single_active_slideshow
BEFORE INSERT OR UPDATE OF is_active ON public.account_slideshows
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.deactivate_other_slideshows();
