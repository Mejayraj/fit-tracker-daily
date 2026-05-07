CREATE TABLE public.fasting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fasting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own fasts" ON public.fasting_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own fasts" ON public.fasting_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own fasts" ON public.fasting_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own fasts" ON public.fasting_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_fasting_user_start ON public.fasting_sessions(user_id, start_at DESC);