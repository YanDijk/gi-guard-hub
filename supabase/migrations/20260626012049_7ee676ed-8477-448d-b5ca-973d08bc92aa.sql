ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS logo_url TEXT;

DROP FUNCTION IF EXISTS public.get_academy_by_invite(uuid);

CREATE OR REPLACE FUNCTION public.get_academy_by_invite(p_token uuid)
RETURNS TABLE(id uuid, name text, slug text, logo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, name, slug, logo_url FROM public.academies WHERE invite_token = p_token;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Academy logos public read') THEN
    CREATE POLICY "Academy logos public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'academy-logos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Academy owners upload logo') THEN
    CREATE POLICY "Academy owners upload logo"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = 'academy-logos'
        AND (storage.foldername(name))[2] = public.current_academy_id()::text
        AND EXISTS (SELECT 1 FROM public.academies a WHERE a.id = public.current_academy_id() AND a.owner_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Academy owners update logo') THEN
    CREATE POLICY "Academy owners update logo"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = 'academy-logos'
        AND (storage.foldername(name))[2] = public.current_academy_id()::text
      );
  END IF;
END $$;
