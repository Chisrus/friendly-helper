-- Harden admin access checks for waitlist data.
-- This migration keeps compatibility with legacy schemas by inspecting row JSON.

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid uuid := auth.uid();
    is_admin boolean := false;
BEGIN
    IF current_uid IS NULL THEN
        RETURN false;
    END IF;

    IF to_regclass('public.admin_users') IS NOT NULL THEN
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                FROM public.admin_users au
                WHERE COALESCE(to_jsonb(au)->>'user_id', '') = $1::text
            )
        $query$
        INTO is_admin
        USING current_uid;

        IF is_admin THEN
            RETURN true;
        END IF;
    END IF;

    IF to_regclass('public.user_roles') IS NOT NULL THEN
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE COALESCE(to_jsonb(ur)->>'user_id', '') = $1::text
                  AND lower(COALESCE(to_jsonb(ur)->>'role', '')) = 'admin'
            )
        $query$
        INTO is_admin
        USING current_uid;

        IF is_admin THEN
            RETURN true;
        END IF;
    END IF;

    IF to_regclass('public.profiles') IS NOT NULL THEN
        EXECUTE $query$
            SELECT EXISTS (
                SELECT 1
                FROM public.profiles p
                WHERE (
                    COALESCE(to_jsonb(p)->>'id', '') = $1::text
                    OR COALESCE(to_jsonb(p)->>'user_id', '') = $1::text
                )
                  AND lower(COALESCE(to_jsonb(p)->>'role', '')) = 'admin'
            )
        $query$
        INTO is_admin
        USING current_uid;

        IF is_admin THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

DO $$
BEGIN
    IF to_regclass('public.inscriptions_investisseurs') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can view investor registrations" ON public.inscriptions_investisseurs';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view investor registrations" ON public.inscriptions_investisseurs';
        EXECUTE 'CREATE POLICY "Admins can view investor registrations" ON public.inscriptions_investisseurs FOR SELECT TO authenticated USING (public.is_admin_user())';
    END IF;
END;
$$;

DO $$
BEGIN
    IF to_regclass('public.inscriptions_agriculteurs') IS NOT NULL THEN
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can view farmer registrations" ON public.inscriptions_agriculteurs';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view farmer registrations" ON public.inscriptions_agriculteurs';
        EXECUTE 'CREATE POLICY "Admins can view farmer registrations" ON public.inscriptions_agriculteurs FOR SELECT TO authenticated USING (public.is_admin_user())';
    END IF;
END;
$$;
