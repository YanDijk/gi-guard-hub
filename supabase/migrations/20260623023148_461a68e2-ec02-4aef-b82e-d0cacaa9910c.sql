
-- 1. WIPE
DELETE FROM auth.users;
TRUNCATE TABLE public.attendances, public.classes, public.payments, public.graduations,
  public.tournament_signups, public.tournaments, public.training_photos,
  public.user_roles, public.profiles RESTART IDENTITY CASCADE;

-- 2. ENUMS
DO $$ BEGIN CREATE TYPE public.academy_plan AS ENUM ('starter','pro','elite');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.membership_status AS ENUM ('pending','active','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES (no policies yet)
CREATE TABLE IF NOT EXISTS public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan public.academy_plan NOT NULL DEFAULT 'starter',
  avg_students INTEGER NOT NULL DEFAULT 0,
  branches TEXT,
  purpose TEXT,
  invite_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.membership_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academy_id, user_id)
);

-- 4. GRANTS + RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academies TO authenticated;
GRANT SELECT ON public.academies TO anon;
GRANT ALL ON public.academies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_memberships TO authenticated;
GRANT ALL ON public.academy_memberships TO service_role;

ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_memberships ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
CREATE POLICY "owners manage academy" ON public.academies
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "members read academy" ON public.academies
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.academy_memberships m
      WHERE m.academy_id = academies.id AND m.user_id = auth.uid() AND m.status = 'active')
  );

CREATE POLICY "owner manages memberships" ON public.academy_memberships
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.academies a WHERE a.id = academy_id AND a.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.academies a WHERE a.id = academy_id AND a.owner_id = auth.uid())
  );
CREATE POLICY "user reads own memberships" ON public.academy_memberships
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 6. TRIGGERS
CREATE TRIGGER academies_updated BEFORE UPDATE ON public.academies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER memberships_updated BEFORE UPDATE ON public.academy_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. academy_id columns
ALTER TABLE public.profiles        ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL;
ALTER TABLE public.classes         ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.payments        ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.graduations     ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.tournaments     ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.training_photos ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;

-- 8. SIGNUP: only profile, no role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. HELPERS + RPCs
DROP FUNCTION IF EXISTS public.claim_professor();

CREATE OR REPLACE FUNCTION public.unaccent_safe(t TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT translate(t,
    'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn');
$$;

CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
    regexp_replace(lower(public.unaccent_safe(input)), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.create_academy(
  p_name TEXT, p_avg_students INTEGER, p_branches TEXT, p_purpose TEXT, p_plan public.academy_plan
)
RETURNS public.academies LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  base_slug TEXT; final_slug TEXT; n INT := 0;
  result public.academies;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.academies WHERE owner_id = uid) THEN
    RAISE EXCEPTION 'already owns an academy';
  END IF;
  base_slug := NULLIF(public.slugify(p_name), '');
  IF base_slug IS NULL THEN base_slug := 'academia'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.academies WHERE slug = final_slug) LOOP
    n := n + 1; final_slug := base_slug || '-' || n;
  END LOOP;
  INSERT INTO public.academies (owner_id, name, slug, plan, avg_students, branches, purpose)
  VALUES (uid, p_name, final_slug, COALESCE(p_plan,'starter'), COALESCE(p_avg_students,0), p_branches, p_purpose)
  RETURNING * INTO result;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'professor') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET academy_id = result.id WHERE id = uid;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.get_academy_by_invite(p_token UUID)
RETURNS TABLE(id UUID, name TEXT, slug TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, slug FROM public.academies WHERE invite_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.join_academy_by_token(p_token UUID)
RETURNS public.academy_memberships LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  acad public.academies;
  result public.academy_memberships;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO acad FROM public.academies WHERE invite_token = p_token;
  IF acad.id IS NULL THEN RAISE EXCEPTION 'invalid invite'; END IF;
  INSERT INTO public.academy_memberships (academy_id, user_id, status)
  VALUES (acad.id, uid, 'pending')
  ON CONFLICT (academy_id, user_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_membership(p_membership_id UUID)
RETURNS public.academy_memberships LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); m public.academy_memberships;
BEGIN
  SELECT * INTO m FROM public.academy_memberships WHERE id = p_membership_id;
  IF m.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academies a WHERE a.id = m.academy_id AND a.owner_id = uid) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE public.academy_memberships SET status='active', updated_at=now() WHERE id=p_membership_id RETURNING * INTO m;
  INSERT INTO public.user_roles (user_id, role) VALUES (m.user_id, 'aluno') ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET academy_id = m.academy_id WHERE id = m.user_id;
  RETURN m;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_membership(p_membership_id UUID)
RETURNS public.academy_memberships LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid(); m public.academy_memberships;
BEGIN
  SELECT * INTO m FROM public.academy_memberships WHERE id = p_membership_id;
  IF m.id IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academies a WHERE a.id = m.academy_id AND a.owner_id = uid) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE public.academy_memberships SET status='rejected', updated_at=now() WHERE id=p_membership_id RETURNING * INTO m;
  RETURN m;
END; $$;
