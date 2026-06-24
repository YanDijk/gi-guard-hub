CREATE OR REPLACE FUNCTION public.is_academy_owner(p_academy_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academies a
    WHERE a.id = p_academy_id
      AND a.owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_academy_member(p_academy_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academy_memberships m
    WHERE m.academy_id = p_academy_id
      AND m.user_id = p_user_id
      AND m.status = 'active'
  );
$$;

DROP POLICY IF EXISTS "owners manage academy" ON public.academies;
DROP POLICY IF EXISTS "members read academy" ON public.academies;
DROP POLICY IF EXISTS "owner manages memberships" ON public.academy_memberships;
DROP POLICY IF EXISTS "user reads own memberships" ON public.academy_memberships;

CREATE POLICY "owners manage academy" ON public.academies
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "members read academy" ON public.academies
  FOR SELECT TO authenticated
  USING (public.is_active_academy_member(id, auth.uid()));

CREATE POLICY "owner manages memberships" ON public.academy_memberships
  FOR ALL TO authenticated
  USING (public.is_academy_owner(academy_id, auth.uid()))
  WITH CHECK (public.is_academy_owner(academy_id, auth.uid()));

CREATE POLICY "user reads own memberships" ON public.academy_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());