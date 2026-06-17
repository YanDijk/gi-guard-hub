
CREATE POLICY "Authenticated read training photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'training-photos');
CREATE POLICY "Professors upload training photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'training-photos' AND public.has_role(auth.uid(), 'professor'));
CREATE POLICY "Professors update training photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'training-photos' AND public.has_role(auth.uid(), 'professor'))
  WITH CHECK (bucket_id = 'training-photos' AND public.has_role(auth.uid(), 'professor'));
CREATE POLICY "Professors delete training photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'training-photos' AND public.has_role(auth.uid(), 'professor'));
