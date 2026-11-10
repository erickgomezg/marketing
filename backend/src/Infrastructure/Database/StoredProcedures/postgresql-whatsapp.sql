CREATE TABLE IF NOT EXISTS public.whatsapp_global_configuration (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  group_jid varchar(160),
  group_name varchar(255),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE OR REPLACE FUNCTION public.usp_whatsapp_configuration_get()
RETURNS TABLE(group_jid varchar, group_name varchar, updated_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.group_jid, c.group_name, c.updated_at
  FROM public.whatsapp_global_configuration c WHERE c.id = 1;
$$;

CREATE OR REPLACE FUNCTION public.usp_whatsapp_configuration_save(p_group_jid varchar, p_group_name varchar, p_user_id uuid)
RETURNS TABLE(group_jid varchar, group_name varchar, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_group_jid IS NOT NULL AND (p_group_jid !~ '^[0-9]+-[0-9]+@g\.us$' OR length(trim(coalesce(p_group_name, ''))) = 0) THEN
    RAISE EXCEPTION 'INVALID_WHATSAPP_GROUP';
  END IF;
  RETURN QUERY
  INSERT INTO public.whatsapp_global_configuration (id, group_jid, group_name, updated_at, updated_by)
  VALUES (1, p_group_jid, p_group_name, now(), p_user_id)
  ON CONFLICT (id) DO UPDATE SET group_jid = EXCLUDED.group_jid,
    group_name = EXCLUDED.group_name, updated_at = now(), updated_by = EXCLUDED.updated_by
  RETURNING whatsapp_global_configuration.group_jid, whatsapp_global_configuration.group_name, whatsapp_global_configuration.updated_at;
END;
$$;

REVOKE ALL ON public.whatsapp_global_configuration FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.usp_whatsapp_configuration_get() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.usp_whatsapp_configuration_save(varchar, varchar, uuid) FROM PUBLIC;
