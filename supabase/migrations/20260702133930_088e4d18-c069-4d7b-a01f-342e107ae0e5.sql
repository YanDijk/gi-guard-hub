
CREATE TABLE IF NOT EXISTS public.class_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','confirmed','no_show','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id, class_date)
);

CREATE INDEX IF NOT EXISTS idx_class_rsvps_academy_date ON public.class_rsvps (academy_id, class_date);
CREATE INDEX IF NOT EXISTS idx_class_rsvps_student ON public.class_rsvps (student_id, class_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_rsvps TO authenticated;
GRANT ALL ON public.class_rsvps TO service_role;

ALTER TABLE public.class_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students manage own rsvps in their academy"
  ON public.class_rsvps FOR ALL
  TO authenticated
  USING (
    student_id = auth.uid()
    AND academy_id = public.current_academy_id()
  )
  WITH CHECK (
    student_id = auth.uid()
    AND academy_id = public.current_academy_id()
  );

CREATE POLICY "academy staff manage all rsvps"
  ON public.class_rsvps FOR ALL
  TO authenticated
  USING (
    academy_id = public.current_academy_id()
    AND EXISTS (
      SELECT 1 FROM public.academies a
      WHERE a.id = academy_id AND a.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    academy_id = public.current_academy_id()
    AND EXISTS (
      SELECT 1 FROM public.academies a
      WHERE a.id = academy_id AND a.owner_id = auth.uid()
    )
  );

CREATE TRIGGER set_class_rsvps_academy
  BEFORE INSERT ON public.class_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_academy_id_default();

CREATE TRIGGER update_class_rsvps_updated_at
  BEFORE UPDATE ON public.class_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
