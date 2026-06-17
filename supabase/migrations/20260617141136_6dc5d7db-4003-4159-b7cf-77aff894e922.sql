
ALTER TABLE public.profiles
  ADD COLUMN monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN due_day SMALLINT NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 28),
  ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Todos',
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  duration_min SMALLINT NOT NULL DEFAULT 60,
  capacity SMALLINT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Professors manage classes" ON public.classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE TABLE public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  attended_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_id, attended_on)
);
CREATE INDEX attendances_student_date_idx ON public.attendances (student_id, attended_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendances TO authenticated;
GRANT ALL ON public.attendances TO service_role;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or professor sees all attendances" ON public.attendances FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'professor'));
CREATE POLICY "Professors manage attendances" ON public.attendances FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reference_month DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, reference_month)
);
CREATE INDEX payments_month_idx ON public.payments (reference_month DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or professor sees all payments" ON public.payments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'professor'));
CREATE POLICY "Professors manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE TABLE public.graduations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_belt public.belt NOT NULL,
  from_stripes SMALLINT NOT NULL DEFAULT 0,
  to_belt public.belt NOT NULL,
  to_stripes SMALLINT NOT NULL DEFAULT 0,
  ceremony_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX graduations_student_idx ON public.graduations (student_id, ceremony_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.graduations TO authenticated;
GRANT ALL ON public.graduations TO service_role;
ALTER TABLE public.graduations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or professor sees all graduations" ON public.graduations FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'professor'));
CREATE POLICY "Professors manage graduations" ON public.graduations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  event_date DATE NOT NULL,
  registration_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view tournaments" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Professors manage tournaments" ON public.tournaments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE TYPE public.signup_status AS ENUM ('recomendado','convocado','inscrito');

CREATE TABLE public.tournament_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.signup_status NOT NULL DEFAULT 'recomendado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_signups TO authenticated;
GRANT ALL ON public.tournament_signups TO service_role;
ALTER TABLE public.tournament_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or professor sees all signups" ON public.tournament_signups FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'professor'));
CREATE POLICY "Professors manage signups" ON public.tournament_signups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE TABLE public.training_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_path TEXT NOT NULL,
  caption TEXT,
  taken_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX training_photos_date_idx ON public.training_photos (taken_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_photos TO authenticated;
GRANT ALL ON public.training_photos TO service_role;
ALTER TABLE public.training_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view photos" ON public.training_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Professors manage photos" ON public.training_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'professor')) WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE OR REPLACE FUNCTION public.claim_professor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  has_any_professor BOOLEAN;
BEGIN
  IF uid IS NULL THEN RETURN FALSE; END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'professor') INTO has_any_professor;
  IF has_any_professor THEN
    RETURN EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'professor');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'professor') ON CONFLICT DO NOTHING;
  RETURN TRUE;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_professor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_professor() TO authenticated;
