-- Auditoría previa de datos persistidos.
-- Solo lectura: no modifica ni elimina información.
-- Ejecutar sobre la base PostgreSQL del entorno antes de depurar registros de prueba.

SELECT 'app_user' AS entity, count(*) AS total FROM public.app_user
UNION ALL SELECT 'business', count(*) FROM public.business
UNION ALL SELECT 'social_account', count(*) FROM public.social_account
UNION ALL SELECT 'external_connection', count(*) FROM public.external_connection
UNION ALL SELECT 'user_business_platform_permission', count(*) FROM public.user_business_platform_permission
UNION ALL SELECT 'user_invitation', count(*) FROM public.user_invitation
UNION ALL SELECT 'email_outbox', count(*) FROM public.email_outbox
UNION ALL SELECT 'auth_session', count(*) FROM public.auth_session
UNION ALL SELECT 'meta_connection', count(*) FROM public.meta_connection
ORDER BY entity;

-- Usuarios: revisar qué cuentas son de prueba antes de eliminarlas.
SELECT user_id, email, display_name, role, is_active, created_at
FROM public.app_user
ORDER BY created_at;

-- Comercios: revisar nombres y fechas; no borrar un comercio real.
SELECT business_id, name, status, created_at
FROM public.business
ORDER BY created_at;

-- Cuentas sociales y su estado; nunca se muestran ni consultan tokens.
SELECT a.social_account_id, b.name AS business_name, p.code AS platform,
       a.external_account_id, a.name AS account_name, a.status, a.created_at
FROM public.social_account a
JOIN public.business b ON b.business_id=a.business_id
JOIN public.social_platform p ON p.social_platform_id=a.social_platform_id
ORDER BY a.created_at;

-- Conexiones OAuth de Meta: solo metadatos no sensibles.
SELECT meta_connection_id, business_id, provider, status, connected_at, token_expires_at, created_at
FROM public.meta_connection
ORDER BY created_at;

-- Catálogo de plataformas. Son datos estructurales y deben conservarse.
SELECT social_platform_id, code, name, is_active
FROM public.social_platform
ORDER BY social_platform_id;
