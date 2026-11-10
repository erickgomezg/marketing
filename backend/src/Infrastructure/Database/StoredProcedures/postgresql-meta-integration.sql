-- Meta OAuth connection persistence. Idempotent and additive; existing tables/data are preserved.
CREATE TABLE IF NOT EXISTS public.meta_connection (
  meta_connection_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business(business_id),
  connected_by_user_id uuid NOT NULL REFERENCES public.app_user(user_id),
  provider varchar(30) NOT NULL DEFAULT 'Meta' CHECK (provider = 'Meta'),
  encrypted_access_token text NOT NULL,
  token_type varchar(30) NOT NULL DEFAULT 'bearer',
  granted_scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  token_expires_at timestamptz NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'Connected' CHECK (status IN ('Connected','Expired','Revoked','Error')),
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, provider)
);

CREATE OR REPLACE FUNCTION public.usp_meta_connection_save(
  p_business_id uuid,
  p_user_id uuid,
  p_encrypted_access_token text,
  p_token_type varchar(30),
  p_scopes text[],
  p_expires_at timestamptz
) RETURNS SETOF jsonb LANGUAGE plpgsql AS $$
DECLARE v_connection_id uuid;
BEGIN
  IF p_encrypted_access_token IS NULL OR length(p_encrypted_access_token) < 40
     OR p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid Meta connection payload';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.business b
    JOIN public.app_user u ON u.user_id=p_user_id AND u.is_active
    WHERE b.business_id=p_business_id AND b.status='Active'
      AND (u.role='Administrador' OR EXISTS (
        SELECT 1 FROM public.user_business_platform_permission p
        JOIN public.social_platform sp ON sp.social_platform_id=p.social_platform_id
        WHERE p.user_id=p_user_id AND p.business_id=p_business_id AND p.is_active
          AND sp.code IN ('facebook','instagram')
      ))
  ) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='User cannot connect Meta to this business';
  END IF;

  INSERT INTO public.meta_connection(
    business_id, connected_by_user_id, encrypted_access_token, token_type,
    granted_scopes, token_expires_at, status, connected_at, updated_at
  ) VALUES (
    p_business_id, p_user_id, p_encrypted_access_token, coalesce(nullif(p_token_type,''),'bearer'),
    coalesce(p_scopes, ARRAY[]::text[]), p_expires_at, 'Connected', now(), now()
  )
  ON CONFLICT (business_id, provider) DO UPDATE SET
    connected_by_user_id=EXCLUDED.connected_by_user_id,
    encrypted_access_token=EXCLUDED.encrypted_access_token,
    token_type=EXCLUDED.token_type,
    granted_scopes=EXCLUDED.granted_scopes,
    token_expires_at=EXCLUDED.token_expires_at,
    status='Connected',
    updated_at=now()
  RETURNING meta_connection_id INTO v_connection_id;

  RETURN NEXT jsonb_build_object(
    'MetaConnectionId', v_connection_id,
    'BusinessId', p_business_id,
    'Status', 'Connected',
    'TokenExpiresAt', p_expires_at
  );
END $$;

CREATE OR REPLACE FUNCTION public.usp_meta_connection_get(
  p_business_id uuid,
  p_user_id uuid
) RETURNS SETOF jsonb LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.business b
    JOIN public.app_user u ON u.user_id=p_user_id AND u.is_active
    WHERE b.business_id=p_business_id AND b.status='Active'
      AND (u.role='Administrador' OR EXISTS (
        SELECT 1 FROM public.user_business_platform_permission p
        JOIN public.social_platform sp ON sp.social_platform_id=p.social_platform_id
        WHERE p.user_id=p_user_id AND p.business_id=p_business_id AND p.is_active
          AND sp.code IN ('facebook','instagram')
      ))
  ) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='User cannot access this business';
  END IF;

  RETURN QUERY SELECT jsonb_build_object(
    'MetaConnectionId', c.meta_connection_id,
    'BusinessId', c.business_id,
    'Status', CASE WHEN c.token_expires_at <= now() THEN 'Expired' ELSE c.status END,
    'GrantedScopes', c.granted_scopes,
    'TokenExpiresAt', c.token_expires_at,
    'ConnectedAt', c.connected_at,
    'UpdatedAt', c.updated_at
  )
  FROM public.meta_connection c
  WHERE c.business_id=p_business_id AND c.provider='Meta';
END $$;

REVOKE ALL ON public.meta_connection FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.usp_meta_connection_save(uuid,uuid,text,character varying,text[],timestamp with time zone) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.usp_meta_connection_get(uuid,uuid) FROM PUBLIC;
