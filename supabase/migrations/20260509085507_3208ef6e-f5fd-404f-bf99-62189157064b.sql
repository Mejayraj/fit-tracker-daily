CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.strava_connections (
  user_id UUID NOT NULL PRIMARY KEY,
  athlete_id BIGINT NOT NULL,
  athlete_firstname TEXT,
  athlete_lastname TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own strava select" ON public.strava_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own strava delete" ON public.strava_connections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_strava_connections_updated_at
BEFORE UPDATE ON public.strava_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();