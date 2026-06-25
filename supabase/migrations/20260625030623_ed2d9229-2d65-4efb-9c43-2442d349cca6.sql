
-- Helper: id da academia do usuário atual
CREATE OR REPLACE FUNCTION public.current_academy_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT academy_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Adiciona academy_id nas tabelas que faltavam
ALTER TABLE public.attendances ADD COLUMN IF NOT EXISTS academy_id uuid REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_signups ADD COLUMN IF NOT EXISTS academy_id uuid REFERENCES public.academies(id) ON DELETE CASCADE;

-- Backfill
UPDATE public.attendances a SET academy_id = p.academy_id FROM public.profiles p WHERE p.id = a.student_id AND a.academy_id IS NULL;
UPDATE public.tournament_signups s SET academy_id = p.academy_id FROM public.profiles p WHERE p.id = s.student_id AND s.academy_id IS NULL;

-- Trigger: auto-preenche academy_id no INSERT a partir do usuário atual
CREATE OR REPLACE FUNCTION public.set_academy_id_default()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.academy_id IS NULL THEN
    NEW.academy_id := public.current_academy_id();
  END IF;
  RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['classes','payments','attendances','graduations','tournaments','tournament_signups','training_photos']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_academy_id ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_academy_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_academy_id_default()', t);
  END LOOP;
END $$;

-- PROFILES
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Professors can update any profile" ON public.profiles;
CREATE POLICY "View profiles in own academy" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR academy_id = public.current_academy_id());
CREATE POLICY "Professors update profiles in own academy" ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- CLASSES
DROP POLICY IF EXISTS "Authenticated can view classes" ON public.classes;
DROP POLICY IF EXISTS "Professors manage classes" ON public.classes;
CREATE POLICY "View classes in own academy" ON public.classes FOR SELECT TO authenticated USING (academy_id = public.current_academy_id());
CREATE POLICY "Professors manage classes in own academy" ON public.classes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- PAYMENTS
DROP POLICY IF EXISTS "View own or professor sees all payments" ON public.payments;
DROP POLICY IF EXISTS "Professors manage payments" ON public.payments;
CREATE POLICY "View payments in own academy" ON public.payments FOR SELECT TO authenticated
  USING (academy_id = public.current_academy_id() AND (student_id = auth.uid() OR has_role(auth.uid(),'professor')));
CREATE POLICY "Professors manage payments in own academy" ON public.payments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- ATTENDANCES
DROP POLICY IF EXISTS "View own or professor sees all attendances" ON public.attendances;
DROP POLICY IF EXISTS "Professors manage attendances" ON public.attendances;
DROP POLICY IF EXISTS "Students insert own attendance" ON public.attendances;
CREATE POLICY "View attendances in own academy" ON public.attendances FOR SELECT TO authenticated
  USING (academy_id = public.current_academy_id() AND (student_id = auth.uid() OR has_role(auth.uid(),'professor')));
CREATE POLICY "Students insert own attendance" ON public.attendances FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND academy_id = public.current_academy_id());
CREATE POLICY "Professors manage attendances in own academy" ON public.attendances FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- GRADUATIONS
DROP POLICY IF EXISTS "View own or professor sees all graduations" ON public.graduations;
DROP POLICY IF EXISTS "Professors manage graduations" ON public.graduations;
CREATE POLICY "View graduations in own academy" ON public.graduations FOR SELECT TO authenticated
  USING (academy_id = public.current_academy_id() AND (student_id = auth.uid() OR has_role(auth.uid(),'professor')));
CREATE POLICY "Professors manage graduations in own academy" ON public.graduations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- TOURNAMENTS
DROP POLICY IF EXISTS "Authenticated can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Professors manage tournaments" ON public.tournaments;
CREATE POLICY "View tournaments in own academy" ON public.tournaments FOR SELECT TO authenticated USING (academy_id = public.current_academy_id());
CREATE POLICY "Professors manage tournaments in own academy" ON public.tournaments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- TOURNAMENT_SIGNUPS
DROP POLICY IF EXISTS "View own or professor sees all signups" ON public.tournament_signups;
DROP POLICY IF EXISTS "Professors manage signups" ON public.tournament_signups;
DROP POLICY IF EXISTS "Students insert own signup" ON public.tournament_signups;
DROP POLICY IF EXISTS "Students delete own signup" ON public.tournament_signups;
CREATE POLICY "View signups in own academy" ON public.tournament_signups FOR SELECT TO authenticated
  USING (academy_id = public.current_academy_id() AND (student_id = auth.uid() OR has_role(auth.uid(),'professor')));
CREATE POLICY "Students insert own signup" ON public.tournament_signups FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND academy_id = public.current_academy_id());
CREATE POLICY "Students delete own signup" ON public.tournament_signups FOR DELETE TO authenticated
  USING (student_id = auth.uid() AND academy_id = public.current_academy_id());
CREATE POLICY "Professors manage signups in own academy" ON public.tournament_signups FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());

-- TRAINING_PHOTOS
DROP POLICY IF EXISTS "Authenticated can view photos" ON public.training_photos;
DROP POLICY IF EXISTS "Professors manage photos" ON public.training_photos;
CREATE POLICY "View photos in own academy" ON public.training_photos FOR SELECT TO authenticated USING (academy_id = public.current_academy_id());
CREATE POLICY "Professors manage photos in own academy" ON public.training_photos FOR ALL TO authenticated
  USING (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id())
  WITH CHECK (has_role(auth.uid(),'professor') AND academy_id = public.current_academy_id());
