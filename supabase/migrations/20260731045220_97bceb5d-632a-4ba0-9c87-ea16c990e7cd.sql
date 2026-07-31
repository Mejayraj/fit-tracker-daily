REVOKE INSERT, UPDATE ON public.hevy_connections FROM authenticated;
REVOKE ALL ON public.hevy_connections FROM anon;
GRANT SELECT, DELETE ON public.hevy_connections TO authenticated;
GRANT ALL ON public.hevy_connections TO service_role;

DROP POLICY IF EXISTS "no client inserts on hevy connections" ON public.hevy_connections;
CREATE POLICY "no client inserts on hevy connections"
ON public.hevy_connections FOR INSERT TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "no client updates on hevy connections" ON public.hevy_connections;
CREATE POLICY "no client updates on hevy connections"
ON public.hevy_connections FOR UPDATE TO authenticated, anon
USING (false) WITH CHECK (false);