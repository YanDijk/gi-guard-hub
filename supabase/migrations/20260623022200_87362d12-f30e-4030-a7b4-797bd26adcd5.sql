
CREATE POLICY "Students insert own attendance" ON public.attendances
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students insert own signup" ON public.tournament_signups
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students delete own signup" ON public.tournament_signups
  FOR DELETE TO authenticated
  USING (student_id = auth.uid());
