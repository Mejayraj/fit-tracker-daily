
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_weight_kg numeric;

CREATE TABLE IF NOT EXISTS public.workout_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own routines select" ON public.workout_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own routines insert" ON public.workout_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own routines update" ON public.workout_routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own routines delete" ON public.workout_routines FOR DELETE USING (auth.uid() = user_id);
