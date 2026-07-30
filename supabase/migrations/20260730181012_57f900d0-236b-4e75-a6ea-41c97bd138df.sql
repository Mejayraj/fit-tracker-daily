CREATE TABLE public.hevy_connections (
  user_id uuid PRIMARY KEY,
  api_key text NOT NULL,
  username text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.hevy_connections TO authenticated;
GRANT ALL ON public.hevy_connections TO service_role;

ALTER TABLE public.hevy_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own hevy connection select" ON public.hevy_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own hevy connection delete" ON public.hevy_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_hevy_connections_updated_at
  BEFORE UPDATE ON public.hevy_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.hevy_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hevy_id text NOT NULL,
  title text NOT NULL DEFAULT 'Workout',
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration_minutes integer NOT NULL DEFAULT 0,
  total_volume_kg numeric NOT NULL DEFAULT 0,
  total_reps integer NOT NULL DEFAULT 0,
  total_sets integer NOT NULL DEFAULT 0,
  calories_estimate integer NOT NULL DEFAULT 0,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, hevy_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hevy_workouts TO authenticated;
GRANT ALL ON public.hevy_workouts TO service_role;

ALTER TABLE public.hevy_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own hevy workouts select" ON public.hevy_workouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own hevy workouts insert" ON public.hevy_workouts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hevy workouts update" ON public.hevy_workouts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own hevy workouts delete" ON public.hevy_workouts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX hevy_workouts_user_start_idx ON public.hevy_workouts (user_id, start_time DESC);

CREATE TRIGGER update_hevy_workouts_updated_at
  BEFORE UPDATE ON public.hevy_workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();