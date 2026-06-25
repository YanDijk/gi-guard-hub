
-- MONTHLY PLANS
CREATE TABLE public.monthly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_day int NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 28),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_plans TO authenticated;
GRANT ALL ON public.monthly_plans TO service_role;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View plans in own academy" ON public.monthly_plans FOR SELECT TO authenticated
  USING (academy_id = public.current_academy_id());
CREATE POLICY "Professors manage plans" ON public.monthly_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (public.has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

CREATE TRIGGER set_academy_id BEFORE INSERT ON public.monthly_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_academy_id_default();
CREATE TRIGGER update_monthly_plans_updated_at BEFORE UPDATE ON public.monthly_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add plan_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.monthly_plans(id) ON DELETE SET NULL;

-- STUDENT FEEDBACK
CREATE TABLE public.student_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_feedback TO authenticated;
GRANT ALL ON public.student_feedback TO service_role;
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or professor sees all feedback" ON public.student_feedback FOR SELECT TO authenticated
  USING (academy_id = public.current_academy_id() AND (student_id = auth.uid() OR public.has_role(auth.uid(),'professor')));
CREATE POLICY "Professors manage feedback" ON public.student_feedback FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (public.has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id() AND author_id = auth.uid());

CREATE TRIGGER set_academy_id BEFORE INSERT ON public.student_feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_academy_id_default();

-- Public RPC: list plans by invite token (used by signup form pre-auth)
CREATE OR REPLACE FUNCTION public.get_plans_by_invite(p_token uuid)
RETURNS TABLE(id uuid, name text, amount numeric, due_day int)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT p.id, p.name, p.amount, p.due_day
  FROM public.monthly_plans p
  JOIN public.academies a ON a.id = p.academy_id
  WHERE a.invite_token = p_token AND p.active = true
  ORDER BY p.amount;
$$;

GRANT EXECUTE ON FUNCTION public.get_plans_by_invite(uuid) TO anon, authenticated;
